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
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal").style.display = "flex";

  ["taskForm", "memoForm", "editForm", "eventForm"].forEach(id => {
    const form = document.getElementById(id);
    if (form) form.classList.add("hidden");
  });

  if (type === "task") document.getElementById("taskForm").classList.remove("hidden");
  else if (type === "memo") document.getElementById("memoForm").classList.remove("hidden");
  else if (type === "edit") document.getElementById("editForm").classList.remove("hidden");
  else if (type === "event") document.getElementById("eventForm").classList.remove("hidden");
}

function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";

  ["taskForm", "memoForm", "editForm", "eventForm"].forEach(id => {
    const form = document.getElementById(id);
    if (form) form.reset();
  });

  document.getElementById("editTaskTitle").textContent = "";
}

function hideMemoModal() {
  const modal = document.getElementById("memoViewModal");
  modal.classList.add("hidden");
  modal.style.display = "none";
  document.getElementById("fullMemoText").textContent = "";
  document.getElementById("deleteMemoBtn").onclick = null;
}

// ================= タスク =====================

document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  const div = document.createElement("div");
  div.className = "task-item";
  div.dataset.name = name;
  div.dataset.status = status;
  div.dataset.frequency = frequency;
  div.dataset.assignee = assignee;
  div.dataset.dueDate = dueDate;
  div.dataset.note = note;
  div.innerHTML = `<strong>${name}</strong><br>メモ: ${note || ""}<br>完了予定日: ${dueDate || ""}`;

  div.onclick = () => openEditModal(div);
  placeTask(div);
  hideModal();
});

function placeTask(div) {
  const status = div.dataset.status;
  const assignee = div.dataset.assignee;
  const due = div.dataset.dueDate;
  const today = new Date().toISOString().split("T")[0];

  if (due && due < today && status !== "完了") {
    document.getElementById("tasks-overdue").appendChild(div);
  } else {
    const box = document.getElementById(`tasks-${assignee}-${status}`);
    if (box) box.appendChild(div);
  }
}

function openEditModal(div) {
  const form = document.getElementById("editForm");
  document.getElementById("editTaskTitle").textContent = div.dataset.name;
  document.getElementById("editStatus").value = div.dataset.status;
  document.getElementById("editAssignee").value = div.dataset.assignee;
  document.getElementById("editDueDate").value = div.dataset.dueDate || "";

  showModal("edit");

  form.onsubmit = function (e) {
    e.preventDefault();
    div.dataset.status = document.getElementById("editStatus").value;
    div.dataset.assignee = document.getElementById("editAssignee").value;
    div.dataset.dueDate = document.getElementById("editDueDate").value;
    div.innerHTML = `<strong>${div.dataset.name}</strong><br>メモ: ${div.dataset.note || ""}<br>完了予定日: ${div.dataset.dueDate || ""}`;

    div.remove();
    placeTask(div);
    hideModal();
  };
}

// =============== メモ ==================

document.getElementById("memoForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const text = document.getElementById("memoText").value;
  const div = document.createElement("div");
  div.className = "memo-item";
  div.dataset.full = text;
  div.textContent = text.length > 100 ? text.slice(0, 100) + "…" : text;

  div.onclick = () => {
    document.getElementById("fullMemoText").textContent = text;
    document.getElementById("memoViewModal").classList.remove("hidden");
    document.getElementById("memoViewModal").style.display = "flex";
    document.getElementById("deleteMemoBtn").onclick = () => {
      div.remove();
      hideMemoModal();
    };
  };

  document.getElementById("memos").appendChild(div);
  hideModal();
});

// =============== 予定 ==================

document.getElementById("eventForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const minute = document.getElementById("eventMinute").value;
  const content = document.getElementById("eventContent").value;
  const note = document.getElementById("eventNote").value;

  const today = new Date().toISOString().split("T")[0];
  if (!date || date < today) {
    hideModal(); return;
  }

  const div = document.createElement("div");
  div.className = "event-item";
  div.dataset.date = date;
  div.dataset.hour = hour;
  div.dataset.minute = minute;
  div.dataset.content = content;
  div.dataset.note = note;

  div.innerHTML = `<strong>${date}</strong> ${hour && minute ? `${hour}:${minute}` : ""} - ${content}`;
  div.onclick = () => openEditEvent(div);

  const d = new Date(date);
  const now = new Date();
  if (isSameWeek(d, now)) {
    document.getElementById("calendar-week").appendChild(div);
  } else if (isSameMonth(d, now)) {
    document.getElementById("calendar-month").appendChild(div);
  }

  hideModal();
});

function openEditEvent(div) {
  const form = document.getElementById("eventForm");
  form.classList.remove("hidden");
  document.getElementById("eventDate").value = div.dataset.date;
  document.getElementById("eventHour").value = div.dataset.hour;
  document.getElementById("eventMinute").value = div.dataset.minute;
  document.getElementById("eventContent").value = div.dataset.content;
  document.getElementById("eventNote").value = div.dataset.note;

  showModal("event");

  form.onsubmit = function (e) {
    e.preventDefault();
    div.dataset.date = document.getElementById("eventDate").value;
    div.dataset.hour = document.getElementById("eventHour").value;
    div.dataset.minute = document.getElementById("eventMinute").value;
    div.dataset.content = document.getElementById("eventContent").value;
    div.dataset.note = document.getElementById("eventNote").value;

    div.innerHTML = `<strong>${div.dataset.date}</strong> ${div.dataset.hour && div.dataset.minute ? `${div.dataset.hour}:${div.dataset.minute}` : ""} - ${div.dataset.content}`;
    div.remove();

    const d = new Date(div.dataset.date);
    const now = new Date();
    if (isSameWeek(d, now)) {
      document.getElementById("calendar-week").appendChild(div);
    } else if (isSameMonth(d, now)) {
      document.getElementById("calendar-month").appendChild(div);
    }

    hideModal();
  };
}

function isSameWeek(date1, date2) {
  const start = new Date(date2);
  start.setDate(date2.getDate() - date2.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return date1 >= start && date1 <= end;
}

function isSameMonth(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth();
}
