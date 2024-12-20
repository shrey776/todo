class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        this.setupEventListeners();
    }

    // Load tasks from localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
        this.renderTasks();
        this.updateStats();
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.updateStats();
    }

    // Add a new task
    addTask(name, dueDate, priority) {
        if (!this.validateDueDate(dueDate)) {
            this.showNotification('Invalid due date. Please select a future date.');
            return;
        }

        const task = {
            id: Date.now(),
            name,
            dueDate,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.showNotification('Task added successfully!');
    }

    // Delete a task
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.showNotification('Task deleted!');
    }

    // Edit a task
    editTask(id, newName) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.name = newName || task.name; // Retain old name if no input is provided
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task updated!');
        }
    }

    // Toggle task completion
    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                this.playCompletionSound();
                this.showNotification('Task completed! 🎉');
            }
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Check if a task is overdue
    isOverdue(dueDate) {
        return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
    }

    // Update statistics
    updateStats() {
        document.getElementById('total-tasks').textContent = this.tasks.length;
        document.getElementById('completed-tasks').textContent =
            this.tasks.filter(t => t.completed).length;
        document.getElementById('overdue-tasks').textContent =
            this.tasks.filter(t => !t.completed && this.isOverdue(t.dueDate)).length;
    }

    // Render all tasks
    renderTasks() {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = '';

        const filteredAndSortedTasks = this.getFilteredAndSortedTasks();

        filteredAndSortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            todoList.appendChild(taskElement);
        });
    }

    // Create a task DOM element
    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `todo-item ${task.completed ? 'completed' : ''} 
            ${this.isOverdue(task.dueDate) ? 'overdue' : ''}`;
        taskElement.dataset.id = task.id;

        taskElement.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <div class="todo-content">
                <div class="todo-title">${task.name}</div>
                <div class="todo-meta">
                    Due: ${new Date(task.dueDate).toLocaleDateString()}
                    <span class="priority-badge priority-${task.priority}">
                        ${task.priority}
                    </span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn btn-icon" onclick="taskManager.editTask(${task.id}, prompt('Edit task:', '${task.name}'))">
                    ✏️
                </button>
                <button class="btn btn-icon" onclick="taskManager.deleteTask(${task.id})">
                    🗑️
                </button>
            </div>
        `;

        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => this.toggleComplete(task.id));

        return taskElement;
    }

    // Get filtered and sorted tasks
    getFilteredAndSortedTasks() {
        let tasks = [...this.tasks];

        // Apply search filter
        const searchTerm = document.getElementById('search').value.toLowerCase();
        if (searchTerm) {
            tasks = tasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm) ||
                task.priority.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        const sortBy = document.getElementById('sort-select').value;
        tasks.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return tasks;
    }

    // Set up event listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('task-input').value.trim();
            const dueDate = document.getElementById('due-date').value;
            const priority = document.getElementById('priority').value;

            if (name && dueDate) {
                this.addTask(name, dueDate, priority);
                e.target.reset();
            }
        });

        // Search and sort
        document.getElementById('search').addEventListener('input', () => this.renderTasks());
        document.getElementById('sort-select').addEventListener('change', () => this.renderTasks());

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.dataset.theme =
                document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            this.updateThemeIcon();
        });

        // Initialize theme
        this.updateThemeIcon();
    }

    // Update theme icon
    updateThemeIcon() {
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = document.body.dataset.theme === 'dark' ? '☀️' : '🌙';
    }

    // Show a notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: var(--radius);
            box-shadow: var(--shadow-md);
            animation: slideIn 0.3s ease-out forwards;
            z-index: 1000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Play a completion sound
    playCompletionSound() {
        const audio = new Audio('data:audio/mpeg;base64,...'); // Truncated for brevity
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }

    // Validate due date
    validateDueDate(dueDate) {
        const today = new Date().setHours(0, 0, 0, 0);
        const selectedDate = new Date(dueDate).setHours(0, 0, 0, 0);
        return selectedDate >= today;
    }
}

// Initialize the TaskManager
const taskManager = new TaskManager();
