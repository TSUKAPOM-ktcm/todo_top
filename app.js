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
    date: calendar.getDate().toISOString().split("T")[0]
  };
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
    }
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
    li.textContent = `${t.time} - ${t.name}（${t.status} / ${t.assignee || "未割り当て"}）`;
    container.appendChild(li);
  });
}

// ✅ 担当者別 & 未割り当て表示
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
}

// ✅ CSV読み込み（定期タスク）
function loadCSV(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split("\n");
    for (let line of lines) {
      const [name, status, time, repeat, assignee, note] = line.split(",");
      if (!name || name.trim() === "タスク名") continue;
      taskList.push({
        name: name.trim(),
        status: status.trim(),
        time: time.trim(),
        repeat: repeat.trim(),
        assignee: assignee.trim(),
        note: note.trim(),
        date: new Date().toISOString().split("T")[0]
      });
    }
    saveTasks();
    renderTasks();
  };
  reader.readAsText(file);
}
