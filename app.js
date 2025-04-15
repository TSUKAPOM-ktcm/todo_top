const passwordField = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginScreen = document.getElementById("login-screen");
const mainApp = document.getElementById("main-app");
const taskListDiv = document.getElementById("task-list");
const memoDisplay = document.getElementById("memo-display");
const todayDisplay = document.getElementById("today-display");

let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let memoText = localStorage.getItem("memo") || "";
let selectedTaskId = null;

loginBtn.addEventListener("click", () => {
  if (passwordField.value === "kotachan") {
    loginScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    updateDate();
    renderTasks();
    memoDisplay.innerText = memoText;
  }
});

// 日付表示
function updateDate() {
  const today = new Date().toISOString().split("T")[0];
  todayDisplay.textContent = today;
}

// タスクモーダル
document.getElementById("add-task-btn").addEventListener("click", () => {
  document.getElementById("task-modal").classList.remove("hidden");
});

document.getElementById("close-task-modal").addEventListener("click", () => {
  document.getElementById("task-modal").classList.add("hidden");
});

document.getElementById("save-task-btn").addEventListener("click", () => {
  const task = {
    id: Date.now(),
    name: document.getElementById("task-name").value,
    status: document.getElementById("task-status").value,
    repeat: document.getElementById("task-repeat").value,
    assignee: document.getElementById("task-assignee").value,
    deadline: document.getElementById("task-deadline").value,
    note: document.getElementById("task-note").value
  };
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  document.getElementById("task-modal").classList.add("hidden");
  renderTasks();
});

// メモモーダル
document.getElementById("memo-btn").addEventListener("click", () => {
  document.getElementById("memo-content").value = memoText;
  document.getElementById("memo-modal").classList.remove("hidden");
});

document.getElementById("close-memo-modal").addEventListener("click", () => {
  document.getElementById("memo-modal").classList.add("hidden");
});

document.getElementById("save-memo-btn").addEventListener("click", () => {
  memoText = document.getElementById("memo-content").value;
  localStorage.setItem("memo", memoText);
  memoDisplay.innerText = memoText;
  document.getElementById("memo-modal").classList.add("hidden");
});

// ステータス変更モーダル
document.getElementById("confirm-status-btn").addEventListener("click", () => {
  const task = tasks.find(t => t.id === selectedTaskId);
  if (task) {
    task.status = "完了";
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }
  document.getElementById("status-modal").classList.add("hidden");
});

document.getElementById("cancel-status-btn").addEventListener("click", () => {
  document.getElementById("status-modal").classList.add("hidden");
});

function renderTasks() {
  taskListDiv.innerHTML = "";
  const grouped = {};
  tasks.forEach(task => {
    if (!grouped[task.assignee]) grouped[task.assignee] = [];
    grouped[task.assignee].push(task);
  });

  for (const assignee in grouped) {
    const section = document.createElement("section");
    const h3 = document.createElement("h3");
    h3.textContent = assignee || "未担当";
    section.appendChild(h3);
    const ul = document.createElement("ul");
    grouped[assignee].forEach(task => {
      const li = document.createElement("li");
      li.textContent = `${task.name} (${task.status})`;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        selectedTaskId = task.id;
        document.getElementById("status-modal").classList.remove("hidden");
      });
      ul.appendChild(li);
    });
    section.appendChild(ul);
    taskListDiv.appendChild(section);
  }
}
