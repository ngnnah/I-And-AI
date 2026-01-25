// GitHub TODO App - Core Logic

const STORAGE_KEY = 'github-todo-config';
const REMEMBER_KEY = 'github-todo-remember';
const TODOS_FILE = 'todos.json';

let config = null;
let todos = [];
let fileSha = null;

// --- Storage ---

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  // Also save username/repo for remembering after disconnect
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({
    username: cfg.username,
    repo: cfg.repo
  }));
}

function loadConfig() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function loadRemembered() {
  const stored = localStorage.getItem(REMEMBER_KEY);
  return stored ? JSON.parse(stored) : null;
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
  // Keep remembered username/repo
}

// --- GitHub API ---

async function githubRequest(method, path, body = null) {
  const url = `https://api.github.com/repos/${config.username}/${config.repo}${path}`;
  const headers = {
    'Authorization': `token ${config.token}`,
    'Accept': 'application/vnd.github.v3+json',
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok && response.status !== 404) {
    throw new Error(data?.message || `GitHub API error: ${response.status}`);
  }
  return { status: response.status, data, ok: response.ok };
}

async function fetchTodos() {
  const { status, data } = await githubRequest('GET', `/contents/${TODOS_FILE}`);
  if (status === 404) {
    return { todos: [], sha: null };
  }
  const content = JSON.parse(atob(data.content));
  return { todos: content.todos || [], sha: data.sha };
}

async function saveTodos(todosToSave, sha) {
  const content = btoa(JSON.stringify({ todos: todosToSave }, null, 2));
  const body = {
    message: `Update todos: ${new Date().toISOString()}`,
    content,
  };
  if (sha) {
    body.sha = sha;
  }
  const { data, ok } = await githubRequest('PUT', `/contents/${TODOS_FILE}`, body);
  if (!ok || !data?.content?.sha) {
    throw new Error(data?.message || 'Failed to save file');
  }
  return data.content.sha;
}

// --- UI Helpers ---

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.display = 'block';
}

function hideError(elementId) {
  document.getElementById(elementId).style.display = 'none';
}

function showStatus(message, type = '') {
  const el = document.getElementById('status-bar');
  if (el) {
    el.textContent = message;
    el.className = 'status-bar' + (type ? ' ' + type : '');
  }
}

function renderTodos() {
  const container = document.getElementById('todo-container');
  if (todos.length === 0) {
    container.innerHTML = '<div class="empty">No todos yet. Add one above!</div>';
    return;
  }
  const html = `<ul class="todo-list">${todos.map((todo, i) => `
    <li class="todo-item ${todo.done ? 'done' : ''}" data-id="${todo.id}">
      <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${i})">
      <span class="text">${escapeHtml(todo.text)}</span>
      <button class="danger" onclick="deleteTodo(${i})">Delete</button>
    </li>
  `).join('')}</ul>`;
  container.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setLoading(isLoading) {
  const container = document.getElementById('todo-container');
  if (isLoading) {
    container.innerHTML = '<div class="loading">Loading...</div>';
  }
}

// --- Actions ---

async function login() {
  const username = document.getElementById('username').value.trim();
  const repo = document.getElementById('repo').value.trim();
  const token = document.getElementById('token').value.trim();

  if (!username || !repo || !token) {
    showError('auth-error', 'Please fill in all fields');
    return;
  }

  hideError('auth-error');
  document.getElementById('login-btn').disabled = true;
  document.getElementById('login-btn').textContent = 'Connecting...';

  config = { username, repo, token };

  try {
    // Verify credentials by fetching repo
    await githubRequest('GET', '');
    saveConfig(config);
    showApp();
  } catch (error) {
    let message = error.message;
    // Provide helpful suggestions based on error
    if (message.includes('Bad credentials')) {
      message = 'Invalid token. Please check your Personal Access Token.';
    } else if (message.includes('Not Found')) {
      message = `Repository "${repo}" not found. Check the repo name and ensure your token has access to it.`;
    } else if (message.includes('not accessible')) {
      message = 'Token doesn\'t have access. Ensure your fine-grained PAT has "Contents: Read and write" permission.';
    }
    showError('auth-error', message);
    config = null;
  } finally {
    document.getElementById('login-btn').disabled = false;
    document.getElementById('login-btn').textContent = 'Connect to GitHub';
  }
}

function logout() {
  clearConfig();
  config = null;
  todos = [];
  fileSha = null;
  document.getElementById('auth-form').classList.remove('hidden');
  document.getElementById('todo-app').classList.add('hidden');
  // Keep username/repo pre-filled, clear only token
  document.getElementById('token').value = '';
}

async function showApp() {
  document.getElementById('auth-form').classList.add('hidden');
  document.getElementById('todo-app').classList.remove('hidden');
  document.getElementById('user-display').textContent = `${config.username}/${config.repo}`;
  document.getElementById('repo-link').href = `https://github.com/${config.username}/${config.repo}`;

  setLoading(true);
  showStatus('Loading todos...');
  try {
    const result = await fetchTodos();
    todos = result.todos;
    fileSha = result.sha;
    renderTodos();
    showStatus(todos.length > 0 ? `${todos.length} todo${todos.length === 1 ? '' : 's'} loaded` : '', 'success');
  } catch (error) {
    showError('app-error', `Failed to load todos: ${error.message}`);
    showStatus('');
  }
}

async function addTodo() {
  const input = document.getElementById('new-todo');
  const text = input.value.trim();
  if (!text) return;

  hideError('app-error');
  const newTodo = {
    id: Date.now(),
    text,
    done: false,
    created: new Date().toISOString().split('T')[0],
  };

  todos.push(newTodo);
  renderTodos();
  input.value = '';
  showStatus('Saving...', '');

  try {
    fileSha = await saveTodos(todos, fileSha);
    showStatus('Saved', 'success');
  } catch (error) {
    todos.pop();
    renderTodos();
    showError('app-error', `Failed to save: ${error.message}`);
    showStatus('Save failed', 'error');
  }
}

async function toggleTodo(index) {
  hideError('app-error');
  todos[index].done = !todos[index].done;
  renderTodos();
  showStatus('Saving...', '');

  try {
    fileSha = await saveTodos(todos, fileSha);
    showStatus('Saved', 'success');
  } catch (error) {
    todos[index].done = !todos[index].done;
    renderTodos();
    showError('app-error', `Failed to save: ${error.message}`);
    showStatus('Save failed', 'error');
  }
}

async function deleteTodo(index) {
  hideError('app-error');
  const removed = todos.splice(index, 1)[0];
  renderTodos();
  showStatus('Saving...', '');

  try {
    fileSha = await saveTodos(todos, fileSha);
    showStatus('Saved', 'success');
  } catch (error) {
    todos.splice(index, 0, removed);
    renderTodos();
    showError('app-error', `Failed to save: ${error.message}`);
    showStatus('Save failed', 'error');
  }
}

// --- Init ---

function init() {
  // Pre-fill remembered username/repo
  const remembered = loadRemembered();
  if (remembered) {
    document.getElementById('username').value = remembered.username || '';
    document.getElementById('repo').value = remembered.repo || '';
  }

  // Auto-login if full config exists
  config = loadConfig();
  if (config) {
    // Also pre-fill form in case user disconnects
    document.getElementById('username').value = config.username;
    document.getElementById('repo').value = config.repo;
    showApp();
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveConfig,
    loadConfig,
    clearConfig,
    escapeHtml,
    githubRequest,
    fetchTodos,
    saveTodos,
    // Expose internal state for testing
    getState: () => ({ config, todos, fileSha }),
    setState: (state) => { config = state.config; todos = state.todos; fileSha = state.fileSha; },
  };
}

// Run on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}
