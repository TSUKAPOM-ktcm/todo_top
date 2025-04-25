// Firestoreの db は HTML 側で初期化されている前提です　
const db = window.db;
// 保育園情報のデータ連携超過を防ぐため、キャッシュ用意
let nurseryCache = {};

function drawWeeklyBarGraph(counts) {
  const labels = [];
  const tsumikiData = [];
  const numikiData = [];

  const start = new Date();
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    labels.push(`${d.getMonth()+1}/${d.getDate()}`);
    tsumikiData.push(counts[dateStr]?.つみき || 0);
    numikiData.push(counts[dateStr]?.ぬみき || 0);
  }

  const ctx = document.getElementById("weeklyGraph").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "つみき",
          data: tsumikiData,
          backgroundColor: "#f8b4d9"
        },
        {
          label: "ぬみき",
          data: numikiData,
          backgroundColor: "#a5d8ff"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function renderWeeklyGraph() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const counts = {};

  db.collection("tasks")
    .where("status", "==", "完了")
    .where("completedAt", ">=", weekStart)
    .where("completedAt", "<=", weekEnd)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const dateStr = data.completedAt?.toDate().toISOString().split("T")[0];
        const assignee = data.assignee || "未設定";
        if (!counts[dateStr]) counts[dateStr] = { "つみき": 0, "ぬみき": 0 };
        if (assignee === "つみき" || assignee === "ぬみき") {
          counts[dateStr][assignee]++;
        }
      });

      drawWeeklyBarGraph(counts);
    });
}

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
        initializeAfterLogin();
      } else {
        alert("IDかパスワードが違います");
      }
    })
    .catch((error) => {
      console.error("ログイン時のエラー:", error);
      alert("ログインに失敗しました");
    });
}
// ページ読み込み時に初期状態を設定
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("mainScreen").classList.add("hidden");
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
  document.getElementById("memoViewModal").classList.add("hidden");
  document.getElementById("memoViewModal").style.display = "none";
  document.getElementById("loginBtn").addEventListener("click", login);
});

function getTaskColorClass(frequency) {
  if (frequency.includes("毎日")) return "task-daily";
  if (frequency.includes("毎週")) return "task-weekly";
  if (frequency.includes("毎月")) return "task-monthly";
  return "";
}

// 🔧 ログイン後の初期化処理（描画やリアルタイム監視）
function initializeAfterLogin() {
  renderTodayNursery();
  setupTodayCompletedTasksListener();
  renderOkaimonoList();
  renderWeeklyGraph();
  // ✅ 差分描画：tasks の変更だけ反映！
  db.collection("tasks").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      const id = change.doc.id;
      if (data.delete === true || data.status === "完了") {
        document.querySelector(`[data-id="${id}"]`)?.remove();
        return;
      }
      if (change.type === "added") {
        createTaskElement(data.name, data.status, data.frequency, data.assignee, data.dueDate, data.note, id);
      }
      if (change.type === "modified") {
        document.querySelector(`[data-id="${id}"]`)?.remove();
        createTaskElement(data.name, data.status, data.frequency, data.assignee, data.dueDate, data.note, id);
      }
      if (change.type === "removed") {
        document.querySelector(`[data-id="${id}"]`)?.remove();
      }
    });
  });
   // events は1回だけ取得
  db.collection("events").get().then(renderEventsFromSnapshot);
  // memos も1回だけ取得
  db.collection("memos").get().then(renderMemosFromSnapshot);
}

  // 🔧 タスクが完了に更新されたとき completedAt をセット
function updateTaskStatusToCompleted(taskId, updateData) {
  if (updateData.status === "完了") {
    updateData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
  }
  return db.collection("tasks").doc(taskId).update(updateData);
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
  
// 🔸今日の保育園時間を表示する
function renderTodayNursery() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const startEl = document.getElementById("nurseryStart");
  const endEl = document.getElementById("nurseryEnd");

  db.collection("nursery").doc(dateStr).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data.start == null || data.end == null) {
        startEl.textContent = "おやすみ🐝🐝";
        endEl.textContent = "";
      } else {
        startEl.textContent = data.start;
        endEl.textContent = data.end;
      }
    } else {
      startEl.textContent = "--:--";
      endEl.textContent = "--:--";
    }
  });
}

// 🔧 お買い物メモモーダルの表示
function showOkaimonoModal(existingId = null, existingText = "") {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  content.innerHTML = `
    <form id="okaimonoForm">
      <h3>お買い物メモ</h3>
      <label>内容<br><textarea id="okaimonoText" required>${existingText}</textarea></label>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">保存</button>
      </div>
    </form>
  `;

  document.getElementById("okaimonoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("okaimonoText").value.trim();
    if (!text) return;

    if (existingId) {
      db.collection("okaimono").doc(existingId).update({
        text,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      db.collection("okaimono").add({
        text,
        complete: false,
        delete: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    hideModal();
  });
}

window.showOkaimonoModal = showOkaimonoModal;

// 🔧 お買い物メモの一覧を表示
function renderOkaimonoList() {
  const container = document.getElementById("okaimonoList");
  if (!container) return;
  container.innerHTML = "";

  db.collection("okaimono").where("delete", "!=", true).onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(change => {
      const doc = change.doc;
      const data = doc.data();
      const id = doc.id;

      const existing = container.querySelector(`[data-id="${id}"]`);

      // 削除されたら要素を消す
      if (change.type === "removed" || data.delete === true) {
        existing?.remove();
        return;
      }

      // 更新や追加の場合は要素を再描画
      const div = document.createElement("div");
      div.className = "okaimono-item" + (data.complete ? " complete" : "");
      div.textContent = data.text;
      div.dataset.id = id;
      div.onclick = () => showOkaimonoEditModal(id, data);

      // 既存があれば置き換え、新規なら追加
      if (existing) {
        container.replaceChild(div, existing);
      } else {
        container.appendChild(div);
      }
    });
  });
}

// 🔧 お買い物メモ 編集用モーダル
function showOkaimonoEditModal(id, data) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  content.innerHTML = `
    <form id="okaimonoEditForm">
      <h3>お買い物メモの編集</h3>
      <label>内容<br><textarea id="editOkaimonoText">${data.text}</textarea></label>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">保存</button>
        <button type="button" id="deleteOkaimonoBtn">削除</button>
      </div>
    </form>
  `;

  document.getElementById("okaimonoEditForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("editOkaimonoText").value.trim();
    if (!text) return;
    db.collection("okaimono").doc(id).update({ text });
    hideModal();
  });

  document.getElementById("deleteOkaimonoBtn").onclick = () => {
    db.collection("okaimono").doc(id).update({ delete: true });
    hideModal();
  };
}

window.showOkaimonoEditModal = showOkaimonoEditModal;

// 判定用補助関数
function formatTime(date) {
  if (!date) return "--:--";
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 🔸 担当者別・今日の完了タスク数を表示
function setupTodayCompletedTasksListener() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  db.collection("tasks")
    .where("status", "==", "完了")
    .where("completedAt", ">=", today)
    .where("completedAt", "<=", endOfToday)
    .onSnapshot((snapshot) => {
      const counts = {
        つみき: [],
        ぬみき: []
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.assignee === "つみき" || data.assignee === "ぬみき") {
          counts[data.assignee].push({
            name: data.name,
            time: formatTime(data.completedAt?.toDate())
          });
        }
      });

      document.getElementById("done-tsumiki-count").textContent = counts.つみき.length;
      document.getElementById("done-numiki-count").textContent = counts.ぬみき.length;

      document.getElementById("done-tsumiki-count").onclick = () => showDoneTasksModal("つみき", counts.つみき);
      document.getElementById("done-numiki-count").onclick = () => showDoneTasksModal("ぬみき", counts.ぬみき);
    });
}


function showDoneTasksModal(assignee, list) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  let html = `<div style="max-height:400px; overflow-y:auto;"><h3>${assignee}さんの完了タスク</h3><ul>`;
  if (list.length === 0) {
    html += "<li>なし</li>";
  } else {
    list.forEach(task => {
      html += `<li>${task.name}（${task.time}）</li>`;
    });
  }
  html += `</ul></div><div class="modal-buttons"><button onclick="hideModal()">閉じる</button></div>`;
  content.innerHTML = html;
}

window.showDoneTasksModal = showDoneTasksModal;


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


function renderTasksFromSnapshot(snapshot) {
  const taskContainers = document.querySelectorAll("[id^='tasks-']");
  taskContainers.forEach(container => container.innerHTML = "");
  document.getElementById("tasks-overdue").innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tasks = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;

    if (data.delete === true || data.status === "完了") return;

    tasks.push({ ...data, id });
  });

  const frequencyOrder = {
    "毎日": 1,
    "毎週": 2,
    "隔週": 3,
    "毎月": 4,
    "都度": 5
  };

  function getDailySubOrder(taskName) {
  if (taskName.startsWith("【毎日】朝_")) return 1;
  if (taskName.startsWith("【毎日】昼_")) return 2;
  if (taskName.startsWith("【毎日】夕夜_")) return 3;
  return 4; // その他
}

  tasks.sort((a, b) => {
    const orderA = frequencyOrder[a.frequency] ?? 99;
    const orderB = frequencyOrder[b.frequency] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
// 毎日タスクの場合、サブ順で比較
  if (a.frequency === "毎日" && b.frequency === "毎日") {
    const subA = getDailySubOrder(a.name);
    const subB = getDailySubOrder(b.name);
    return subA - subB;
  }

  return 0; // 頻度が同じで毎日でもなければ順番そのまま
});

  tasks.forEach(data => {
    const id = data.id;
    const due = data.dueDate ? new Date(data.dueDate + "T00:00:00") : null;
    const isOverdue = due && due <= yesterday && data.status !== "完了";

    createTaskElement(
      data.name,
      data.status,
      data.frequency,
      data.assignee,
      data.dueDate,
      data.note,
      id,
      isOverdue
    );
  });
}



 function renderEventsFromSnapshot(snapshot) {
  const weekEl = document.getElementById("calendar-week");
  const monthEl = document.getElementById("calendar-month");
  const futureEl = document.getElementById("calendar-future");

  if (!weekEl || !monthEl || !futureEl) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  snapshot.docChanges().forEach(change => {
    const doc = change.doc;
    const data = doc.data();
    const id = doc.id;

    // 削除または削除フラグ付きなら remove
    if (change.type === "removed" || data.deleted) {
      document.querySelector(`[data-id='${id}']`)?.remove();
      return;
    }

    const eventDate = new Date(data.date + "T00:00:00");
    if (eventDate < today) return; // 昨日以前は無視

    // 表示エレメント作成
    const event = document.createElement("div");
    event.className = "event-item";
    event.dataset.id = id;
    event.dataset.date = data.date;
    event.dataset.hour = data.hour;
    event.dataset.minute = data.minute;
    event.dataset.content = data.content;
    event.dataset.note = data.note;

    const time = data.hour && data.minute ? `${data.hour}:${data.minute}` : "";
    event.innerHTML = `<strong>${data.date}</strong> ${time} - ${data.content}`;
    event.onclick = () => openEditEventModal(event);

    // 既存があれば差し替え
    const existing = document.querySelector(`[data-id='${id}']`);
    if (existing) {
      existing.replaceWith(event);
    } else {
      if (isSameWeek(eventDate, today)) {
        weekEl.appendChild(event);
      } else if (isSameMonth(eventDate, today)) {
        monthEl.appendChild(event);
      } else if (isNextMonthOrLater(eventDate, today)) {
        futureEl.appendChild(event);
      }
    }
  });
}


function renderMemosFromSnapshot(snapshot) {
  const container = document.getElementById("memos");
  if (!container) return;

  snapshot.docChanges().forEach(change => {
    const doc = change.doc;
    const data = doc.data();
    const id = doc.id;

    // 削除 or 削除フラグ付きなら削除
    if (change.type === "removed" || data.deleted) {
      const existing = container.querySelector(`[data-id="${id}"]`);
      existing?.remove();
      return;
    }

    const displayText = data.text.length > 100 ? data.text.slice(0, 100) + "…" : data.text;

    const memoDiv = document.createElement("div");
    memoDiv.className = "memo-item";
    memoDiv.dataset.id = id; // ← これが差分描画で必要！
    memoDiv.dataset.full = data.text;
    memoDiv.textContent = displayText;

    memoDiv.onclick = () => {
      document.getElementById("fullMemoText").textContent = data.text;
      document.getElementById("memoViewModal").classList.remove("hidden");
      document.getElementById("memoViewModal").style.display = "flex";
      document.getElementById("deleteMemoBtn").onclick = () => {
        db.collection("memos").doc(id).update({ deleted: true });
        memoDiv.remove(); // ← 自前で即時削除
        hideMemoModal();
      };
    };

    // すでに存在すれば差し替え、なければ追加
    const existing = container.querySelector(`[data-id="${id}"]`);
    if (existing) {
      container.replaceChild(memoDiv, existing);
    } else {
      container.appendChild(memoDiv);
    }
  });
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

function createTaskElement(name, status, frequency, assignee, dueDate, note, id, isOverdue = false) {
  const task = document.createElement("div");
   const colorClass = getTaskColorClass(frequency);
  task.className = "task-item " + colorClass; // ← 色も反映！
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
  isOverdue = due && due <= yesterday && status !== "完了";

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
        <button type="button" id="deleteTaskBtn">削除</button>
      </div>
    </form>
  `;

  document.getElementById("editStatus").value = task.dataset.status;
  document.getElementById("editAssignee").value = task.dataset.assignee;
  document.getElementById("editDueDate").value = task.dataset.dueDate || "";
  document.getElementById("editNote").value = task.dataset.note || "";

  // 保存処理
  document.getElementById("editTaskForm").onsubmit = (e) => {
    e.preventDefault();
    const newStatus = document.getElementById("editStatus").value;
    const newAssignee = document.getElementById("editAssignee").value;
    const newDueDate = document.getElementById("editDueDate").value;
    const newNote = document.getElementById("editNote").value;
    const id = task.dataset.id;

updateTaskStatusToCompleted(id, {
  status: newStatus,
  assignee: newAssignee,
  dueDate: newDueDate || null,
  note: newNote || ""
}).then(() => {
  hideModal(); // モーダル閉じるだけでOK！
}).catch((error) => {
  console.error("更新エラー:", error);
});
    
  // 🗑削除ボタン処理
  document.getElementById("deleteTaskBtn").addEventListener("click", () => {
    const id = task.dataset.id;
    db.collection("tasks").doc(id).update({
      delete: true
    }).then(() => {
      task.remove(); // 表示から削除
      hideModal();
    }).catch((error) => {
      console.error("削除エラー:", error);
    });
  });
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




//保育園編集！
// 🔧 「一覧を見る」ボタンで保育園スケジュールカレンダーモーダルを表示
function openNurseryCalendarModal() {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  let selectedYear = currentYear;
  let selectedMonth = currentMonth;

  renderNurseryCalendar(selectedYear, selectedMonth);
}
  function renderNurseryCalendar(y, m) {
    selectedYear = y;
    selectedMonth = m;

    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startWeekDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const yearMonthStr = `${y}年${m + 1}月`;

    content.innerHTML = `
      <div>
        <h3>保育園スケジュール（${yearMonthStr}）</h3>
        <div style="margin-bottom: 10px; text-align: center;">
          <button id="prevMonth" style="display: ${m > currentMonth ? 'inline-block' : 'none'}">←今月</button>
          <button id="nextMonth" style="display: ${m === currentMonth ? 'inline-block' : 'none'}">来月→</button>
        </div>
        <table class="calendar-table">
          <thead>
            <tr><th>日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th></tr>
          </thead>
          <tbody id="calendarBody"></tbody>
        </table>
        <div class="modal-buttons">
          <button onclick="hideModal()">閉じる</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const prevBtn = document.getElementById("prevMonth");
      const nextBtn = document.getElementById("nextMonth");

      if (prevBtn) {
        prevBtn.addEventListener("click", () => renderNurseryCalendar(currentYear, currentMonth));
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", () => renderNurseryCalendar(currentYear, currentMonth + 1));
      }
    }, 0);

    const calendarBody = document.getElementById("calendarBody");
    calendarBody.innerHTML = "";

    const weeks = [];
    let currentDay = 1;

    while (currentDay <= totalDays) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        if ((weeks.length === 0 && i < startWeekDay) || currentDay > totalDays) {
          week.push("<td></td>");
        } else {
          const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
          week.push(`<td id="day-${dateStr}" data-date="${dateStr}"><strong>${currentDay}</strong><br><span class="nursery-time"></span></td>`);
          currentDay++;
        }
      }
      weeks.push("<tr>" + week.join("") + "</tr>");
    }
    calendarBody.innerHTML = weeks.join("");

    const monthStr = String(m + 1).padStart(2, '0');
    const startDate = `${y}-${monthStr}-01`;
    const endDate = `${y}-${monthStr}-${String(totalDays).padStart(2, '0')}`;

    fetchNurseryDataIfNeeded(selectedYear, selectedMonth).then(monthData => {
  Object.entries(monthData).forEach(([date, d]) => {
    const cell = document.getElementById("day-" + date);
    if (cell) {
      const label = (!d.start && !d.end)
        ? "休" // ← お休みの表示も修正済みバージョン
        : (d.start && d.end) ? `${d.start}〜${d.end}` : "";
      const timeSpan = cell.querySelector(".nursery-time");
      if (timeSpan) timeSpan.textContent = label;
      if (label !== "") {
        cell.style.cursor = "pointer";
        cell.onclick = () => window.openNurseryEditModalByDate(date);
      }
    }
  });
});
}

// 🔧 今日の日付の保育園時間を編集するモーダルを開く
function openNurseryEditModal() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  openNurseryEditModalByDate(dateStr);
}
window.openNurseryEditModal = openNurseryEditModal;

function openNurseryEditModalByDate(dateStr) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  content.innerHTML = `
    <form id="editNurseryForm">
      <h3>保育園時間の編集（${dateStr}）</h3>
      <label>開始時間<input type="time" id="editNurseryStart"></label>
      <label>終了時間<input type="time" id="editNurseryEnd"></label>
      <div class="modal-buttons">
        <button type="button" onclick="hideModal()">キャンセル</button>
        <button type="submit">保存</button>
      </div>
    </form>
  `;

  // 🔽 Firestoreから既存データを読み取って、モーダルに反映！
  db.collection("nursery").doc(dateStr).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data.start) {
        document.getElementById("editNurseryStart").value = data.start.padStart(5, '0');
      }
      if (data.end) {
        document.getElementById("editNurseryEnd").value = data.end.padStart(5, '0');
      }
    }
  });

  // ✅ 🔧「保存」ボタンが押されたときに書き込む処理！
  document.getElementById("editNurseryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const start = document.getElementById("editNurseryStart").value;
    const end = document.getElementById("editNurseryEnd").value;

    db.collection("nursery").doc(dateStr).set({
      start: start || null,
      end: end || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      const y = parseInt(dateStr.split("-")[0]);
      const m = parseInt(dateStr.split("-")[1]) - 1;
      const key = `${y}-${m}`;
      if (window.nurseryCache?.[key]) {
        nurseryCache[key][dateStr] = { start: start || null, end: end || null };
      }
      renderTodayNursery();
      hideModal();
    });
  });
}


function renderWeeklyCompletedTasksChart() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const dailyCounts = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dailyCounts[key] = { つみき: 0, ぬみき: 0 };
  }

  db.collection("tasks")
    .where("status", "==", "完了")
    .where("completedAt", ">=", startOfWeek)
    .where("completedAt", "<=", endOfWeek)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const dateKey = data.completedAt.toDate().toISOString().split("T")[0];
        const assignee = data.assignee;
        if (dailyCounts[dateKey] && (assignee === "つみき" || assignee === "ぬみき")) {
          dailyCounts[dateKey][assignee]++;
        }
      });

      drawBarChart(dailyCounts);
    });
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

function fetchNurseryDataIfNeeded(y, m) {
  const key = `${y}-${m}`;
  if (nurseryCache[key]) {
    return Promise.resolve(nurseryCache[key]); // キャッシュがあれば即返す
  } else {
    const monthStr = String(m + 1).padStart(2, '0');
    const startDate = `${y}-${monthStr}-01`;
    const endDate = `${y}-${monthStr}-31`; // 月末までざっくり範囲指定
    return db.collection("nursery")
      .where(firebase.firestore.FieldPath.documentId(), ">=", startDate)
      .where(firebase.firestore.FieldPath.documentId(), "<=", endDate)
      .get()
      .then(snapshot => {
        const monthData = {};
        snapshot.forEach(doc => {
          monthData[doc.id] = doc.data();
        });
        nurseryCache[key] = monthData;
        return monthData;
      });
  }
}


window.openNurseryEditModalByDate = openNurseryEditModalByDate;
}
