// E2E tests for GitHub TODO App using Playwright
// Run with: npx playwright test e2e.test.js

const { test, expect } = require('@playwright/test');

// Helper to start fresh
async function freshStart(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test.describe('GitHub TODO App', () => {
  test('shows auth form on initial load', async ({ page }) => {
    await freshStart(page);
    await expect(page.locator('#auth-form')).toBeVisible();
    await expect(page.locator('#todo-app')).toHaveClass(/hidden/);
  });

  test('validates empty form submission', async ({ page }) => {
    await freshStart(page);
    await page.click('#login-btn');
    await expect(page.locator('#auth-error')).toBeVisible();
    await expect(page.locator('#auth-error')).toContainText('Please fill in all fields');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await freshStart(page);

    // Mock GitHub API to return 401
    await page.route('**/api.github.com/**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Bad credentials' }),
      });
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'invalid-token');
    await page.click('#login-btn');

    await expect(page.locator('#auth-error')).toBeVisible();
    await expect(page.locator('#auth-error')).toContainText('Bad credentials');
  });

  test('successfully connects and shows empty todo list', async ({ page }) => {
    await freshStart(page);

    // Mock GitHub API
    await page.route('**/api.github.com/repos/testuser/my-todos', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'my-todos' }),
      });
    });

    await page.route('**/api.github.com/repos/testuser/my-todos/contents/todos.json', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not Found' }),
        });
      }
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'ghp_validtoken');
    await page.click('#login-btn');

    await expect(page.locator('#todo-app')).not.toHaveClass(/hidden/);
    await expect(page.locator('#auth-form')).toHaveClass(/hidden/);
    await expect(page.locator('#user-display')).toContainText('testuser/my-todos');
    await expect(page.locator('.empty')).toContainText('No todos yet');
  });

  test('loads existing todos from GitHub', async ({ page }) => {
    await freshStart(page);

    const todos = {
      todos: [
        { id: 1, text: 'First todo', done: false },
        { id: 2, text: 'Second todo', done: true },
      ],
    };
    const content = Buffer.from(JSON.stringify(todos)).toString('base64');

    await page.route('**/api.github.com/repos/testuser/my-todos', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api.github.com/repos/testuser/my-todos/contents/todos.json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content, sha: 'abc123' }),
      });
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'ghp_validtoken');
    await page.click('#login-btn');

    await expect(page.locator('.todo-item')).toHaveCount(2);
    await expect(page.locator('.todo-item').first()).toContainText('First todo');
    await expect(page.locator('.todo-item').nth(1)).toContainText('Second todo');
    await expect(page.locator('.todo-item').nth(1)).toHaveClass(/done/);
  });

  test('adds a new todo', async ({ page }) => {
    await freshStart(page);

    // Setup: authenticate and load empty list
    await page.route('**/api.github.com/repos/testuser/my-todos', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    let savedTodos = null;
    await page.route('**/api.github.com/repos/testuser/my-todos/contents/todos.json', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData());
        savedTodos = JSON.parse(Buffer.from(body.content, 'base64').toString());
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: { sha: 'newsha' } }),
        });
      }
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'ghp_validtoken');
    await page.click('#login-btn');

    // Wait for app to load
    await expect(page.locator('.empty')).toBeVisible();

    // Add a todo
    await page.fill('#new-todo', 'My new task');
    await page.click('button:has-text("Add")');

    // Verify UI updated
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-item')).toContainText('My new task');
    await expect(page.locator('#new-todo')).toHaveValue('');

    // Verify saved to GitHub
    expect(savedTodos.todos).toHaveLength(1);
    expect(savedTodos.todos[0].text).toBe('My new task');
    expect(savedTodos.todos[0].done).toBe(false);
  });

  test('toggles todo completion', async ({ page }) => {
    await freshStart(page);

    const initialTodos = { todos: [{ id: 1, text: 'Test todo', done: false }] };
    const content = Buffer.from(JSON.stringify(initialTodos)).toString('base64');

    await page.route('**/api.github.com/repos/testuser/my-todos', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    let savedTodos = null;
    await page.route('**/api.github.com/repos/testuser/my-todos/contents/todos.json', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content, sha: 'abc123' }),
        });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData());
        savedTodos = JSON.parse(Buffer.from(body.content, 'base64').toString());
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: { sha: 'newsha' } }),
        });
      }
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'ghp_validtoken');
    await page.click('#login-btn');

    await expect(page.locator('.todo-item')).toBeVisible();
    await expect(page.locator('.todo-item')).not.toHaveClass(/done/);

    // Toggle checkbox
    await page.locator('.todo-item input[type="checkbox"]').click();

    await expect(page.locator('.todo-item')).toHaveClass(/done/);
    expect(savedTodos.todos[0].done).toBe(true);
  });

  test('deletes a todo', async ({ page }) => {
    await freshStart(page);

    const initialTodos = { todos: [{ id: 1, text: 'Delete me', done: false }] };
    const content = Buffer.from(JSON.stringify(initialTodos)).toString('base64');

    await page.route('**/api.github.com/repos/testuser/my-todos', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    let savedTodos = null;
    await page.route('**/api.github.com/repos/testuser/my-todos/contents/todos.json', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content, sha: 'abc123' }),
        });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData());
        savedTodos = JSON.parse(Buffer.from(body.content, 'base64').toString());
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: { sha: 'newsha' } }),
        });
      }
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'ghp_validtoken');
    await page.click('#login-btn');

    await expect(page.locator('.todo-item')).toBeVisible();

    // Delete the todo
    await page.click('.todo-item button:has-text("Delete")');

    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(page.locator('.empty')).toBeVisible();
    expect(savedTodos.todos).toHaveLength(0);
  });

  test('logout clears state and shows auth form', async ({ page }) => {
    await freshStart(page);

    await page.route('**/api.github.com/repos/testuser/my-todos', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api.github.com/repos/testuser/my-todos/contents/todos.json', (route) => {
      route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'ghp_validtoken');
    await page.click('#login-btn');

    await expect(page.locator('#todo-app')).not.toHaveClass(/hidden/);

    // Click logout
    await page.click('button:has-text("Disconnect")');

    await expect(page.locator('#auth-form')).not.toHaveClass(/hidden/);
    await expect(page.locator('#todo-app')).toHaveClass(/hidden/);
    await expect(page.locator('#username')).toHaveValue('');
  });

  test('persists auth across page reload', async ({ page }) => {
    await freshStart(page);

    await page.route('**/api.github.com/repos/testuser/my-todos', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api.github.com/repos/testuser/my-todos/contents/todos.json', (route) => {
      route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });

    await page.fill('#username', 'testuser');
    await page.fill('#repo', 'my-todos');
    await page.fill('#token', 'ghp_validtoken');
    await page.click('#login-btn');

    await expect(page.locator('#todo-app')).not.toHaveClass(/hidden/);

    // Reload page (routes persist in Playwright)
    await page.reload();

    // Should still be logged in
    await expect(page.locator('#todo-app')).not.toHaveClass(/hidden/);
    await expect(page.locator('#user-display')).toContainText('testuser/my-todos');
  });
});
