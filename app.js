const PASSWORD = "kotachan";
let tasks = [];

function checkPassword() {
  const input = document.getElementById("password").value;
  if (input === PASSWORD) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("main-app").style.display = "block";
    renderTasks();
    renderCalendar();
  } else {
    document.getElementById("login-error").textContent = "パスワードが間違っています";
  }
}

function addTask() {
  const task = {
    name: document.getElementById("task-name").value,
    status: document.getElementById("task-status").value,
    deadline: document.getElementById("task-deadline").value,
    repeat: document.getElementById("task-repeat").value,
    assignee: document.getElementById("task-assignee").value,
    note: document.getElementById("task-note").value
  };
  tasks.push(task);
  renderTasks();
  renderCalendar();
  clearInputs();
}

function clearInputs() {
  document.getElementById("task-name").value = "";
  document.getElementById("task-status").value = "未対応";
  document.getElementById("task-deadline").value = "";
  document.getElementById("task-repeat").value = "都度";
  document.getElementById("task-assignee").value = "";
  document.getElementById("task-note").value = "";
}

function renderTasks() {
  const container = document.getElementById("tasks-by-user");
  const unassigned = document.getElementById("tasks-unassigned");
  container.innerHTML = "";
  unassigned.innerHTML = "";

  const users = ["つみき", "ぬみき"];
  users.forEach(user => {
    const userTasks = tasks.filter(t => t.assignee === user);
    const ul = document.createElement("ul");
    userTasks.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.name}（${t.status}｜${t.deadline}｜${t.repeat}）`;
      ul.appendChild(li);
    });
    const section = document.createElement("div");
    section.innerHTML = `<h3>${user}</h3>`;
    section.appendChild(ul);
    container.appendChild(section);
  });

  const unassignedTasks = tasks.filter(t => !t.assignee);
  unassignedTasks.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.name}（${t.status}｜${t.deadline}｜${t.repeat}）`;
    unassigned.appendChild(li);
  });
}

function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = ""; // 初期化

  const events = tasks.map(t => ({
    title: t.name,
    start: t.deadline,
    color: t.status === "完了" ? "green" : t.status === "対応中" ? "orange" : "red"
  }));

  new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: events
  }).render();
}
