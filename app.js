// app.js - 担当者別未完了タスクフィールド仕分け対応済み

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (email === "test@example.com" && password === "password") {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("mainScreen").classList.remove("hidden");
  } else {
    alert("IDかパスワードが違います");
  }
}

function showModal(type, taskElement = null) {
  const modal = document.getElementById("modal");
  const taskForm = document.getElementById("taskForm");
  const memoForm = document.getElementById("memoForm");
  const modalText = document.getElementById("modalText");
  const confirmButtons = document.getElementById("confirmButtons");

  taskForm.classList.add("hidden");
  memoForm.classList.add("hidden");
  modalText.style.display = "none";
  confirmButtons.style.display = "none";

  if (type === "task") {
    taskForm.classList.remove("hidden");
    taskForm.dataset.mode = "new";
    taskForm.dataset.taskId = "";
  } else if (type === "memo") {
    memoForm.classList.remove("hidden");
  } else if (type === "edit") {
    const name = taskElement.dataset.name;
    const status = taskElement.dataset.status;
    const assignee = taskElement.dataset.assignee;
    document.getElementById("editStatus").value = status;
    document.getElementById("editAssignee").value = assignee;
    document.getElementById("editTaskId").value = taskElement.id;
    document.getElementById("editForm").classList.remove("hidden");
  } else {
    modalText.style.display = "block";
    confirmButtons.style.display = "flex";
  }

  modal.style.display = "flex";
  modal.classList.remove("hidden");
  modal.dataset.type = type;
}

function hideModal() {
  const modal = document.getElementById("modal");
  const taskForm = document.getElementById("taskForm");
  const memoForm = document.getElementById("memoForm");
  const editForm = document.getElementById("editForm");
  const confirmButtons = document.getElementById("confirmButtons");

  taskForm.reset();
  memoForm.reset();
  editForm.reset();
  taskForm.classList.add("hidden");
  memoForm.classList.add("hidden");
  editForm.classList.add("hidden");
  modal.classList.add("hidden");
  modal.style.display = "none";
  confirmButtons.style.display = "none";
}

function confirmModal() {
  const type = document.getElementById("modal").dataset.type;
  hideModal();
  if (type === "memo") {
    addMemo();
  }
}

function createTaskElement(task) {
  const taskDiv = document.createElement("div");
  taskDiv.className = "task-item";
  taskDiv.id = `task-${Date.now()}`;
  taskDiv.dataset.name = task.name;
  taskDiv.dataset.status = task.status;
  taskDiv.dataset.assignee = task.assignee;
  taskDiv.innerHTML = `<strong class="task-name clickable">${task.name}</strong><br>
    頻度: ${task.frequency} ／ 予定日: ${task.dueDate || "（未設定）"}<br>
    メモ: ${task.note || "なし"}`;

  taskDiv.querySelector(".task-name").onclick = () => showModal("edit", taskDiv);
  return taskDiv;
}

function addTaskFromForm(e) {
  e.preventDefault();
  const task = {
    name: document.getElementById("taskName").value,
    status: document.getElementById("status").value,
    frequency: document.getElementById("frequency").value,
    assignee: document.getElementById("assignee").value,
    dueDate: document.getElementById("dueDate").value,
    note: document.getElementById("note").value,
  };
  if (task.status === "完了") return;
  const fieldId = `tasks-${task.assignee}-${task.status}`;
  const field = document.getElementById(fieldId);
  if (field) {
    const taskElement = createTaskElement(task);
    field.appendChild(taskElement);
  }
  hideModal();
}

function addMemoFromForm(e) {
  e.preventDefault();
  const memo = document.getElementById("memoText").value;
  if (memo.trim()) {
    const memoDiv = document.createElement("div");
    memoDiv.textContent = memo;
    memoDiv.className = "memo-item";
    document.getElementById("memos").appendChild(memoDiv);
  }
  hideModal();
}

function updateTaskFromEdit(e) {
  e.preventDefault();
  const taskId = document.getElementById("editTaskId").value;
  const status = document.getElementById("editStatus").value;
  const assignee = document.getElementById("editAssignee").value;
  const task = document.getElementById(taskId);
  if (!task) return;
  task.dataset.status = status;
  task.dataset.assignee = assignee;

  const fieldId = `tasks-${assignee}-${status}`;
  const newField = document.getElementById(fieldId);
  if (status === "完了") {
    task.remove();
  } else if (newField) {
    newField.appendChild(task);
  }
  hideModal();
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";

  document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);
  document.getElementById("editForm").addEventListener("submit", updateTaskFromEdit);
});
