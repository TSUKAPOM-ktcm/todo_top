const db = window.db;

// Firestoreの db は HTML 側で初期化されている前提です

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
});

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

function hideModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
}

function addTaskFromForm(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  db.collection("tasks").add({
    name,
    status,
    frequency,
    assignee,
    dueDate: dueDate || null,
    note: note || "",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then((docRef) => {
    createTaskElement(name, status, frequency, assignee, dueDate, note, docRef.id);
    hideModal();
  });
}

function createTaskElement(name, status, frequency, assignee, dueDate, note, id) {
  const task = document.createElement("div");
  task.className = "task-item";
  task.dataset.id = id;
  task.dataset.name = name;
  task.dataset.status = status;
  task.dataset.frequency = frequency;
  task.dataset.assignee = assignee;
  task.dataset.dueDate = dueDate;
  task.dataset.note = note;
  task.innerHTML = `<strong>${name}</strong><br>メモ: ${note || "なし"}<br>完了予定日: ${dueDate || ""}`;
  task.onclick = () => openEditTaskModal(task);
  document.getElementById(`tasks-${assignee}-${status}`)?.appendChild(task);
}

function openEditTaskModal(task) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  content.innerHTML = `
    <form id="editTaskForm">
      <h3 id="editTaskTitle">${task.dataset.name}</h3>
      <label>ステータス<span class="required">*</span><br>
        <select id="editStatus">
          <option>未対応</option><option>対応中</option><option>完了</option>
        </select></label>
      <label>担当者<span class="required">*</span><br>
        <select id="editAssignee">
          <option>なし</option><option>つみき</option><option>ぬみき</option>
        </select></label>
      <label>完了予定日<br><input type="date" id="editDueDate"></label>
      <label>メモ<br><textarea id="editNote"></textarea></label>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">保存</button>
      </div>
    </form>`;

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
    const id = task.dataset.id;

    db.collection("tasks").doc(id).update({
      status: newStatus,
      assignee: newAssignee,
      dueDate: newDueDate || null,
      note: newNote || ""
    }).then(() => {
      task.dataset.status = newStatus;
      task.dataset.assignee = newAssignee;
      task.dataset.dueDate = newDueDate;
      task.dataset.note = newNote;
      task.innerHTML = `<strong>${task.dataset.name}</strong><br>メモ: ${newNote || "なし"}<br>完了予定日: ${newDueDate || ""}`;
      task.onclick = () => openEditTaskModal(task);
      task.remove();
      document.getElementById(`tasks-${newAssignee}-${newStatus}`)?.appendChild(task);
      hideModal();
    });
  };
}

function addMemoFromForm(e) {
  e.preventDefault();
  const memoText = document.getElementById("memoText").value.trim();
  if (!memoText) return;

  const memo = document.createElement("div");
  memo.className = "memo-item";
  memo.dataset.full = memoText;
  memo.textContent = memoText.length > 100 ? memoText.slice(0, 100) + "…" : memoText;

  memo.onclick = () => {
    document.getElementById("fullMemoText").textContent = memoText;
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
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
}

function addEventFromForm(e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const minute = document.getElementById("eventMinute").value;
  const content = document.getElementById("eventContent").value.trim();
  const note = document.getElementById("eventNote").value.trim();

  if (!date || !content) return;

  const event = document.createElement("div");
  event.className = "event-item";
  event.dataset.date = date;
  event.dataset.hour = hour;
  event.dataset.minute = minute;
  event.dataset.content = content;
  event.dataset.note = note;

  const time = hour && minute ? `${hour}:${minute}` : "";
  event.innerHTML = `<strong>${date}</strong> ${time} - ${content}`;
  event.onclick = () => openEditEventModal(event);
  document.getElementById("calendar-week").appendChild(event);
  hideModal();
}

function openEditEventModal(eventDiv) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  content.innerHTML = `
    <form id="editEventForm">
      <h3>予定の編集</h3>
      <label>日付<span class="required">*</span><br>
        <input type="date" id="editEventDate" value="${eventDiv.dataset.date}" required></label>
      <label>時間（時・分）<br>
        <select id="editEventHour"></select>
        <select id="editEventMinute">
          <option value="">--</option>
          <option>00</option><option>15</option><option>30</option><option>45</option>
        </select></label>
      <label>内容<span class="required">*</span><br>
        <input id="editEventContent" value="${eventDiv.dataset.content}" required></label>
      <label>メモ<br><textarea id="editEventNote">${eventDiv.dataset.note || ""}</textarea></label>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">保存</button>
      </div>
    </form>`;

  const hourSelect = document.getElementById("editEventHour");
  for (let i = 0; i < 24; i++) {
    const opt = document.createElement("option");
    opt.value = String(i).padStart(2, "0");
    opt.textContent = i;
    if (eventDiv.dataset.hour === opt.value) opt.selected = true;
    hourSelect.appendChild(opt);
  }

  document.getElementById("editEventMinute").value = eventDiv.dataset.minute || "";

  document.getElementById("editEventForm").onsubmit = (e) => {
    e.preventDefault();
    const newDate = document.getElementById("editEventDate").value;
    const newHour = document.getElementById("editEventHour").value;
    const newMinute = document.getElementById("editEventMinute").value;
    const newContent = document.getElementById("editEventContent").value;
    const newNote = document.getElementById("editEventNote").value;

    eventDiv.dataset.date = newDate;
    eventDiv.dataset.hour = newHour;
    eventDiv.dataset.minute = newMinute;
    eventDiv.dataset.content = newContent;
    eventDiv.dataset.note = newNote;

    const timeStr = newHour && newMinute ? `${newHour}:${newMinute}` : "";
    eventDiv.innerHTML = `<strong>${newDate}</strong> ${timeStr} - ${newContent}`;
    eventDiv.onclick = () => openEditEventModal(eventDiv);
    hideModal();
  };
}
