const db = window.db;

// Firestoreの db は HTML 側で初期化されている前提です

function isSameWeek(date, reference) {
  const ref = new Date(reference);
  const day = ref.getDay();
  const startOfWeek = new Date(ref);
  startOfWeek.setDate(ref.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  return date >= startOfWeek && date <= endOfWeek;
}

function isSameMonth(date, reference) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function isNextMonthOrLater(date, reference) {
  const nextMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return date >= nextMonth;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
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

// モーダル表示処理（タスク／メモ／予定）
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
  }
  else if (type === "event") {
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");
    modal.classList.remove("hidden");
    modal.style.display = "flex";
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

// モーダルを閉じる
function hideModal() {
  const modal = document.getElementById("modal");
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
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date + "T00:00:00");
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (eventDate <= yesterday) return hideModal();

  const eventDiv = document.createElement("div");
  eventDiv.className = "event-item";
  const time = hour && minute ? `${hour}:${minute}` : "";
  eventDiv.innerHTML = `<strong>${date}</strong> ${time} - ${content}`;
  eventDiv.dataset.date = date;
  eventDiv.dataset.hour = hour;
  eventDiv.dataset.minute = minute;
  eventDiv.dataset.content = content;
  eventDiv.dataset.note = note;
  eventDiv.onclick = () => openEditEventModal(eventDiv);

  if (isSameWeek(eventDate, today)) {
    document.getElementById("calendar-week").appendChild(eventDiv);
  } else if (isSameMonth(eventDate, today)) {
    document.getElementById("calendar-month").appendChild(eventDiv);
  } else if (isNextMonthOrLater(eventDate, today)) {
    document.getElementById("calendar-future").appendChild(eventDiv);
  }
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
    </form>
  `;

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

    eventDiv.remove();
    const dateObj = new Date(newDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dateObj <= yesterday) return hideModal();

    if (isSameWeek(dateObj, today)) {
      document.getElementById("calendar-week").appendChild(eventDiv);
    } else if (isSameMonth(dateObj, today)) {
      document.getElementById("calendar-month").appendChild(eventDiv);
    } else if (isNextMonthOrLater(dateObj, today)) {
      document.getElementById("calendar-future").appendChild(eventDiv);
    }
    hideModal();
  };
}
