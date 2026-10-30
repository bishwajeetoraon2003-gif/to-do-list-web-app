/**
 * TaskFlow - Modern To-Do Web Application
 * Handles task management, inline editing, persistent localStorage, and UI states.
 */

// Storage keys
const STORAGE_KEY = 'taskflow_tasks_v1';
const THEME_KEY = 'taskflow_theme';

// Application State
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let editingTaskId = null;

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskPriority = document.getElementById('task-priority');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const themeToggle = document.getElementById('theme-toggle');
const currentDateEl = document.getElementById('current-date');
const searchInput = document.getElementById('search-input');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Stats Elements
const progressStats = document.getElementById('progress-stats');
const progressPercent = document.getElementById('progress-percent');
const progressBarFill = document.getElementById('progress-bar-fill');
const itemsLeftEl = document.getElementById('items-left');
const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');
const tabButtons = document.querySelectorAll('.tab-btn');

/**
 * Initialize application
 */
function init() {
  displayCurrentDate();
  loadTheme();
  loadTasks();
  setupEventListeners();
  render();
}

/**
 * Display formatted current date
 */
function displayCurrentDate() {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const today = new Date().toLocaleDateString(undefined, options);
  currentDateEl.textContent = today;
}

/**
 * Theme Management (Light / Dark)
 */
function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
}

/**
 * Load tasks from LocalStorage
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      tasks = JSON.parse(raw);
    } else {
      // Default welcome tasks for first-time visitors
      tasks = [
        {
          id: 'demo-1',
          text: 'Welcome to TaskFlow! Click the checkmark to mark complete',
          completed: true,
          priority: 'low',
          createdAt: Date.now() - 3600000
        },
        {
          id: 'demo-2',
          text: 'Click the pencil icon or double click to edit any task',
          completed: false,
          priority: 'high',
          createdAt: Date.now() - 1800000
        },
        {
          id: 'demo-3',
          text: 'Create your own task using the input bar above',
          completed: false,
          priority: 'medium',
          createdAt: Date.now()
        }
      ];
      saveTasks();
    }
  } catch (err) {
    console.error('Failed to parse tasks from localStorage', err);
    tasks = [];
  }
}

/**
 * Save current tasks to LocalStorage
 */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to persist tasks to localStorage', err);
  }
}

/**
 * Add a new task
 */
function handleAddTask(e) {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    text,
    completed: false,
    priority: taskPriority.value || 'medium',
    createdAt: Date.now()
  };

  tasks.unshift(newTask);
  saveTasks();
  taskInput.value = '';
  taskInput.focus();
  render();
}

/**
 * Toggle task completion status
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

/**
 * Delete a task with visual animation
 */
function deleteTask(id) {
  const taskElement = document.querySelector(`[data-task-id="${id}"]`);
  if (taskElement) {
    taskElement.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      render();
    }, 220);
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }
}

/**
 * Start editing a task
 */
function startEdit(id) {
  editingTaskId = id;
  render();

  const editInput = document.querySelector(`.edit-input[data-task-id="${id}"]`);
  if (editInput) {
    editInput.focus();
    // Put cursor at end of input
    const val = editInput.value;
    editInput.value = '';
    editInput.value = val;
  }
}

/**
 * Save edited task
 */
function saveEdit(id, newText) {
  const trimmed = newText.trim();
  if (trimmed) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = trimmed;
      saveTasks();
    }
  }
  editingTaskId = null;
  render();
}

/**
 * Cancel editing
 */
function cancelEdit() {
  editingTaskId = null;
  render();
}

/**
 * Clear all completed tasks
 */
function clearCompletedTasks() {
  const completedCount = tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;

  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}

/**
 * Set current active tab filter
 */
function setFilter(filter) {
  currentFilter = filter;
  tabButtons.forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  render();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

/**
 * Render the whole UI based on state
 */
function render() {
  // Compute counts
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;

  // Update Counters & Badges
  countAll.textContent = total;
  countActive.textContent = active;
  countCompleted.textContent = completed;
  itemsLeftEl.textContent = `${active} pending ${active === 1 ? 'task' : 'tasks'}`;

  // Update Progress Bar
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressStats.textContent = `${completed} of ${total} completed`;
  progressPercent.textContent = `${percent}%`;
  progressBarFill.style.width = `${percent}%`;

  // Disable/enable clear button
  clearCompletedBtn.disabled = completed === 0;

  // Filter tasks
  let filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  // Apply search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredTasks = filteredTasks.filter(task => task.text.toLowerCase().includes(q));
  }

  // Handle empty state
  if (filteredTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.remove('hidden');
    if (searchQuery) {
      emptyState.querySelector('.empty-title').textContent = 'No matching tasks';
      emptyState.querySelector('.empty-desc').textContent = `No tasks matching "${escapeHTML(searchQuery)}"`;
    } else if (currentFilter === 'active') {
      emptyState.querySelector('.empty-title').textContent = 'No active tasks';
      emptyState.querySelector('.empty-desc').textContent = 'All done! Enjoy your free time.';
    } else if (currentFilter === 'completed') {
      emptyState.querySelector('.empty-title').textContent = 'No completed tasks';
      emptyState.querySelector('.empty-desc').textContent = 'Check off completed items to see them here.';
    } else {
      emptyState.querySelector('.empty-title').textContent = 'No tasks yet';
      emptyState.querySelector('.empty-desc').textContent = 'Add your first task above to get started!';
    }
  } else {
    emptyState.classList.add('hidden');
    taskList.innerHTML = filteredTasks.map(task => renderTaskItem(task)).join('');
  }
}

/**
 * Generate markup for a single task item
 */
function renderTaskItem(task) {
  const isEditing = editingTaskId === task.id;
  const escapedText = escapeHTML(task.text);

  if (isEditing) {
    return `
      <li class="task-item editing" data-task-id="${task.id}">
        <input 
          type="text" 
          class="edit-input" 
          data-task-id="${task.id}" 
          value="${escapedText}" 
          maxlength="200"
          aria-label="Edit task content"
        />
        <div class="task-actions">
          <button type="button" class="action-btn save-btn" data-action="save" data-task-id="${task.id}" title="Save (Enter)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <button type="button" class="action-btn" data-action="cancel" title="Cancel (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </li>
    `;
  }

  return `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
      <label class="custom-checkbox" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
        <input 
          type="checkbox" 
          ${task.completed ? 'checked' : ''} 
          data-action="toggle" 
          data-task-id="${task.id}" 
          aria-label="Toggle completed status for ${escapedText}"
        />
        <span class="checkbox-visual">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </label>

      <div class="task-content">
        <span class="task-text" data-action="edit" data-task-id="${task.id}" title="Double click to edit">
          ${escapedText}
        </span>
        <span class="priority-tag ${task.priority}">${task.priority}</span>
      </div>

      <div class="task-actions">
        <button type="button" class="action-btn edit-btn" data-action="edit" data-task-id="${task.id}" title="Edit task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>
        <button type="button" class="action-btn delete-btn" data-action="delete" data-task-id="${task.id}" title="Delete task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </li>
  `;
}

/**
 * Global Event Listeners Setup
 */
function setupEventListeners() {
  // Form submission (Add task)
  taskForm.addEventListener('submit', handleAddTask);

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Tab filters
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // Search input
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    render();
  });

  // Clear completed button
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);

  // Delegated Task List events (toggle, edit, delete, double-click)
  taskList.addEventListener('click', e => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const taskId = target.dataset.taskId;

    if (action === 'toggle') {
      toggleTask(taskId);
    } else if (action === 'delete') {
      deleteTask(taskId);
    } else if (action === 'edit') {
      startEdit(taskId);
    } else if (action === 'save') {
      const input = document.querySelector(`.edit-input[data-task-id="${taskId}"]`);
      if (input) saveEdit(taskId, input.value);
    } else if (action === 'cancel') {
      cancelEdit();
    }
  });

  // Double click on task text to edit
  taskList.addEventListener('dblclick', e => {
    const textSpan = e.target.closest('.task-text');
    if (textSpan && textSpan.dataset.taskId) {
      startEdit(textSpan.dataset.taskId);
    }
  });

  // Keyboard controls when inline editing
  taskList.addEventListener('keydown', e => {
    if (e.target.classList.contains('edit-input')) {
      const taskId = e.target.dataset.taskId;
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit(taskId, e.target.value);
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    }
  });
}

// Kick off initialization on DOM ready
document.addEventListener('DOMContentLoaded', init);
