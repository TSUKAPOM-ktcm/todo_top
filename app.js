const db = firebase.firestore();

// Firestoreの db は HTML 側で初期化されている前提です

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

// モーダルを閉じる
function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
}

// タスク追加処理（Firestore保存あり）
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
    console.log("タスクを保存しました", docRef.id);
    createTaskElement(name, status, frequency, assignee, dueDate, note);
    hideModal();
  }).catch((error) => {
    console.error("Firestore保存エラー:", error);
    alert("タスクの保存に失敗しました");
  });
}

// タスクの表示要素を作成
function createTaskElement(name, status, frequency, assignee, dueDate, note) {
  const task = document.createElement("div");
  task.className = "task-item";
  task.innerHTML = `
    <strong>${name}</strong><br>
    メモ: ${note || "なし"}<br>
    完了予定日: ${dueDate || ""}
  `;
  document.getElementById(`tasks-${assignee}-${status}`)?.appendChild(task);
}

// 伝言メモ追加処理
function addMemoFromForm(e) {
  e.preventDefault();
  const memoText = document.getElementById("memoText").value.trim();

  if (!memoText) {
    alert("メモを入力してください！");
    return;
  }

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

// 予定追加処理
function addEventFromForm(e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const minute = document.getElementById("eventMinute").value;
  const content = document.getElementById("eventContent").value.trim();
  const note = document.getElementById("eventNote").value.trim();

  if (!date || !content) {
    alert("日付と内容は必須です！");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date + "T00:00:00");

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (eventDate <= yesterday) {
    hideModal(); // 昨日以前は表示しない
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
  // ※ 編集モーダル対応は未実装
  document.getElementById("calendar-week").appendChild(event);

  hideModal();
}

// 補助関数
function isSameWeek(date, reference) {
  const ref = new Date(reference);
  const startOfWeek = new Date(ref.setDate(ref.getDate() - ref.getDay()));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  return date >= startOfWeek && date <= endOfWeek;
}

function isSameMonth(date, reference) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function isNextMonthOrLater(date, reference) {
  const refMonth = reference.getMonth();
  const refYear = reference.getFullYear();
  return date > new Date(refYear, refMonth + 1, 0);
}

