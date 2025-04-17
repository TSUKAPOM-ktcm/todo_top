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

  db.collection("users")
    .where("email", "==", email)
    .where("password", "==", password)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("mainScreen").classList.remove("hidden");
      } else {
        alert("IDかパスワードが違います");
      }
    })
    .catch((error) => {
      console.error("ログイン時のエラー:", error);
      alert("ログインに失敗しました");
    });
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
    } else if (type === "template") {
    modalContent.innerHTML = `
      <form id="templateForm">
        <h3>どのタスクを追加しますか？</h3>
        <label><input type="checkbox" name="frequency" value="毎日"> 毎日</label><br>
        <label><input type="checkbox" name="frequency" value="毎週"> 毎週</label><br>
        <label><input type="checkbox" name="frequency" value="毎月"> 毎月</label><br>
        <div class="modal-buttons">
          <button type="button" onclick="hideModal()">キャンセル</button>
          <button type="submit">OK</button>
        </div>
      </form>`;
    document.getElementById("templateForm").addEventListener("submit", addTemplateTasks);
  }
}
function addTemplateTasks(e) {
  e.preventDefault();
  const selected = Array.from(document.querySelectorAll("input[name='frequency']:checked")).map(cb => cb.value);
  if (!selected.length) return hideModal();

  db.collection("templates").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      if (selected.includes(data.frequency) && data.status !== "完了") {
        const id = "template_" + Date.now() + Math.random().toString(36).substring(2, 8);

        // Firestoreのtasksコレクションにも保存
        db.collection("tasks").doc(id).set({
          name: data.name,
          status: data.status,
          frequency: data.frequency,
          assignee: data.assignee,
          dueDate: data.dueDate || null,
          note: data.note || "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // タスクエリアにタスク名のみ表示（クリック編集可）
        createTaskElement(data.name, data.status, data.frequency, data.assignee, data.dueDate, data.note, id);
      }
    });
    hideModal();
  });
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = dueDate ? new Date(dueDate + "T00:00:00") : null;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isOverdue = due && due <= yesterday && status !== "完了";

  // 表示内容の条件分岐（過去日なら詳細表示、それ以外はタスク名のみ）
  task.innerHTML = isOverdue
    ? `<strong>${name}</strong><br>メモ: ${note || "なし"}<br>完了予定日: ${dueDate || ""}`
    : `<strong>${name}</strong>`;

  task.onclick = () => openEditTaskModal(task);

  if (isOverdue) {
    document.getElementById("tasks-overdue")?.appendChild(task);
  } else {
    document.getElementById(`tasks-${assignee}-${status}`)?.appendChild(task);
  }
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = newDueDate ? new Date(newDueDate + "T00:00:00") : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isOverdue = due && due <= yesterday && newStatus !== "完了";

      task.innerHTML = isOverdue
        ? `<strong>${task.dataset.name}</strong><br>メモ: ${newNote || "なし"}<br>完了予定日: ${newDueDate || ""}`
        : `<strong>${task.dataset.name}</strong>`;

      task.onclick = () => openEditTaskModal(task);
      task.remove();

      if (isOverdue) {
        document.getElementById("tasks-overdue")?.appendChild(task);
      } else {
        document.getElementById(`tasks-${newAssignee}-${newStatus}`)?.appendChild(task);
      }

      hideModal();
    });
  };
}


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

    // Firestoreに保存
  db.collection("memos").add({
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log("Firestoreにメモを保存しました");
  }).catch((error) => {
    console.error("Firestoreメモ保存エラー:", error);
  });
  
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
  const content = document.getElementById("eventContent").value;
  const note = document.getElementById("eventNote").value;

  if (!date || !content.trim()) return;

  const eventDate = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (eventDate <= yesterday) {
    hideModal(); // 昨日以前は無視
    return;
  }

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

  if (isSameWeek(eventDate, today)) {
    document.getElementById("calendar-week").appendChild(event);
  } else if (isSameMonth(eventDate, today)) {
    document.getElementById("calendar-month").appendChild(event);
  } else if (isNextMonthOrLater(eventDate, today)) {
    document.getElementById("calendar-future").appendChild(event);
  }

    // Firestoreに保存
  db.collection("events").add({
    date,
    hour,
    minute,
    content,
    note,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log("Firestoreに予定を保存しました");
  }).catch((error) => {
    console.error("Firestore予定保存エラー:", error);
  });

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

    eventDiv.remove();
    const dateObj = new Date(newDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj <= yesterday) {
      hideModal(); return;
    }

    if (isSameWeek(dateObj, today)) {
      document.getElementById("calendar-week").appendChild(eventDiv);
    } else if (isSameMonth(dateObj, today)) {
      document.getElementById("calendar-month").appendChild(eventDiv);
    } else if (isNextMonthOrLater(dateObj, today)) {
      document.getElementById("calendar-future").appendChild(eventDiv);
    }

    // Firestoreに保存（編集＝再追加）
    db.collection("events").add({
      date: newDate,
      hour: newHour,
      minute: newMinute,
      content: newContent,
      note: newNote,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      console.log("Firestoreに予定（編集）を保存しました");
    }).catch((error) => {
      console.error("Firestore予定保存エラー（編集）:", error);
    });

    hideModal();
  };
}


// 判定用補助関数
function isSameWeek(date, reference) {
  const ref = new Date(reference);
  const startOfWeek = new Date(ref.setDate(ref.getDate() - ref.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  return date >= startOfWeek && date <= endOfWeek;
}

function isSameMonth(date, reference) {
  return date.getFullYear() === reference.getFullYear() &&
         date.getMonth() === reference.getMonth();
}

function isNextMonthOrLater(date, reference) {
  const refYear = reference.getFullYear();
  const refMonth = reference.getMonth();
  return date >= new Date(refYear, refMonth + 1, 1);
}
