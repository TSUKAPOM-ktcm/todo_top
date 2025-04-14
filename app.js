let taskList = [];
let calendar;

// ✅ パスワードチェック
function checkPassword() {
  const input = document.getElementById("password").value;
  if (input === "kotachan") {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("main-app").style.display = "block";
    loadTasks();
    initCalendar();
    renderTasks();
  } else {
    document.getElementById("login-error").textContent = "パスワードが違います";
  }
}

// ✅ タスク追加
function addTask() {
  const task = {
    name: document.getElementById("task-name").value,
    status: document.getElementBy
