// Unit tests for GitHub TODO App

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Mock fetch
let fetchMock = null;
const mockFetch = (fn) => { fetchMock = fn; };

// Setup globals before requiring app
global.localStorage = localStorageMock;
global.fetch = (...args) => fetchMock(...args);
global.atob = (str) => Buffer.from(str, 'base64').toString('utf-8');
global.btoa = (str) => Buffer.from(str, 'utf-8').toString('base64');

const app = require('./app.js');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    localStorageMock.clear();
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(message || 'Expected true but got false');
  }
}

// --- Tests ---

console.log('\n--- Config Storage Tests ---\n');

test('saveConfig stores config in localStorage when rememberToken is true', () => {
  const config = { username: 'testuser', repo: 'my-todos', token: 'ghp_test' };
  app.saveConfig(config, true);
  const stored = JSON.parse(localStorageMock.getItem('github-todo-config'));
  assertEqual(stored, config);
});

test('saveConfig does not store token when rememberToken is false', () => {
  const config = { username: 'testuser', repo: 'my-todos', token: 'ghp_test' };
  app.saveConfig(config, false);
  const stored = localStorageMock.getItem('github-todo-config');
  assertEqual(stored, null);
  // But should still remember username/repo
  const remembered = JSON.parse(localStorageMock.getItem('github-todo-remember'));
  assertEqual(remembered.username, 'testuser');
  assertEqual(remembered.repo, 'my-todos');
});

test('loadConfig returns null when no config exists', () => {
  const result = app.loadConfig();
  assertEqual(result, null);
});

test('loadConfig returns stored config', () => {
  const config = { username: 'testuser', repo: 'my-todos', token: 'ghp_test' };
  localStorageMock.setItem('github-todo-config', JSON.stringify(config));
  const result = app.loadConfig();
  assertEqual(result, config);
});

test('clearConfig removes config from localStorage', () => {
  localStorageMock.setItem('github-todo-config', '{"test": true}');
  app.clearConfig();
  assertEqual(localStorageMock.getItem('github-todo-config'), null);
});

console.log('\n--- HTML Escaping Tests ---\n');

test('escapeHtml escapes special characters', () => {
  // Mock document.createElement for Node.js
  global.document = {
    createElement: () => {
      let text = '';
      return {
        set textContent(val) { text = val; },
        get innerHTML() {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        },
      };
    },
  };
  const result = app.escapeHtml('<script>alert("xss")</script>');
  assertTrue(!result.includes('<script>'), 'Should escape script tags');
  assertTrue(result.includes('&lt;'), 'Should contain escaped characters');
});

test('escapeHtml handles normal text', () => {
  global.document = {
    createElement: () => {
      let text = '';
      return {
        set textContent(val) { text = val; },
        get innerHTML() { return text; },
      };
    },
  };
  const result = app.escapeHtml('Hello World');
  assertEqual(result, 'Hello World');
});

console.log('\n--- GitHub API Tests ---\n');

test('githubRequest makes correct API call', async () => {
  app.setState({ config: { username: 'testuser', repo: 'my-todos', token: 'ghp_test' }, todos: [], fileSha: null });

  let capturedUrl, capturedOptions;
  mockFetch((url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
    });
  });

  const result = await app.githubRequest('GET', '/contents/todos.json');

  assertEqual(capturedUrl, 'https://api.github.com/repos/testuser/my-todos/contents/todos.json');
  assertEqual(capturedOptions.method, 'GET');
  assertTrue(capturedOptions.headers['Authorization'].includes('ghp_test'));
  assertTrue(result.ok, 'Should return ok: true for successful requests');
});

test('fetchTodos returns empty array for 404', async () => {
  app.setState({ config: { username: 'testuser', repo: 'my-todos', token: 'ghp_test' }, todos: [], fileSha: null });

  mockFetch(() => Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve(null),
  }));

  const result = await app.fetchTodos();
  assertEqual(result, { todos: [], sha: null });
});

test('fetchTodos parses todos from GitHub response', async () => {
  app.setState({ config: { username: 'testuser', repo: 'my-todos', token: 'ghp_test' }, todos: [], fileSha: null });

  const todosData = { todos: [{ id: 1, text: 'Test todo', done: false }] };
  const content = global.btoa(JSON.stringify(todosData));

  mockFetch(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ content, sha: 'abc123' }),
  }));

  const result = await app.fetchTodos();
  assertEqual(result.todos, todosData.todos);
  assertEqual(result.sha, 'abc123');
});

test('saveTodos sends correct request to GitHub', async () => {
  app.setState({ config: { username: 'testuser', repo: 'my-todos', token: 'ghp_test' }, todos: [], fileSha: null });

  let capturedBody;
  mockFetch((url, options) => {
    capturedBody = JSON.parse(options.body);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: { sha: 'newsha123' } }),
    });
  });

  const todos = [{ id: 1, text: 'Test', done: false }];
  const result = await app.saveTodos(todos, 'oldsha123');

  assertEqual(result, 'newsha123');
  assertEqual(capturedBody.sha, 'oldsha123');
  assertTrue(capturedBody.message.includes('Update todos'));

  // Verify content is base64 encoded todos
  const decoded = JSON.parse(global.atob(capturedBody.content));
  assertEqual(decoded.todos, todos);
});

test('saveTodos omits sha for new file', async () => {
  app.setState({ config: { username: 'testuser', repo: 'my-todos', token: 'ghp_test' }, todos: [], fileSha: null });

  let capturedBody;
  mockFetch((url, options) => {
    capturedBody = JSON.parse(options.body);
    return Promise.resolve({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ content: { sha: 'newsha' } }),
    });
  });

  await app.saveTodos([{ id: 1, text: 'Test', done: false }], null);
  assertTrue(!('sha' in capturedBody), 'Should not include sha for new file');
});

test('saveTodos throws error on failure', async () => {
  app.setState({ config: { username: 'testuser', repo: 'my-todos', token: 'ghp_test' }, todos: [], fileSha: null });

  mockFetch(() => Promise.resolve({
    ok: false,
    status: 422,
    json: () => Promise.resolve({ message: 'Validation failed' }),
  }));

  let errorThrown = false;
  try {
    await app.saveTodos([{ id: 1, text: 'Test', done: false }], null);
  } catch (e) {
    errorThrown = true;
    assertTrue(e.message.includes('Validation failed'), 'Should include error message');
  }
  assertTrue(errorThrown, 'Should throw error on failure');
});

console.log('\n--- Summary ---\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
