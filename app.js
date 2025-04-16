
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

function showModal(type) {
  const modal = document.getElementById("modal");
  const taskForm = document.getElementById("taskForm");
  const memoForm = document.getElementById("memoForm");
  const editForm = document.getElementById("editForm");
  const eventForm = document.getElementById("eventForm");
  const modalText = document.getElementById("modalText");
  const confirmButtons = document.getElementById("confirmButtons");

  [taskForm, memoForm, editForm, eventForm].forEach(f => f.classList.add("hidden"));
  modalText.style.display = "none";
  confirmButtons.style.display = "none";

  if (type === "task") taskForm.classList.remove("hidden");
  else if (type === "memo") memoForm.classList.remove("hidden");
  else if (type === "edit") editForm.classList.remove("hidden");
  else if (type === "event") eventForm.classList.remove("hidden");
  else {
    modalText.style.display = "block";
    confirmButtons.style.display = "flex";
  }

  modal.style.display = "flex";
  modal.classList.remove("hidden");
  modal.dataset.type = type;
}

function hideModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";
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
function addTaskFromForm(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const status = document.getElementById("status").value;
  const frequency = document.getElementById("frequency").value;
  const assignee = document.getElementById("assignee").value;
  const dueDate = document.getElementById("dueDate").value;
  const note = document.getElementById("note").value;

  createTaskElement(name, status, frequency, assignee, dueDate, note);
  hideModal();
}

function createTaskElement(name, status, frequency, assignee, dueDate, note) {
  if (status === "完了") return;

  const taskDiv = document.createElement("div");
  taskDiv.className = "task-item";
  const id = "task-" + Date.now();
  taskDiv.dataset.taskId = id;
  taskDiv.dataset.status = status;
  taskDiv.dataset.assignee = assignee;
  taskDiv.dataset.name = name;
  taskDiv.dataset.frequency = frequency;
  taskDiv.dataset.dueDate = dueDate;
  taskDiv.dataset.note = note;

  taskDiv.innerHTML = `
    <strong>${name}</strong><br>
    メモ: ${note || "なし"}<br>
    完了予定日: ${dueDate || ""}
  `;

  taskDiv.addEventListener("click", () => {
    openEditModal(taskDiv);
  });

  const today = new Date();
  const taskDue = dueDate ? new Date(dueDate + "T00:00:00") : null;
  if (taskDue && taskDue < today && status !== "完了") {
    document.getElementById("tasks-overdue").appendChild(taskDiv);
  } else {
    const containerId = `tasks-${assignee}-${status}`;
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(taskDiv);
    }
  }
}

function openEditModal(taskDiv) {
  const oldForm = document.getElementById("editForm");
  const newForm = oldForm.cloneNode(true);
  oldForm.parentNode.replaceChild(newForm, oldForm);

  newForm.querySelector("#editTaskId").value = taskDiv.dataset.taskId;
  newForm.querySelector("#editStatus").value = taskDiv.dataset.status;
  newForm.querySelector("#editAssignee").value = taskDiv.dataset.assignee;
  newForm.querySelector("#editDueDate").value = taskDiv.dataset.dueDate || "";
  document.getElementById("editTaskTitle").textContent = taskDiv.dataset.name;

  showModal("edit");

  newForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const newStatus = newForm.querySelector("#editStatus").value;
    const newAssignee = newForm.querySelector("#editAssignee").value;
    const newDueDate = newForm.querySelector("#editDueDate").value;

    taskDiv.dataset.status = newStatus;
    taskDiv.dataset.assignee = newAssignee;
    taskDiv.dataset.dueDate = newDueDate;

    if (newStatus === "完了") {
      taskDiv.remove();
    } else {
      const taskDue = newDueDate ? new Date(newDueDate + "T00:00:00") : null;
      taskDiv.innerHTML = `
        <strong>${taskDiv.dataset.name}</strong><br>
        メモ: ${taskDiv.dataset.note || "なし"}<br>
        完了予定日: ${newDueDate || ""}
      `;
      taskDiv.onclick = () => openEditModal(taskDiv);

      if (taskDue && taskDue < new Date()) {
        document.getElementById("tasks-overdue").appendChild(taskDiv);
      } else {
        const newContainerId = `tasks-${newAssignee}-${newStatus}`;
        const container = document.getElementById(newContainerId);
        if (container) {
          container.appendChild(taskDiv);
        }
      }
    }

    hideModal();
  });
}

function addMemoFromForm(e) {
  e.preventDefault();
  const memo = document.getElementById("memoText").value.trim();
  if (memo) {
    const memoDiv = document.createElement("div");
    memoDiv.className = "memo-item";
    memoDiv.dataset.fullText = memo;
    memoDiv.textContent = memo.length > 100 ? memo.slice(0, 100) + "…" : memo;

    memoDiv.addEventListener("click", () => {
      document.getElementById("fullMemoText").textContent = memo;
      const modal = document.getElementById("memoViewModal");
      modal.classList.remove("hidden");
      modal.style.display = "flex";
      document.getElementById("deleteMemoBtn").onclick = () => {
        memoDiv.remove();
        hideMemoModal();
      };
    });

    document.getElementById("memos").appendChild(memoDiv);
  }
  hideModal();
}

function addEventFromForm(e) {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const hour = document.getElementById("eventHour").value;
  const minute = document.getElementById("eventMinute").value;
  const content = document.getElementById("eventContent").value;
  const note = document.getElementById("eventNote").value;

  if (!date || !content.trim()) {
    alert("日付と内容は必須です！");
    return;
  }

  const datetime = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0") || "00"}:00`);
  const today = new Date();
  const isThisWeek = isSameWeek(datetime, today);
  const isThisMonth = isSameMonth(datetime, today);

  const eventDiv = document.createElement("div");
  eventDiv.className = "event-item";
  eventDiv.innerHTML = `<strong>${date}</strong> ${hour && minute ? `${hour}:${minute}` : ""} - ${content}`;
  eventDiv.dataset.date = date;
  eventDiv.dataset.hour = hour;
  eventDiv.dataset.minute = minute;
  eventDiv.dataset.content = content;
  eventDiv.dataset.note = note;

  eventDiv.onclick = () => {
    const fullText = `日付: ${date}\n時間: ${hour || ""}:${minute || ""}\n内容: ${content}\nメモ: ${note || ""}`;
    alert(fullText);
  };

  if (isThisWeek) document.getElementById("calendar-week").appendChild(eventDiv);
  else if (isThisMonth) document.getElementById("calendar-month").appendChild(eventDiv);

  hideModal();
}

function isSameWeek(date1, reference) {
  const oneDay = 86400000;
  const dayOfWeek = reference.getDay();
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - dayOfWeek);
  const end = new Date(start.getTime() + 6 * oneDay);
  return date1 >= start && date1 <= end;
}

function isSameMonth(date1, reference) {
  return date1.getFullYear() === reference.getFullYear() && date1.getMonth() === reference.getMonth();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";

  document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);
  document.getElementById("eventForm").addEventListener("submit", addEventFromForm);
});
