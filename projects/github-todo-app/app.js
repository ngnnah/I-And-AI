// GitHub TODO App - Core Logic

const STORAGE_KEY = 'github-todo-config';
const TODOS_FILE = 'todos.json';

let config = null;
let todos = [];
let fileSha = null;

// --- Storage ---

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function loadConfig() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
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

async function saveTodos(todos, sha) {
  const content = btoa(JSON.stringify({ todos }, null, 2));
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

  config = { username, repo, token };

  try {
    // Verify credentials by fetching repo
    await githubRequest('GET', '');
    saveConfig(config);
    showApp();
  } catch (error) {
    showError('auth-error', `Connection failed: ${error.message}`);
    config = null;
  } finally {
    document.getElementById('login-btn').disabled = false;
  }
}

function logout() {
  clearConfig();
  config = null;
  todos = [];
  fileSha = null;
  document.getElementById('auth-form').classList.remove('hidden');
  document.getElementById('todo-app').classList.add('hidden');
  document.getElementById('username').value = '';
  document.getElementById('token').value = '';
}

async function showApp() {
  document.getElementById('auth-form').classList.add('hidden');
  document.getElementById('todo-app').classList.remove('hidden');
  document.getElementById('user-display').textContent = `${config.username}/${config.repo}`;

  setLoading(true);
  try {
    const result = await fetchTodos();
    todos = result.todos;
    fileSha = result.sha;
    renderTodos();
  } catch (error) {
    showError('app-error', `Failed to load todos: ${error.message}`);
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

  try {
    fileSha = await saveTodos(todos, fileSha);
  } catch (error) {
    todos.pop();
    renderTodos();
    showError('app-error', `Failed to save: ${error.message}`);
  }
}

async function toggleTodo(index) {
  hideError('app-error');
  todos[index].done = !todos[index].done;
  renderTodos();

  try {
    fileSha = await saveTodos(todos, fileSha);
  } catch (error) {
    todos[index].done = !todos[index].done;
    renderTodos();
    showError('app-error', `Failed to save: ${error.message}`);
  }
}

async function deleteTodo(index) {
  hideError('app-error');
  const removed = todos.splice(index, 1)[0];
  renderTodos();

  try {
    fileSha = await saveTodos(todos, fileSha);
  } catch (error) {
    todos.splice(index, 0, removed);
    renderTodos();
    showError('app-error', `Failed to save: ${error.message}`);
  }
}

// --- Init ---

function init() {
  config = loadConfig();
  if (config) {
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
