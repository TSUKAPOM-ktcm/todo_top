// Firebase 初期化は HTML 側にある前提です（db はグローバル）
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
  }
}

function addTaskFromForm(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  // Firestore に保存
  db.collection("tasks").add({
    name,
    status,
    frequency,
    assignee,
    dueDate: dueDate || null,
    note: note || "",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
    console.log("タスクを保存しました (ID:", docRef.id, ")");
    // 表示に反映（今まで通り）
    createTaskElement(name, status, frequency, assignee, dueDate, note);
    hideModal();
  })
  .catch((error) => {
    console.error("Firestore保存エラー:", error);
    alert("タスクの保存に失敗しました");
  });
}

function createTaskElement(name, status, frequency, assignee, dueDate, note) {
  const task = document.createElement("div");
  task.className = "task-item";
  task.innerHTML = `
    <strong>${name}</strong><br>
    メモ: ${note || "なし"}<br>
    完了予定日: ${dueDate || ""}
  `;
  task.onclick = () => {
    alert("クリックされたタスク: " + name); // 編集モーダルも後で追加可
  };

  // 仮の表示先（今後 status と assignee で分岐して appendChild する）
  document.getElementById("tasks-つみき-未対応")?.appendChild(task);
}

function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
}
