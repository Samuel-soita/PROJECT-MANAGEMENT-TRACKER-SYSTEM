const baseURL = "http://localhost:3001";

// Example way to get currentUser (you should replace this with your actual auth logic)
//const currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// Redirect if not admin
if (!currentUser || currentUser.role !== "admin") {
  alert("Access denied. Admins only.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearchFilters();

  // Load data
  loadProjects();
  loadTasks();
  loadUsers();

  // Setup forms & buttons
  setupProjectForm();
  setupTaskForm();
  setupUserForms();

  setupProjectButtons();
  setupTaskButtons();
  setupUserButtons();

  setupModalCloseListeners();
});

// --- SEARCH FILTERS ---
function setupSearchFilters() {
  const projectSearch = document.getElementById("projectSearch");
  if (projectSearch) {
    projectSearch.addEventListener("input", () => loadProjects(projectSearch.value.trim().toLowerCase()));
  }
  const taskSearch = document.getElementById("taskSearch");
  if (taskSearch) {
    taskSearch.addEventListener("input", () => loadTasks(taskSearch.value.trim().toLowerCase()));
  }
  const userSearch = document.getElementById("userSearch");
  if (userSearch) {
    userSearch.addEventListener("input", () => loadUsers(userSearch.value.trim().toLowerCase()));
  }
}

// --- PROJECT MANAGEMENT ---

async function loadProjects(searchTerm = "") {
  try {
    showLoading("projectsContainer");
    let projects = await fetch(`${baseURL}/projects`).then(res => res.json());

    if (searchTerm) {
      projects = projects.filter(p =>
        p.projectName.toLowerCase().includes(searchTerm) ||
        (p.client && p.client.toLowerCase().includes(searchTerm))
      );
    }

    const container = document.getElementById("projectsContainer");
    container.innerHTML = "";

    if (projects.length === 0) {
      container.innerHTML = "<p>No projects found.</p>";
      return;
    }

    projects.forEach(project => {
      const card = document.createElement("div");
      card.className = "dashboard-card";
      card.innerHTML = `
        <h4>${project.projectName}</h4>
        <p><strong>Client:</strong> ${project.client || "N/A"}</p>
        <p><strong>Status:</strong> ${project.status}</p>
        <p><strong>Start:</strong> ${project.startDate || "N/A"}</p>
        <p><strong>End:</strong> ${project.endDate || "N/A"}</p>
        <div class="action-buttons">
          <button onclick="openProjectModal('${project.id}')">✏️ Edit</button>
          <button onclick="deleteProject('${project.id}')">🗑 Delete</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading projects:", err);
    alert("Failed to load projects.");
  } finally {
    hideLoading("projectsContainer");
  }
}

function setupProjectButtons() {
  const addProjectBtn = document.getElementById("addProjectBtn");
  if (addProjectBtn) addProjectBtn.addEventListener("click", () => openProjectModal());

  const closeBtn = document.getElementById("closeProjectModalBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeModals);
}

async function openProjectModal(projectId = null) {
  const modal = document.getElementById("projectModal");
  if (!modal) return;

  const title = document.getElementById("projectModalTitle");
  const form = document.getElementById("projectForm");

  title.textContent = projectId ? "Edit Project" : "Add Project";

  if (projectId) {
    try {
      const res = await fetch(`${baseURL}/projects/${projectId}`);
      if (!res.ok) throw new Error("Project not found");
      const project = await res.json();

      form.projectId.value = project.id || "";
      form.projectName.value = project.projectName || "";
      form.projectClient.value = project.client || "";
      form.projectDesc.value = project.description || "";
      form.projectStart.value = project.startDate || "";
      form.projectEnd.value = project.endDate || "";
      form.projectStatus.value = project.status || "Planned";
      form.projectRemarks.value = project.remarks || "";
    } catch (err) {
      alert(err.message);
      return;
    }
  } else {
    form.reset();
    form.projectId.value = "";
  }

  modal.style.display = "flex";
}

async function deleteProject(projectId) {
  if (!confirm("Are you sure you want to delete this project?")) return;

  try {
    const res = await fetch(`${baseURL}/projects/${projectId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete project.");

    alert("Project deleted successfully.");
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
}

function setupProjectForm() {
  const form = document.getElementById("projectForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const id = form.projectId.value.trim();
    const projectData = {
      projectName: form.projectName.value.trim(),
      client: form.projectClient.value.trim(),
      description: form.projectDesc.value.trim(),
      startDate: form.projectStart.value,
      endDate: form.projectEnd.value,
      status: form.projectStatus.value,
      remarks: form.projectRemarks.value.trim(),
    };

    try {
      let res;
      if (id) {
        res = await fetch(`${baseURL}/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
      } else {
        res = await fetch(`${baseURL}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
      }

      if (!res.ok) throw new Error("Failed to save project.");

      alert(`Project ${id ? "updated" : "created"} successfully.`);
      closeModals();
      loadProjects();
    } catch (err) {
      alert(err.message);
    }
  });
}

// --- TASK MANAGEMENT ---

async function loadTasks(searchTerm = "") {
  try {
    showLoading("tasksContainer");
    let tasks = await fetch(`${baseURL}/tasks`).then(res => res.json());

    if (searchTerm) {
      tasks = tasks.filter(t =>
        t.taskTitle.toLowerCase().includes(searchTerm) ||
        (t.description && t.description.toLowerCase().includes(searchTerm))
      );
    }

    const container = document.getElementById("tasksContainer");
    container.innerHTML = "";

    if (tasks.length === 0) {
      container.innerHTML = "<p>No tasks found.</p>";
      return;
    }

    tasks.forEach(task => {
      const card = document.createElement("div");
      card.className = "dashboard-card";
      card.innerHTML = `
        <h4>${task.taskTitle}</h4>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Deadline:</strong> ${task.deadline || "N/A"}</p>
        <p><strong>Project:</strong> ${task.projectName || "Unassigned"}</p>
        <div class="action-buttons">
          <button onclick="openTaskModal('${task.id}')">✏️ Edit</button>
          <button onclick="deleteTask('${task.id}')">🗑 Delete</button>
          <button onclick="reassignTask('${task.id}')">🔄 Reassign</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading tasks:", err);
    alert("Failed to load tasks.");
  } finally {
    hideLoading("tasksContainer");
  }
}

function setupTaskButtons() {
  const addTaskBtn = document.getElementById("addTaskBtn");
  if (addTaskBtn) addTaskBtn.addEventListener("click", () => openTaskModal());

  const closeBtn = document.getElementById("closeTaskModalBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeModals);
}

async function openTaskModal(taskId = null) {
  const modal = document.getElementById("taskModal");
  if (!modal) return;

  const title = document.getElementById("taskModalTitle");
  const form = document.getElementById("taskForm");

  title.textContent = taskId ? "Edit Task" : "Add Task";

  if (taskId) {
    try {
      const res = await fetch(`${baseURL}/tasks/${taskId}`);
      if (!res.ok) throw new Error("Task not found");
      const task = await res.json();

      form.taskId.value = task.id || "";
      form.taskTitle.value = task.taskTitle || "";
      form.taskDesc.value = task.description || "";
      form.taskDeadline.value = task.deadline || "";
      form.taskPriority.value = task.priority || "Medium";
      form.taskProject.value = task.projectId || "";
      form.taskRemarks.value = task.remarks || "";
    } catch (err) {
      alert(err.message);
      return;
    }
  } else {
    form.reset();
    form.taskId.value = "";
  }

  await populateTaskProjectOptions();

  modal.style.display = "flex";
}

async function populateTaskProjectOptions() {
  const select = document.getElementById("taskProject");
  if (!select) return;

  try {
    let projects = await fetch(`${baseURL}/projects`).then(r => r.json());
    select.innerHTML = '<option value="">-- Optional: Link to Project --</option>';
    projects.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.projectName;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load projects for task linking:", err);
  }
}

async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    const res = await fetch(`${baseURL}/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete task.");

    alert("Task deleted successfully.");
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
}

function setupTaskForm() {
  const form = document.getElementById("taskForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const id = form.taskId.value.trim();
    const taskData = {
      taskTitle: form.taskTitle.value.trim(),
      description: form.taskDesc.value.trim(),
      deadline: form.taskDeadline.value,
      priority: form.taskPriority.value,
      projectId: form.taskProject.value || null,
      remarks: form.taskRemarks.value.trim(),
    };

    try {
      let res;
      if (id) {
        res = await fetch(`${baseURL}/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
      } else {
        res = await fetch(`${baseURL}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
      }

      if (!res.ok) throw new Error("Failed to save task.");

      alert(`Task ${id ? "updated" : "created"} successfully.`);
      closeModals();
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  });
}

// --- USER MANAGEMENT ---
// Load users and render them with search filter
async function loadUsers(searchTerm = "") {
  try {
    showLoading("usersContainer");
    let users = await fetch(`${baseURL}/users`).then(r => r.json());

    if (searchTerm) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        (u.phone && u.phone.includes(searchTerm))
      );
    }

    const container = document.getElementById("usersContainer");
    if (!container) return; // usersContainer must exist in your HTML

    container.innerHTML = "";

    if (users.length === 0) {
      container.innerHTML = "<p>No users found.</p>";
      return;
    }

    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "dashboard-card";
      card.innerHTML = `
        <h4>${user.name}</h4>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Phone:</strong> ${user.phone || "N/A"}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <div class="action-buttons">
          <button onclick="openUserModal('${user.id}')">✏️ Edit</button>
          <button onclick="deleteUser('${user.id}')">🗑 Delete</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading users:", err);
    alert("Failed to load users.");
  } finally {
    hideLoading("usersContainer");
  }
}

// Open User Modal for add/edit
async function openUserModal(userId = null) {
  const modal = document.getElementById("userModal");
  if (!modal) return;

  const title = document.getElementById("userModalTitle");
  title.textContent = userId ? "Edit User" : "Add User";

  if (userId) {
    try {
      const res = await fetch(`${baseURL}/users/${userId}`);
      if (!res.ok) throw new Error("User not found");
      const user = await res.json();

      document.getElementById("userId").value = user.id;
      document.getElementById("userName").value = user.name || "";
      document.getElementById("userEmail").value = user.email || "";
      document.getElementById("userPhone").value = user.phone || "";
      document.getElementById("userRole").value = user.role || "user";
      document.getElementById("userPassword").value = "";
    } catch (err) {
      alert(err.message);
      return;
    }
  } else {
    document.getElementById("userId").value = "";
    document.getElementById("userName").value = "";
    document.getElementById("userEmail").value = "";
    document.getElementById("userPhone").value = "";
    document.getElementById("userRole").value = "user";
    document.getElementById("userPassword").value = "";
  }

  modal.style.display = "flex";
}

// Close User Modal
function closeUserModal() {
  const modal = document.getElementById("userModal");
  if (modal) modal.style.display = "none";
}

// Setup user form submission for add/edit
function setupUserForms() {
  const form = document.getElementById("userForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const id = document.getElementById("userId").value.trim();
    const userData = {
      name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      phone: document.getElementById("userPhone").value.trim(),
      role: document.getElementById("userRole").value,
    };

    const password = document.getElementById("userPassword").value.trim();
    if (password) userData.password = password;

    try {
      let res;
      if (id) {
        res = await fetch(`${baseURL}/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
      } else {
        if (!password) {
          alert("Password is required for new user.");
          return;
        }
        res = await fetch(`${baseURL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
      }

      if (!res.ok) throw new Error("Failed to save user.");

      alert(`User ${id ? "updated" : "created"} successfully.`);
      closeUserModal();
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  });
}

// Delete user with confirmation
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`${baseURL}/users/${userId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete user.");

    alert("User deleted successfully.");
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

function setupUserButtons() {
  const addUserBtn = document.getElementById("addUserBtn");
  if (addUserBtn) {
    addUserBtn.addEventListener("click", () => openUserModal());
  }
  const closeUserModalBtn = document.getElementById("closeUserModalBtn");
  if (closeUserModalBtn) {
    closeUserModalBtn.addEventListener("click", closeUserModal);
  }

  const userModal = document.getElementById("userModal");
  if (userModal) {
    userModal.addEventListener("click", (e) => {
      if (e.target === userModal) closeUserModal();
    });
  }
}

// --- MODAL CLOSE MANAGEMENT ---

function closeModals() {
  ["projectModal", "taskModal", "userModal"].forEach(id => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
  });
}

function setupModalCloseListeners() {
  ["projectModal", "taskModal", "userModal"].forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModals();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModals();
  });
}

// --- UTILITIES ---
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p>Loading...</p>`;
  }
}
function hideLoading(containerId) {
  // Optional: clear or leave as is
}

// --- REASSIGN TASK FUNCTION ---
async function reassignTask(taskId) {
  const newUserId = prompt("Enter the user ID to reassign this task to:");
  if (!newUserId) {
    alert("Reassignment cancelled.");
    return;
  }

  try {
    // Fetch current task data
    const taskRes = await fetch(`${baseURL}/tasks/${taskId}`);
    if (!taskRes.ok) throw new Error("Task not found.");
    const task = await taskRes.json();

    // Update task with new user assignment
    const updatedTask = { ...task, assignedUserId: newUserId };

    const res = await fetch(`${baseURL}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    });

    if (!res.ok) throw new Error("Failed to reassign task.");

    alert("Task reassigned successfully.");
    loadTasks();
  } catch (error) {
    alert(error.message);
  }
}

// --- EXPOSE GLOBAL FUNCTIONS ---
window.openProjectModal = openProjectModal;
window.deleteProject = deleteProject;
window.openTaskModal = openTaskModal;
window.deleteTask = deleteTask;
window.reassignTask = reassignTask;

window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.deleteUser = deleteUser;

window.closeModals = closeModals;
