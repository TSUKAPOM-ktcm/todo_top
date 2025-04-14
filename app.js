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
    status: document.getElementById("task-status").value,
    time: document.getElementById("task-deadline").value,
    repeat: document.getElementById("task-repeat").value,
    assignee: document.getElementById("task-assignee").value,
    note: document.getElementById("task-note").value,
    date: calendar.getDate().toISOString().split("T")[0],
    completedAt: null // 完了時間を記録するためのフィールド
  };

  // ステータスが「完了」の場合は完了時刻を打刻
  if (task.status === "完了") {
    task.completedAt = new Date().toLocaleString(); // 現在時刻を取得して保存
  }

  taskList.push(task);
  saveTasks();
  renderTasks();
  clearForm();
}

function clearForm() {
  document.getElementById("task-name").value = "";
  document.getElementById("task-status").value = "未対応";
  document.getElementById("task-deadline").value = "";
  document.getElementById("task-repeat").value = "都度";
  document.getElementById("task-assignee").value = "";
  document.getElementById("task-note").value = "";
}

// ✅ 保存・読み込み
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(taskList));
}

function loadTasks() {
  const data = localStorage.getItem("tasks");
  if (data) {
    taskList = JSON.parse(data);
  }
}

// ✅ カレンダー初期化
function initCalendar() {
  calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",
    locale: "ja",
    selectable: true,
    dateClick: function(info) {
      renderSelectedDateTasks(info.dateStr);
    },
    initialDate: new Date() // 初期表示を今日に設定
  });
  calendar.render();
}

// ✅ 選択日のタスク表示
function renderSelectedDateTasks(dateStr) {
  const container = document.getElementById("selected-tasks");
  container.innerHTML = "";
  const tasks = taskList.filter(t => t.date === dateStr);
  tasks.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.time} - ${t.name}（${t.status} / ${t.assignee || "未割り当て"}${t.completedAt ? " / 完了時刻: " + t.completedAt : ""}）`;
    container.appendChild(li);
  });
}

// ✅ 担当者別 & 今日の残っているタスク表示
function renderTasks() {
  const byUser = document.getElementById("tasks-by-user");
  const unassigned = document.getElementById("tasks-unassigned");
  byUser.innerHTML = "";
  unassigned.innerHTML = "";

  const grouped = {};
  taskList.forEach(t => {
    if (t.assignee) {
      if (!grouped[t.assignee]) grouped[t.assignee] = [];
      grouped[t.assignee].push(t);
    } else {
      const li = document.createElement("li");
      li.textContent = `${t.date} ${t.time} - ${t.name}（${t.status}）`;
      unassigned.appendChild(li);
    }
  });

  for (const person in grouped) {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    title.textContent = `👤 ${person}`;
    const ul = document.createElement("ul");
    grouped[person].forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.date} ${t.time} - ${t.name}（${t.status}）`;
      ul.appendChild(li);
    });
    section.appendChild(title);
    section.appendChild(ul);
    byUser.appendChild(section);
  }

  // 今日の残っているタスク
  const today = new Date().toISOString().split("T")[0]; // 今日の日付
  const todayTasks = taskList.filter(t => t.date === today && !t.assignee);
  todayTasks.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.time} - ${t.name}（${t.status}）`;
    unassigned.appendChild(li);
  });
}

// ✅ CSV読み込みの非表示（機能を削除）
function loadCSV(file) {
  // ここは削除したので、実装しない
}
