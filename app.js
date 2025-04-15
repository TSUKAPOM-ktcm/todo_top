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

document.getElementById("close-task-modal").addEventListener("click", () => {
  document.getElementById("task-modal").classList.add("hidden");
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
    completedAt: null
  };
  taskList.push(task);
  localStorage.setItem("tasks", JSON.stringify(taskList));
  document.getElementById("task-modal").classList.add("hidden");
  renderTasks();
});

document.getElementById("memo-btn").addEventListener("click", () => {
  document.getElementById("memo-modal").classList.remove("hidden");
});

document.getElementById("close-memo-modal").addEventListener("click", () => {
  document.getElementById("memo-modal").classList.add("hidden");
});

document.getElementById("save-memo-btn").addEventListener("click", () => {
  const memoContent = document.getElementById("memo-content").value;
  alert("メモが保存されました: " + memoContent);
  document.getElementById("memo-modal").classList.add("hidden");
});

function renderTasks() {
  const container = document.getElementById("tasks-by-user");
  container.innerHTML = "";
  const grouped = {};
  taskList.forEach(task => {
    if (task.status !== "完了") {
      if (!grouped[task.assignee]) grouped[task.assignee] = [];
      grouped[task.assignee].push(task);
    }
  });

  for (const assignee in grouped) {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    title.textContent = assignee === "" ? "未担当" : assignee;
    const ul = document.createElement("ul");

    grouped[assignee].forEach(task => {
      const li = document.createElement("li");
      li.textContent = `${task.name}（${task.status}）`;
      li.style.cursor = "pointer";
      li.onclick = () => {
        const modal = document.createElement("div");
        modal.innerHTML = `
          <div class="modal-content">
            <h2>ステータス変更</h2>
            <p>このタスクを「完了」にしますか？</p>
            <button id="confirm-complete-btn">完了</button>
            <button id="cancel-complete-btn">キャンセル</button>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById("confirm-complete-btn").onclick = () => {
          task.status = "完了";
          task.completedAt = new Date().toISOString();
          localStorage.setItem("tasks", JSON.stringify(taskList));
          renderTasks();
          document.body.removeChild(modal);
        };

        document.getElementById("cancel-complete-btn").onclick = () => {
          document.body.removeChild(modal);
        };
      };

      ul.appendChild(li);
    });

    section.appendChild(title);
    section.appendChild(ul);
    container.appendChild(section);
  }
}

