// -----------------------------
// ログイン処理
// -----------------------------
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (email === "test@example.com" && password === "password") {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("mainScreen").classList.remove("hidden");
  } else {
    alert("IDかパスワードが違います");
  }
}

// -----------------------------
// モーダル制御
// -----------------------------
function showModal(type, data = null) {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  if (type === "task") {
    modalContent.innerHTML = createTaskForm();
  } else if (type === "memo") {
    modalContent.innerHTML = createMemoForm();
  } else if (type === "event") {
    modalContent.innerHTML = createEventForm();
  } else if (type === "editTask") {
    modalContent.innerHTML = createEditTaskForm(data);
  }

  // イベント再登録
  if (type === "task") {
    document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  } else if (type === "memo") {
    document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);
  } else if (type === "event") {
    document.getElementById("eventForm").addEventListener("submit", addEventFromForm);
  } else if (type === "editTask") {
    document.getElementById("editTaskForm").addEventListener("submit", (e) => saveEditedTask(e, data));
  }
}

function hideModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
  modal.classList.add("hidden");
}

// -----------------------------
// タスク追加フォーム（HTML）
function createTaskForm() {
  return `
    <h3 class="modal-title">タスクを追加</h3>
    <form id="taskForm">
      <label>タスク名 <span class="required">*</span></label>
      <input id="taskName" required />

      <label>ステータス <span class="required">*</span></label>
      <select id="status" required>
        <option>未対応</option>
        <option>対応中</option>
        <option>完了</option>
      </select>

      <label>頻度 <span class="required">*</span></label>
      <select id="frequency" required>
        <option>毎日</option>
        <option>毎週</option>
        <option>隔週</option>
        <option>毎月</option>
        <option>都度</option>
      </select>

      <label>担当者 <span class="required">*</span></label>
      <select id="assignee" required>
        <option>なし</option>
        <option>つみき</option>
        <option>ぬみき</option>
      </select>

      <label>完了予定日</label>
      <input type="date" id="dueDate" />

      <label>メモ</label>
      <textarea id="note"></textarea>

      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">OK</button>
      </div>
    </form>
  `;
}

// -----------------------------
// メモ追加フォーム（HTML）
function createMemoForm() {
  return `
    <h3 class="modal-title">伝言メモ追加</h3>
    <form id="memoForm">
      <label>メモ <span class="required">*</span></label>
      <textarea id="memoText" required></textarea>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">OK</button>
      </div>
    </form>
  `;
}

// -----------------------------
// 予定追加フォーム（HTML）
function createEventForm() {
  const hourOptions = [...Array(24).keys()].map(h => `<option value="${h}">${h}</option>`).join('');
  const minOptions = [0, 15, 30, 45].map(m => `<option value="${m}">${m}</option>`).join('');
  return `
    <h3 class="modal-title">予定を追加</h3>
    <form id="eventForm">
      <label>日付 <span class="required">*</span></label>
      <input type="date" id="eventDate" required />

      <label>時間（時・分）</label>
      <div style="display: flex; gap: 0.5rem;">
        <select id="eventHour"><option value="">--</option>${hourOptions}</select>
        <select id="eventMin"><option value="">--</option>${minOptions}</select>
      </div>

      <label>内容 <span class="required">*</span></label>
      <input id="eventContent" required />

      <label>メモ</label>
      <textarea id="eventNote"></textarea>

      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">OK</button>
      </div>
    </form>
  `;
}

// -----------------------------
// タスク編集フォーム（HTML）
function createEditTaskForm(taskEl) {
  const name = taskEl.dataset.name;
  const status = taskEl.dataset.status;
  const assignee = taskEl.dataset.assignee;
  const due = taskEl.dataset.due || "";
  return `
    <h3 class="modal-title">${name}</h3>
    <form id="editTaskForm">
      <label>ステータス <span class="required">*</span></label>
      <select id="editStatus" required>
        <option ${status === "未対応" ? "selected" : ""}>未対応</option>
        <option ${status === "対応中" ? "selected" : ""}>対応中</option>
        <option ${status === "完了" ? "selected" : ""}>完了</option>
      </select>

      <label>担当者 <span class="required">*</span></label>
      <select id="editAssignee" required>
        <option ${assignee === "なし" ? "selected" : ""}>なし</option>
        <option ${assignee === "つみき" ? "selected" : ""}>つみき</option>
        <option ${assignee === "ぬみき" ? "selected" : ""}>ぬみき</option>
      </select>

      <label>完了予定日</label>
      <input type="date" id="editDueDate" value="${due}" />

      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">OK</button>
      </div>
    </form>
  `;
}

// -----------------------------
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
  task.dataset.assignee = assignee;
  task.dataset.due = dueDate;

  const dueDisplay = dueDate ? dueDate : "";
  task.innerHTML = `
    <strong>${name}</strong><br>
    完了予定日：${dueDisplay}<br>
    メモ：${note}
  `;
  task.onclick = () => showModal('editTask', task);

  const id = `${assignee === "なし" ? "none" : assignee === "つみき" ? "tsumiki" : "numiki"}-${status === "未対応" ? "pending" : "progress"}`;
  if (status !== "完了") {
    document.getElementById(id)?.appendChild(task);
  }

  hideModal();
}

// -----------------------------
// 編集の保存
function saveEditedTask(e, el) {
  e.preventDefault();
  const status = document.getElementById("editStatus").value;
  const assignee = document.getElementById("editAssignee").value;
  const dueDate = document.getElementById("editDueDate").value;

  el.dataset.status = status;
  el.dataset.assignee = assignee;
  el.dataset.due = dueDate;

  el.innerHTML = `
    <strong>${el.dataset.name}</strong><br>
    完了予定日：${dueDate || ""}<br>
    メモ：${el.dataset.note || ""}
  `;

  const id = `${assignee === "なし" ? "none" : assignee === "つみき" ? "tsumiki" : "numiki"}-${status === "未対応" ? "pending" : "progress"}`;
  if (status !== "完了") {
    document.getElementById(id)?.appendChild(el);
  } else {
    el.remove();
  }

  hideModal();
}

// -----------------------------
// メモ追加
function addMemoFromForm(e) {
  e.preventDefault();
  const text = document.getElementById("memoText").value;
  const div = document.createElement("div");
  div.className = "memo-item";
  div.textContent = text.length > 100 ? text.slice(0, 100) + "…" : text;
  div.onclick = () => {
    showModal('memo');
    document.getElementById("modalContent").innerHTML = `
      <h3 class="modal-title">メモの内容</h3>
      <p>${text}</p>
      <div class="modal-buttons">
        <button onclick="deleteMemo(this)">削除</button>
        <button onclick="hideModal()">キャンセル</button>
      </div>
    `;
  };
  document.getElementById("memos").appendChild(div);
  hideModal();
}

function deleteMemo(btn) {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
  modal.classList.add("hidden");
  const memos = document.getElementById("memos").children;
  [...memos].forEach(m => {
    if (m.textContent.startsWith(btn.parentElement.previousElementSibling.textContent.slice(0, 100))) {
      m.remove();
    }
  });
}

// -----------------------------
// 予定追加
function addEventFromForm(e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const min = document.getElementById("eventMin").value;
  const content = document.getElementById("eventContent").value;

  const div = document.createElement("div");
  div.className = "event-item";
  const timeText = hour !== "" && min !== "" ? `${hour}:${min.padStart(2, '0')}` : "";
  div.textContent = `${date} ${timeText} ${content}`;
  const today = new Date();
  const eventDate = new Date(date);

  if (eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear()) {
    if (eventDate.getDate() - today.getDate() <= 7) {
      document.getElementById("thisWeekEvents").appendChild(div);
    } else {
      document.getElementById("thisMonthEvents").appendChild(div);
    }
  }

  div.onclick = () => {
    showModal("event");
    // 編集用の再実装も可能（省略中）
  };

  hideModal();
}

// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  hideModal();
});
