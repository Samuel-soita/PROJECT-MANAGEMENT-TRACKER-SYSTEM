const baseURL = "http://localhost:3001";
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "admin") {
  alert("Access denied. You must be an admin.");
  window.location.href = "login.html";
}

const modeProjectBtn = document.getElementById("modeProject");
const modeAllBtn = document.getElementById("modeAll");
const projectSelect = document.getElementById("projectSelect");
const projectFilter = document.getElementById("projectFilter");
const taskTableBody = document.getElementById("taskTableBody");
const successMsg = document.getElementById("successMsg");
const userTasksContainer = document.getElementById("userTasksContainer");

let users = [];
let projects = [];
let currentMode = "project";

// On load
document.addEventListener("DOMContentLoaded", async () => {
  await loadUsers();
  await loadProjects();
  await loadAssignedTasks();
});

// Load users
async function loadUsers() {
  const res = await fetch(`${baseURL}/users?role=user`);
  users = await res.json();
}

// Load projects and first project tasks
async function loadProjects() {
  const res = await fetch(`${baseURL}/projects`);
  projects = await res.json();
  projectSelect.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  if (projects.length) loadTasksByProject(projects[0].id);
}

// Load unassigned tasks by project
async function loadTasksByProject(projectId) {
  const res = await fetch(`${baseURL}/tasks?projectId=${projectId}&assignedTo=null`);
  const tasks = await res.json();
  renderTaskTable(tasks);
}

// Load all unassigned tasks
async function loadAllUnassignedTasks() {
  const res = await fetch(`${baseURL}/tasks?assignedTo=null`);
  const tasks = await res.json();
  renderTaskTable(tasks);
}

// Render task assignment table
function renderTaskTable(tasks) {
  taskTableBody.innerHTML = "";

  if (!tasks.length) {
    taskTableBody.innerHTML = `<tr><td colspan="5">No unassigned tasks found.</td></tr>`;
    return;
  }

  for (const task of tasks) {
    const userOptions = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.title}</td>
      <td>${task.deadline}</td>
      <td>${task.priority}</td>
      <td>
        <select data-task-id="${task.id}" class="user-select">
          <option value="">-- Select User --</option>
          ${userOptions}
        </select>
      </td>
      <td>
        <button class="assign-btn" data-task-id="${task.id}">Assign</button>
      </td>
    `;
    taskTableBody.appendChild(row);
  }
}

// Assign task to user
taskTableBody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("assign-btn")) return;

  const taskId = e.target.dataset.taskId;
  const selectEl = document.querySelector(`select[data-task-id="${taskId}"]`);
  const userId = selectEl.value;

  if (!userId) return alert("Please select a user.");

  const [user, task] = await Promise.all([
    fetch(`${baseURL}/users/${userId}`).then(res => res.json()),
    fetch(`${baseURL}/tasks/${taskId}`).then(res => res.json())
  ]);

  const now = new Date().toISOString();

  const updatedTask = {
    ...task,
    assignedTo: parseInt(userId),
    status: "Pending",
    statusLog: [
      ...(task.statusLog || []),
      { status: `Assigned to ${user.name}`, timestamp: now }
    ]
  };

  await fetch(`${baseURL}/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask)
  });

  await logAction(`Assigned task '${task.title}' to ${user.name}`);

  successMsg.textContent = `✅ '${task.title}' assigned to ${user.name}`;
  setTimeout(() => successMsg.textContent = "", 3000);

  // Refresh
  if (currentMode === "project") {
    loadTasksByProject(projectSelect.value);
  } else {
    loadAllUnassignedTasks();
  }

  await loadAssignedTasks(); // Update user summary
});

// Toggle views
modeProjectBtn.addEventListener("click", () => {
  currentMode = "project";
  modeProjectBtn.classList.add("active");
  modeAllBtn.classList.remove("active");
  projectFilter.style.display = "block";
  loadProjects();
});

modeAllBtn.addEventListener("click", () => {
  currentMode = "all";
  modeAllBtn.classList.add("active");
  modeProjectBtn.classList.remove("active");
  projectFilter.style.display = "none";
  loadAllUnassignedTasks();
});

projectSelect.addEventListener("change", (e) => {
  loadTasksByProject(e.target.value);
});

// Log action
async function logAction(action) {
  const payload = {
    action,
    userId: currentUser.id,
    timestamp: new Date().toISOString()
  };

  await fetch(`${baseURL}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

// Load assigned tasks per user
async function loadAssignedTasks() {
  if (!userTasksContainer) return;

  const res = await fetch(`${baseURL}/tasks`);
  const allTasks = await res.json();

  const grouped = users.map(user => {
    const userTasks = allTasks.filter(t => t.assignedTo === user.id);
    return { ...user, tasks: userTasks };
  }).filter(u => u.tasks.length);

  userTasksContainer.innerHTML = "<h2>Assigned Tasks Per User</h2>";

  grouped.forEach(u => {
    const card = document.createElement("div");
    card.className = "user-card";
    card.innerHTML = `
      <h3>${u.name} (${u.email})</h3>
      <ul>
        ${u.tasks.map(t => `
          <li>
            <strong>${t.title}</strong> – 
            Project: ${getProjectName(t.projectId)} | 
            Priority: ${t.priority} | 
            Deadline: ${t.deadline} | 
            Status: ${t.status}
          </li>
        `).join('')}
      </ul>
    `;
    userTasksContainer.appendChild(card);
  });
}

// Helper to get project name
function getProjectName(id) {
  const project = projects.find(p => p.id == id);
  return project ? project.name : "N/A";
}
