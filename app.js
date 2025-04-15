// app.js

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
  const modalText = document.getElementById("modalText");
  modalText.textContent = type === "task" ? "新しいタスクを追加しますか？" : "伝言メモを追加しますか？";
  modal.dataset.type = type;
  modal.style.display = "flex";
  modal.classList.remove("hidden");
}

function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
}

function confirmModal() {
  const type = document.getElementById("modal").dataset.type;
  hideModal();
  if (type === "task") {
    addTask();
  } else if (type === "memo") {
    addMemo();
  }
}

function addTask() {
  const task = prompt("タスク名を入力してください：");
  if (task) {
    const taskDiv = document.createElement("div");
    taskDiv.textContent = task;
    taskDiv.className = "task-item";
    document.getElementById("tasks").appendChild(taskDiv);
  }
}

function addMemo() {
  const memo = prompt("伝言メモを入力してください：");
  if (memo) {
    const memoDiv = document.createElement("div");
    memoDiv.textContent = memo;
    memoDiv.className = "memo-item";
    document.getElementById("memos").appendChild(memoDiv);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
});
