// app.js（最新版）
// 機能：ログイン・モーダル制御・タスク/メモ/予定の追加・編集・分類表示対応済

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
  document.getElementById("mainScreen").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
});

// ログイン処理
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (email === "test@example.com" && password === "password") {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("mainScreen").classList.remove("hidden");
  } else {
    alert("IDかパスワードが違います");
  }
}

// モーダル制御
function showModal(type) {
  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  // 全フォームを隠す
  ["taskForm", "memoForm", "eventForm"].forEach(id => {
    const form = document.getElementById(id);
    if (form) form.classList.add("hidden");
  });

  // 指定フォームだけ表示
  const form = document.getElementById(type + "Form");
  if (form) {
    form.classList.remove("hidden");
  }
}

// モーダル閉じる
function hideModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
}

// メモ表示用モーダル
function hideMemoModal() {
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
}

// タスク追加
function addTaskFromForm(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  const task = document.createElement("div");
  task.className = "task-item";
  task.dataset.name = name;
  task.dataset.status = status;
  task.dataset.frequency = frequency;
  task.dataset.assignee = assignee;
  task.dataset.dueDate = dueDate;
  task.dataset.note = note;

  const today = new Date();
  const taskDue = dueDate ? new Date(dueDate + "T00:00:00") : null;
  const isOverdue = taskDue && taskDue < today;

  if (isOverdue && status !== "完了") {
    task.innerHTML = `<strong>${name}</strong><br>メモ: ${note}<br>完了予定日: ${dueDate}`;
    document.getElementById("tasks-overdue").appendChild(task);
  } else {
    task.innerHTML = `<strong>${name}</strong>`;
    const id = `tasks-${assignee}-${status}`;
    const container = document.getElementById(id);
    if (container) container.appendChild(task);
  }

  task.onclick = () => showEditTask(task);
  hideModal();
}

// 編集モーダル（今回は alert 簡易表示）
function showEditTask(taskDiv) {
  const name = taskDiv.dataset.name;
  const assignee = taskDiv.dataset.assignee;
  const status = taskDiv.dataset.status;
  const dueDate = taskDiv.dataset.dueDate;
  const note = taskDiv.dataset.note;

  alert(
    `タスク名：${name}
ステータス：${status}
担当者：${assignee}
完了予定日：${dueDate || ""}
メモ：${note || ""}`
  );
}

// メモ追加
function addMemoFromForm(e) {
  e.preventDefault();
  const memo = document.getElementById("memoText").value.trim();
  if (memo) {
    const div = document.createElement("div");
    div.className = "memo-item";
    div.textContent = memo.length > 100 ? memo.slice(0, 100) + "…" : memo;
    div.dataset.full = memo;

    div.onclick = () => {
      document.getElementById("fullMemoText").textContent = memo;
      document.getElementById("memoViewModal").classList.remove("hidden");
      document.getElementById("memoViewModal").style.display = "flex";
      document.getElementById("deleteMemoBtn").onclick = () => {
        div.remove();
        hideMemoModal();
      };
    };

    document.getElementById("memos").appendChild(div);
    hideModal();
  }
}

// 予定追加
function addEventFromForm(e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const minute = document.getElementById("eventMinute").value;
  const content = document.getElementById("eventContent").value;

  if (!date || !content.trim()) {
    alert("日付と内容は必須です！");
    return;
  }

  const event = document.createElement("div");
  event.className = "event-item";
  const time = hour && minute ? `${hour}:${minute}` : "";
  event.innerHTML = `<strong>${date}</strong> ${time} - ${content}`;

  const now = new Date();
  const evDate = new Date(date + "T00:00:00");
  const isSameMonth = evDate.getMonth() === now.getMonth();
  const isSameWeek = Math.abs(evDate - now) / (1000 * 60 * 60 * 24) <= 7;

  if (isSameWeek) {
    document.getElementById("calendar-week").appendChild(event);
  } else if (isSameMonth) {
    document.getElementById("calendar-month").appendChild(event);
  }

  hideModal();
}

// イベント登録
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);
  document.getElementById("eventForm").addEventListener("submit", addEventFromForm);

  // 時間選択（時）
  const hourSel = document.getElementById("eventHour");
  for (let i = 0; i < 24; i++) {
    const op = document.createElement("option");
    op.value = String(i).padStart(2, "0");
    op.textContent = i;
    hourSel?.appendChild(op);
  }
});
