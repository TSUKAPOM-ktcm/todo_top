document.addEventListener("DOMContentLoaded", () => {
  // 初期状態の設定
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("mainScreen").classList.add("hidden");

  document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);
  document.getElementById("eventForm").addEventListener("submit", addEventFromForm);
});

// ログイン
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (email === "test@example.com" && password === "password") {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("mainScreen").classList.remove("hidden");
  } else {
    alert("IDかパスワードが違います");
  }
}

// モーダル操作
function showModal(type) {
  const modal = document.getElementById("modal");
  document.querySelectorAll(".task-form").forEach(f => f.classList.add("hidden"));

  if (type === "task") {
    document.getElementById("taskForm").classList.remove("hidden");
  } else if (type === "memo") {
    document.getElementById("memoForm").classList.remove("hidden");
  } else if (type === "event") {
    document.getElementById("eventForm").classList.remove("hidden");
  } else if (type === "edit") {
    document.getElementById("editForm").classList.remove("hidden");
  }

  modal.classList.remove("hidden");
  modal.style.display = "flex";
  modal.dataset.type = type;
}

function hideModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
}

// タスク追加
function addTaskFromForm(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  const task = { name, status, frequency, assignee, dueDate, note };
  renderTask(task);
  hideModal();
  e.target.reset();
}

function renderTask(task) {
  const overdueArea = document.getElementById("tasks-overdue");

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "完了";
  if (isOverdue) {
    const div = createTaskElement(task);
    overdueArea.appendChild(div);
    return;
  }

  if (task.status === "完了") return;

  const containerId = `tasks-${task.assignee}-${task.status}`;
  const container = document.getElementById(containerId);
  if (!container) return;

  const div = createTaskElement(task);
  container.appendChild(div);
}

function createTaskElement(task) {
  const div = document.createElement("div");
  div.className = "task-item";
  div.innerHTML = `
    <strong>${task.name}</strong><br>
    頻度: ${task.frequency} ／ 完了予定日: ${task.dueDate || ""}<br>
    メモ: ${task.note || ""}
  `;
  div.addEventListener("click", () => openEditModal(task, div));
  return div;
}

function openEditModal(task, element) {
  showModal("edit");
  document.getElementById("editTaskTitle").textContent = task.name;
  document.getElementById("editStatus").value = task.status;
  document.getElementById("editAssignee").value = task.assignee;
  document.getElementById("editDueDate").value = task.dueDate || "";

  document.getElementById("editForm").onsubmit = function (e) {
    e.preventDefault();
    task.status = document.getElementById("editStatus").value;
    task.assignee = document.getElementById("editAssignee").value;
    task.dueDate = document.getElementById("editDueDate").value;
    element.remove();
    renderTask(task);
    hideModal();
  };
}

// メモ追加・クリック
function addMemoFromForm(e) {
  e.preventDefault();
  const memo = document.getElementById("memoText").value;
  if (!memo.trim()) return;

  const div = document.createElement("div");
  div.className = "memo-item";
  div.textContent = memo.length > 100 ? memo.slice(0, 100) + "…" : memo;
  div.dataset.fullText = memo;
  div.addEventListener("click", () => openMemoModal(div));
  document.getElementById("memos").appendChild(div);

  e.target.reset();
  hideModal();
}

function openMemoModal(memoElement) {
  const modal = document.getElementById("memoViewModal");
  document.getElementById("fullMemoText").textContent = memoElement.dataset.fullText;
  document.getElementById("deleteMemoBtn").onclick = function () {
    memoElement.remove();
    hideMemoModal();
  };
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function hideMemoModal() {
  const modal = document.getElementById("memoViewModal");
  modal.classList.add("hidden");
  modal.style.display = "none";
}

// 予定追加
function addEventFromForm(e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const minute = document.getElementById("eventMinute").value;
  const time = hour && minute ? `${hour}:${minute}` : "";
  const content = document.getElementById("eventContent").value;
  const note = document.getElementById("eventNote").value;

  const event = { date, time, content, note };
  renderEvent(event);
  e.target.reset();
  hideModal();
}

function renderEvent(event) {
  const now = new Date();
  const date = new Date(event.date);
  const containerId = date - now <= 7 * 86400000 ? "calendar-week" : "calendar-month";
  const container = document.getElementById(containerId);

  const div = document.createElement("div");
  div.className = "event-item";
  div.textContent = `${event.date} ${event.time || ""} ${event.content}`;
  div.addEventListener("click", () => openEventModal(div, event));
  container.appendChild(div);
}

function openEventModal(div, event) {
  showModal("event");
  document.getElementById("eventDate").value = event.date;
  document.getElementById("eventHour").value = event.time?.split(":")[0] || "";
  document.getElementById("eventMinute").value = event.time?.split(":")[1] || "";
  document.getElementById("eventContent").value = event.content;
  document.getElementById("eventNote").value = event.note;

  document.getElementById("eventForm").onsubmit = function (e) {
    e.preventDefault();
    event.date = document.getElementById("eventDate").value;
    const hour = document.getElementById("eventHour").value;
    const min = document.getElementById("eventMinute").value;
    event.time = hour && min ? `${hour}:${min}` : "";
    event.content = document.getElementById("eventContent").value;
    event.note = document.getElementById("eventNote").value;

    div.textContent = `${event.date} ${event.time || ""} ${event.content}`;
    hideModal();
  };
}
