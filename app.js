// Firestoreの db は HTML 側で初期化されている前提です
const db = window.db;

// 🔐 ログイン処理
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
        renderTodayNursery(); // 🔸ログイン後に今日の保育園時間を表示
      } else {
        alert("IDかパスワードが違います");
      }
    })
    .catch((error) => {
      console.error("ログイン時のエラー:", error);
      alert("ログインに失敗しました");
    });
}
window.login = login;

// 🔸今日の保育園時間を表示する
function renderTodayNursery() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`; // 🔑 FirestoreのIDと一致させる

  const startEl = document.getElementById("nurseryStart");
  const endEl = document.getElementById("nurseryEnd");

  db.collection("nursery").doc(dateStr).get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (!data.start || !data.end) {
          startEl.textContent = "お休み";
          endEl.textContent = "";
        } else {
          startEl.textContent = data.start;
          endEl.textContent = data.end;
        }
      } else {
        startEl.textContent = "データなし";
        endEl.textContent = "";
      }
    })
    .catch((error) => {
      console.error("保育園情報の取得エラー:", error);
      startEl.textContent = "エラー";
      endEl.textContent = "";
    });
}

// 🔧 モーダル処理　type別に表示　task,regular
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

  } else if (type === "regular") {
    modalContent.innerHTML = `
      <form id="regularForm">
        <h3>定期タスクを追加</h3>
        <p>どのタスクを追加しますか？</p>
        <label><input type="checkbox" name="frequency" value="毎日"> 毎日</label><br>
        <label><input type="checkbox" name="frequency" value="毎週"> 毎週</label><br>
        <label><input type="checkbox" name="frequency" value="毎月"> 毎月</label><br>
        <div class="modal-buttons">
          <button type="button" onclick="hideModal()">キャンセル</button>
          <button type="submit">OK</button>
        </div>
      </form>
    `;

    document.getElementById("regularForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const selected = Array.from(document.querySelectorAll("input[name='frequency']:checked"))
        .map(cb => cb.value);

      if (selected.length === 0) {
        alert("最低1つ選んでください！");
        return;
      }

      try {
        const snapshot = await db.collection("templates")
          .where("frequency", "in", selected)
          .get();

        snapshot.forEach(doc => {
          const data = doc.data();
          createTaskElement(data.name, data.status, data.frequency, data.assignee, data.dueDate, data.note, doc.id);

          db.collection("tasks").add({
            name: data.name,
            status: data.status,
            frequency: data.frequency,
            assignee: data.assignee,
            dueDate: data.dueDate || null,
            note: data.note || "",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });

        hideModal();

      } catch (error) {
        console.error("定期タスク取得エラー:", error);
        alert("取得に失敗しました");
      }
    });
  }
// 伝言メモ追加
  else if (type === "memo") {
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
  }

  // 予定を追加
  else if (type === "event") {
    modalContent.innerHTML = `
      <form id="eventForm">
        <h3>予定を追加</h3>
        <label>日付<span class="required">*</span><br><input type="date" id="eventDate" required></label>
        <label>時間（時・分）<br>
          <select id="eventHour"><option value="">--</option></select>
          <select id="eventMinute">
            <option value="">--</option><option>00</option><option>15</option><option>30</option><option>45</option>
          </select>
        </label>
        <label>内容<span class="required">*</span><br><input id="eventContent" required></label>
        <label>メモ<br><textarea id="eventNote"></textarea></label>
        <div class="modal-buttons">
          <button type="button" onclick="hideModal()">キャンセル</button>
          <button type="submit">OK</button>
        </div>
      </form>
    `;

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
window.showModal = showModal;

// ページ読み込み時のモーダル初期化とFirestoreの同期設定
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";

  db.collection("tasks").onSnapshot((snapshot) => {
    const taskContainers = document.querySelectorAll("[id^='tasks-']");
    taskContainers.forEach(container => container.innerHTML = "");
    document.getElementById("tasks-overdue").innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;

      if (data.status === "完了") return;

      const due = data.dueDate ? new Date(data.dueDate + "T00:00:00") : null;
      const isOverdue = due && due <= yesterday;

      if (isOverdue) {
        createTaskElement(data.name, data.status, data.frequency, data.assignee, data.dueDate, data.note, id, true);
      } else {
        createTaskElement(data.name, data.status, data.frequency, data.assignee, data.dueDate, data.note, id);
      }
    });
  });

  db.collection("events").onSnapshot((snapshot) => {
    document.getElementById("calendar-week").innerHTML = "";
    document.getElementById("calendar-month").innerHTML = "";
    document.getElementById("calendar-future").innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    snapshot.forEach(doc => {
      const data = doc.data();
      const eventDate = new Date(data.date + "T00:00:00");
      if (eventDate < today || data.deleted) return;

      const existing = document.querySelector(`[data-id='${doc.id}']`);
      if (existing) existing.remove();

      const event = document.createElement("div");
      event.className = "event-item";
      event.dataset.id = doc.id;
      event.dataset.date = data.date;
      event.dataset.hour = data.hour;
      event.dataset.minute = data.minute;
      event.dataset.content = data.content;
      event.dataset.note = data.note;

      const time = data.hour && data.minute ? `${data.hour}:${data.minute}` : "";
      event.innerHTML = `<strong>${data.date}</strong> ${time} - ${data.content}`;
      event.onclick = () => openEditEventModal(event);

      if (isSameWeek(eventDate, today)) {
        document.getElementById("calendar-week").appendChild(event);
      } else if (isSameMonth(eventDate, today)) {
        document.getElementById("calendar-month").appendChild(event);
      } else if (isNextMonthOrLater(eventDate, today)) {
        document.getElementById("calendar-future").appendChild(event);
      }
    });
  });

  db.collection("memos").onSnapshot((snapshot) => {
    document.getElementById("memos").innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      if (data.deleted) return;

      const memo = document.createElement("div");
      memo.className = "memo-item";
      memo.dataset.full = data.text;
      memo.textContent = data.text.length > 100 ? data.text.slice(0, 100) + "…" : data.text;

      memo.onclick = () => {
        document.getElementById("fullMemoText").textContent = data.text;
        document.getElementById("memoViewModal").classList.remove("hidden");
        document.getElementById("memoViewModal").style.display = "flex";
        document.getElementById("deleteMemoBtn").onclick = () => {
          db.collection("memos").doc(id).update({ deleted: true });
          memo.remove();
          hideMemoModal();
        };
      };

      document.getElementById("memos").appendChild(memo);
    });
  });
});

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
      <label>ステータス<br>
        <select id="editStatus">
          <option>未対応</option>
          <option>対応中</option>
          <option>完了</option>
        </select></label>
      <label>担当者<br>
        <select id="editAssignee">
          <option>なし</option>
          <option>つみき</option>
          <option>ぬみき</option>
        </select></label>
      <label>完了予定日<br>
        <input type="date" id="editDueDate"></label>
      <label>メモ<br>
        <textarea id="editNote"></textarea></label>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">保存</button>
      </div>
    </form>
  `;

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
      hideModal();
    }).catch((error) => {
      console.error("更新エラー:", error);
    });// 保存処理などここに入る
  };
}
window.openEditTaskModal = openEditTaskModal;

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
    const eventId = eventDiv.dataset.id; // 🔑 Firestore の ID を使って更新！

    // Firestore に上書き保存
    db.collection("events").doc(eventId).update({
      date: newDate,
      hour: newHour,
      minute: newMinute,
      content: newContent,
      note: newNote,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      console.log("Firestoreに予定を上書き保存しました");
    }).catch((error) => {
      console.error("Firestore予定保存エラー（編集）:", error);
    });

    // 表示の更新（重複登録を防ぐため remove → 再append）
    eventDiv.dataset.date = newDate;
    eventDiv.dataset.hour = newHour;
    eventDiv.dataset.minute = newMinute;
    eventDiv.dataset.content = newContent;
    eventDiv.dataset.note = newNote;

    const timeStr = newHour && newMinute ? `${newHour}:${newMinute}` : "";
    eventDiv.innerHTML = `<strong>${newDate}</strong> ${timeStr} - ${newContent}`;
    eventDiv.onclick = () => openEditEventModal(eventDiv);
    eventDiv.remove();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(newDate + "T00:00:00");
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (eventDate <= yesterday) {
      hideModal(); return;
    }

    if (isSameWeek(eventDate, today)) {
      document.getElementById("calendar-week").appendChild(eventDiv);
    } else if (isSameMonth(eventDate, today)) {
      document.getElementById("calendar-month").appendChild(eventDiv);
    } else if (isNextMonthOrLater(eventDate, today)) {
      document.getElementById("calendar-future").appendChild(eventDiv);
    }

    hideModal();
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


// モーダル非表示関数
function hideModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
}

function hideMemoModal() {
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
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

function deleteTask(id) {
  db.collection("tasks").doc(id).update({ deleted: true })
    .then(() => {
      console.log("✅ タスクを削除フラグつけました");
      hideModal();
    })
    .catch((err) => {
      console.error("❌ タスク削除に失敗", err);
    });
}

// 🔧 保育園時間を編集するモーダルを開く
function openNurseryEditModal() {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`; // 🔑 FirestoreのIDと一致

  // HTMLを挿入
  content.innerHTML = `
    <form id="editNurseryForm">
      <h3>今日の保育園時間を編集</h3>
      <label>日付：<input type="date" id="editNurseryDate" value="${dateStr}" required></label><br>
      <label>開始時間：<input type="time" id="editNurseryStart"></label><br>
      <label>終了時間：<input type="time" id="editNurseryEnd"></label><br>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">保存</button>
      </div>
    </form>
  `;

  // 既存データを読み込んで入力欄にセット
  db.collection("nursery").doc(dateStr).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data.start) document.getElementById("editNurseryStart").value = data.start;
      if (data.end) document.getElementById("editNurseryEnd").value = data.end;
    }
  });

  // 保存イベント
  document.getElementById("editNurseryForm").addEventListener("submit", saveNurserySchedule);
}
window.openNurseryEditModal = openNurseryEditModal;

// ✅ 編集内容をFirestoreに保存して、画面に反映
function saveNurserySchedule(e) {
  e.preventDefault();
  const date = document.getElementById("editNurseryDate").value;
  const start = document.getElementById("editNurseryStart").value;
  const end = document.getElementById("editNurseryEnd").value;

  db.collection("nursery").doc(date).set({
    start: start || null,
    end: end || null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log("保育園スケジュールを更新しました");
    renderTodayNursery(); // 🐣 メイン表示も更新！
    hideModal();
  }).catch((err) => {
    console.error("スケジュール更新失敗:", err);
  });
}

// 🔍 保育園スケジュール一覧モーダルを開く
function openNurseryCalendarModal() {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  content.innerHTML = `<h3>保育園スケジュール一覧</h3><div id="nurseryScheduleList">読み込み中…</div>`;

  db.collection("nursery").orderBy("date").get()
    .then((snapshot) => {
      const container = document.getElementById("nurseryScheduleList");
      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML = "<p>スケジュールがありません</p>";
        return;
      }

      snapshot.forEach(doc => {
        const id = doc.id;
        const data = doc.data();
        const start = data.start || "お休み";
        const end = data.end || "";
        const div = document.createElement("div");
        div.textContent = `${id}：${start} ～ ${end}`;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("スケジュール一覧取得エラー:", err);
      document.getElementById("nurseryScheduleList").textContent = "エラーが発生しました";
    });
}
window.openNurseryCalendarModal = openNurseryCalendarModal;







