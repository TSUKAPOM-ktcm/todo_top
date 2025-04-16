document.addEventListener("DOMContentLoaded", () => {
  // モーダル初期化
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";

  // フォーム初期化イベント登録
  document.getElementById("taskForm")?.addEventListener("submit", addTaskFromForm);
  document.getElementById("memoForm")?.addEventListener("submit", addMemoFromForm);
  document.getElementById("eventForm")?.addEventListener("submit", addEventFromForm);
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

// モーダル表示
function showModal(type) {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  if (type === "task") {
    modalContent.innerHTML = `
      <form id="taskForm">
        <h3>タスクを追加</h3>
        <label>タスク名<span class="required">*</span><br><input id="taskName" required></label>
        <label>ステータス<span class="required">*</span><br>
          <select id="status">
            <option>未対応</option><option>対応中</option><option>完了</option>
          </select></label>
        <label>頻度<span class="required">*</span><br>
          <select id="frequency">
            <option>毎日</option><option>毎週</option><option>隔週</option><option>毎月</option><option>都度</option>
          </select></label>
        <label>担当者<span class="required">*</span><br>
          <select id="assignee">
            <option>なし</option><option>つみき</option><option>ぬみき</option>
          </select></label>
        <label>完了予定日<br><input type="date" id="dueDate"></label>
        <label>メモ<br><textarea id="note"></textarea></label>
        <div class="modal-buttons">
          <button type="button" onclick="hideModal()">キャンセル</button>
          <button type="submit">OK</button>
        </div>
      </form>`;
    document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);

  } else if (type === "memo") {
    modalContent.innerHTML = `
      <form id="memoForm">
        <h3>伝言メモ追加</h3>
        <label>メモ<span class="required">*</span><br><textarea id="memoText" required></textarea></label>
        <div class="modal-buttons">
          <button type="button" onclick="hideModal()">キャンセル</button>
          <button type="submit">OK</button>
        </div>
      </form>`;
    document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);

  } else if (type === "event") {
    modalContent.innerHTML = `
      <form id="eventForm">
        <h3>予定を追加</h3>
        <label>日付<span class="required">*</span><br><input type="date" id="eventDate" required></label>
        <label>時間（時・分）<br>
          <select id="eventHour"><option value="">--</option></select>
          <select id="eventMinute"><option value="">--</option><option>00</option><option>15</option><option>30</option><option>45</option></select>
        </label>
        <label>内容<span class="required">*</span><br><input id="eventContent" required></label>
        <label>メモ<br><textarea id="eventNote"></textarea></label>
        <div class="modal-buttons">
          <button type="button" onclick="hideModal()">キャンセル</button>
          <button type="submit">OK</button>
        </div>
      </form>`;
    const hourSel = document.getElementById("eventHour");
    for (let i = 0; i < 24; i++) {
      const op = document.createElement("option");
      op.value = String(i).padStart(2, "0");
      op.textContent = i;
      hourSel.appendChild(op);
    }
    document.getElementById("eventForm").addEventListener("submit", addEventFromForm);
  }
}

// モーダル閉じる
function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
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

  const today = new Date();
  const due = dueDate ? new Date(dueDate + "T00:00:00") : null;
  const isOverdue = due && due < today;

  const task = document.createElement("div");
  task.className = "task-item";
  task.dataset.name = name;
  task.dataset.status = status;
  task.dataset.assignee = assignee;
  task.dataset.dueDate = dueDate;
  task.dataset.note = note;
  task.innerHTML = isOverdue
    ? `<strong>${name}</strong><br>メモ: ${note}<br>完了予定日: ${dueDate}`
    : `<strong>${name}</strong>`;

  task.addEventListener("click", () => showEditTaskModal(task));

  if (isOverdue && status !== "完了") {
    document.getElementById("tasks-overdue").appendChild(task);
  } else {
    const container = document.getElementById(`tasks-${assignee}-${status}`);
    container?.appendChild(task);
  }

  hideModal();
}

// 編集モーダル表示
function showEditTaskModal(task) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  content.innerHTML = document.getElementById("editTaskTemplate").innerHTML;
  document.getElementById("editTaskTitle").textContent = task.dataset.name;
  document.getElementById("editStatus").value = task.dataset.status;
  document.getElementById("editAssignee").value = task.dataset.assignee;
  document.getElementById("editDueDate").value = task.dataset.dueDate || "";
  document.getElementById("editNote").value = task.dataset.note || "";

  document.getElementById("editTaskForm").onsubmit = (e) => {
    e.preventDefault();
    const newStatus = document.getElementById("editStatus").value;
    const newAssignee = document.getElementById("editAssignee").value;
    const newDueDate = document.getElementById("editDueDate").value;
    const newNote = document.getElementById("editNote").value;

    task.dataset.status = newStatus;
    task.dataset.assignee = newAssignee;
    task.dataset.dueDate = newDueDate;
    task.dataset.note = newNote;

    const due = newDueDate ? new Date(newDueDate + "T00:00:00") : null;
    const today = new Date();
    const isOverdue = due && due < today;

    task.innerHTML = isOverdue
      ? `<strong>${task.dataset.name}</strong><br>メモ: ${newNote}<br>完了予定日: ${newDueDate}`
      : `<strong>${task.dataset.name}</strong>`;

    task.onclick = () => showEditTaskModal(task);

    task.remove();
    if (isOverdue && newStatus !== "完了") {
      document.getElementById("tasks-overdue").appendChild(task);
    } else {
      const target = document.getElementById(`tasks-${newAssignee}-${newStatus}`);
      target?.appendChild(task);
    }

    hideModal();
  };
}

// メモ追加
function addMemoFromForm(e) {
  e.preventDefault();
  const text = document.getElementById("memoText").value.trim();
  if (!text) return;

  const memo = document.createElement("div");
  memo.className = "memo-item";
  memo.textContent = text.length > 100 ? text.slice(0, 100) + "…" : text;
  memo.dataset.full = text;

  memo.onclick = () => {
    document.getElementById("fullMemoText").textContent = text;
    document.getElementById("memoViewModal").classList.remove("hidden");
    document.getElementById("memoViewModal").style.display = "flex";
    document.getElementById("deleteMemoBtn").onclick = () => {
      memo.remove();
      hideMemoModal();
    };
  };

  document.getElementById("memos").appendChild(memo);
  hideModal();
}

function hideMemoModal() {
  const modal = document.getElementById("memoViewModal");
  modal.classList.add("hidden");
  modal.style.display = "none";
}

// 予定追加
function addEventFromForm(e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const minute = document.getElementById("eventMinute").value;
  const content = document.getElementById("eventContent").value;
  const note = document.getElementById("eventNote").value;

  const today = new Date();
  const eventDate = new Date(date + "T00:00:00");
  if (!date || !content.trim()) return;

  if (eventDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    hideModal();
    return;
  }

  const event = document.createElement("div");
  event.className = "event-item";
  const timeStr = hour && minute ? `${hour}:${minute}` : "";
  event.innerHTML = `<strong>${date}</strong> ${timeStr} - ${content}`;
  event.dataset.date = date;
  event.dataset.hour = hour;
  event.dataset.minute = minute;
  event.dataset.content = content;
  event.dataset.note = note;

  event.onclick = () => {
    alert(`日付: ${date}\n時間: ${timeStr}\n内容: ${content}\nメモ: ${note}`);
  };

  const day = eventDate.getDay();
  const diff = (eventDate.getDate() - today.getDate() + 7 - day + today.getDay()) % 7;
  const isThisWeek = diff >= 0 && diff < 7;
  const isThisMonth = eventDate.getMonth() === today.getMonth();

  if (isThisWeek) {
    document.getElementById("calendar-week").appendChild(event);
  } else if (isThisMonth) {
    document.getElementById("calendar-month").appendChild(event);
  }

  hideModal();
}
