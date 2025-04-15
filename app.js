let taskList = JSON.parse(localStorage.getItem("tasks") || "[]");
let selectedDate = new Date().toISOString().split("T")[0];

// ログインチェック
function checkPassword() {
  const input = document.getElementById("password").value;
  if (input === "kotachan") {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    updateDateDisplay();
    setTimeout(renderTasks, 100); // 画面が描画されるのを待つ
  } else {
    alert("パスワードが違います");
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

document.getElementById("add-task-btn").addEventListener("click", () => {
  document.getElementById("task-modal").classList.remove("hidden");
});

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
    completedAt: null,
    memo: "" // 伝言メモを追加
  };

  taskList.push(task);
  localStorage.setItem("tasks", JSON.stringify(taskList));
  document.getElementById("task-modal").classList.add("hidden");
  renderTasks();
});

document.getElementById("save-memo-btn").addEventListener("click", () => {
  const memoContent = document.getElementById("memo-content").value;
  const taskId = document.getElementById("memo-modal").dataset.taskId; // タスクIDを取得
  const task = taskList.find(t => t.id === Number(taskId));

  if (task) {
    task.memo = memoContent; // メモを保存
    localStorage.setItem("tasks", JSON.stringify(taskList));
    renderTasks(); // 再描画
    document.getElementById("memo-modal").classList.add("hidden");
  }
});

function renderTasks() {
  const container = document.getElementById("task-list-container");
  if (!container) {
    console.error('task-list-container not found');
    return;
  }
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

      // 伝言メモ表示
      const memoDiv = document.createElement("div");
      memoDiv.textContent = task.memo ? `メモ: ${task.memo}` : "メモなし";
      const memoButton = document.createElement("button");
      memoButton.textContent = "メモを追加";
      memoButton.onclick = () => {
        document.getElementById("memo-modal").classList.remove("hidden");
        document.getElementById("memo-content").value = task.memo;
        document.getElementById("memo-modal").dataset.taskId = task.id; // タスクIDをセット
      };
      memoDiv.appendChild(memoButton);
      li.appendChild(memoDiv);
      ul.appendChild(li);
    });

    section.appendChild(title);
    section.appendChild(ul);
    container.appendChild(section);
  }
}

document.getElementById("close-task-modal").addEventListener("click", () => {
  document.getElementById("task-modal").classList.add("hidden");
});

document.getElementById("close-memo-modal").addEventListener("click", () => {
  document.getElementById("memo-modal").classList.add("hidden");
});


