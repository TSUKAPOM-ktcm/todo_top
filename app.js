document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
  document.getElementById("mainScreen").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
});

// ログイン処理
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

// モーダル制御
function showModal(type) {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  if (type === "task") {
    modalContent.innerHTML = document.getElementById("taskFormTemplate").innerHTML;
    document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  }
}

// モーダル非表示
function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
}

// タスク追加処理
function addTaskFromForm(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  createTaskElement(name, status, frequency, assignee, dueDate, note);
  hideModal();
}

// タスクアイテム生成
function createTaskElement(name, status, frequency, assignee, dueDate, note) {
  if (status === "完了") return;

  const taskDiv = document.createElement("div");
  taskDiv.className = "task-item";

  const today = new Date();
  const due = dueDate ? new Date(dueDate + "T00:00:00") : null;
  const isOverdue = due && due < today;

  if (isOverdue) {
    taskDiv.innerHTML = `
      <strong>${name}</strong><br>
      メモ: ${note || "なし"}<br>
      完了予定日: ${dueDate || ""}
    `;
    document.getElementById("tasks-overdue").appendChild(taskDiv);
  } else {
    taskDiv.innerHTML = `<strong>${name}</strong>`;
    const id = `tasks-${assignee}-${status}`;
    const container = document.getElementById(id);
    if (container) container.appendChild(taskDiv);
  }

  // 編集モーダル開く
  taskDiv.addEventListener("click", () => {
    alert(`編集画面（仮）\nタスク名: ${name}\n担当: ${assignee}\nステータス: ${status}`);
    // ここに編集モーダルを追加してもOK
  });
}
