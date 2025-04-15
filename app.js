let taskList = JSON.parse(localStorage.getItem("tasks") || "[]");
let selectedDate = new Date().toISOString().split("T")[0];

// ログインチェック
function checkPassword() {
  const input = document.getElementById("password").value;
  if (input === "kotachan") {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    updateDateDisplay();
    renderTasks();
  } else {
    alert("パスワードが違います");
    document.getElementById("login-error").textContent = "パスワードが違います"; // エラーメッセージを表示
  }
}

function updateDateDisplay() {
  document.getElementById("today-display").textContent = selectedDate;
}

document.getElementById("today-display").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "date";
  input.value = selectedDate;
  input.onchange = () => {
    selectedDate = input.value;
    updateDateDisplay();
    renderTasks();
  };
  input.click();
});

// タスクの保存
document.getElementById("save-task-btn").addEventListener("click", () => {
  const name = document.getElementById("task-name").value;
  const status = document.getElementById("task-status").value;
  const frequency = document.getElementById("task-repeat").value;
  const assignee = document.getElementById("task-assignee").value;
  const deadline = document.getElementById("task-deadline").value;
  const note = document.getElementById("task-note").value;

  if (!name || !frequency) {
    alert("タスク名と頻度は必須です");
    return;
  }

  const task = {
    id: Date.now(),
    name,
    status,
    frequency,
    assignee,
    deadline,
    note,
    created: selectedDate,
    completedAt: null
  };
  taskList.push(task);
  localStorage.setItem("tasks", JSON.stringify(taskList));
  document.getElementById("task-modal").classList.add("hidden");
  renderTasks();
});

// タスクのレンダリング
function renderTasks() {
  const container = document.getElementById("task-list-container");
  container.innerHTML = "";
  const grouped = {};
  taskList.forEach(task => {
    if (task.status !== "完了") {
      if (!grouped[task.assignee]) grouped[task.assignee] = [];
      grouped[task.assignee].push(task);
    }
  });
  for (const name in grouped) {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    title.textContent = name === "" ? "未担当" : name;
    const ul = document.createElement("ul");
    grouped[name].forEach(task => {
      const li = document.createElement("li");
      li.textContent = `${task.name}（${task.status}）`;
      li.style.cursor = "pointer";
      li.onclick = () => {
        const newStatus = prompt("ステータスを変更（未対応・対応中・完了）:", task.status);
        if (newStatus === "完了") {
          task.completedAt = new Date().toISOString();
        }
        task.status = newStatus;
        localStorage.setItem("tasks", JSON.stringify(taskList));
        renderTasks();
      };
      ul.appendChild(li);
    });
    section.appendChild(title);
    section.appendChild(ul);
    container.appendChild(section);
  }
}

// 伝言メモ
document.getElementById("memo-btn").addEventListener("click", () => {
  const memoContent = document.getElementById("memo-content").value;
  if (memoContent) {
    alert("メモが保存されました: " + memoContent);
  }
});
