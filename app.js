document.addEventListener("DOMContentLoaded", () => {
  let taskList = JSON.parse(localStorage.getItem("tasks") || "[]");
  let selectedDate = new Date().toISOString().split("T")[0];

  // ログイン処理
  document.getElementById("login-btn").addEventListener("click", () => {
    const input = document.getElementById("password").value;
    if (input === "kotachan") {
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("main-app").style.display = "block";
      updateDateDisplay();
      renderTasks();
    } else {
      document.getElementById("login-error").textContent = "パスワードが違います";
    }
  });

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
      completedAt: status === "完了" ? new Date().toISOString() : null
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
    const text = document.getElementById("memo-content").value;
    localStorage.setItem("memo", text);
    alert("メモを保存しました");
    document.getElementById("memo-modal").classList.add("hidden");
  });

  function renderTasks() {
    const container = document.getElementById("task-list-container");
    container.innerHTML = "";
    const grouped = {};

    taskList.forEach(task => {
      if (task.status !== "完了") {
        const key = task.assignee || "未担当";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(task);
      }
    });

    for (const name in grouped) {
      const section = document.createElement("section");
      const title = document.createElement("h3");
      title.textContent = name;
      const ul = document.createElement("ul");

      grouped[name].forEach(task => {
        const li = document.createElement("li");
        li.textContent = `${task.name}（${task.status}）`;
        li.style.cursor = "pointer";
        li.onclick = () => {
          const newStatus = prompt("ステータスを変更（未対応・対応中・完了）:", task.status);
          if (newStatus) {
            task.status = newStatus;
            if (newStatus === "完了") {
              task.completedAt = new Date().toISOString();
            }
            localStorage.setItem("tasks", JSON.stringify(taskList));
            renderTasks();
          }
        };
        ul.appendChild(li);
      });

      section.appendChild(title);
      section.appendChild(ul);
      container.appendChild(section);
    }
  }
});
