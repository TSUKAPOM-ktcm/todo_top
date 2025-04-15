// app.js - 伝言メモモーダル対応済み

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

function showModal(type) {
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
  } else if (type === "memo") {
    memoForm.classList.remove("hidden");
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
  const confirmButtons = document.getElementById("confirmButtons");

  taskForm.reset();
  memoForm.reset();
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

function addTaskFromForm(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  const taskDiv = document.createElement("div");
  taskDiv.className = "task-item";
  taskDiv.innerHTML = `
    <strong>${name}</strong><br>
    ステータス: ${status} ／ 頻度: ${frequency} ／ 担当: ${assignee}<br>
    予定日: ${dueDate || "（未設定）"}<br>
    メモ: ${note || "なし"}
  `;

  document.getElementById("tasks").appendChild(taskDiv);
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

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";

  document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);
});
