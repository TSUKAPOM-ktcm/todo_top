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
  const modalText = document.getElementById("modalText");
  const confirmButtons = document.getElementById("confirmButtons");

  taskForm.classList.add("hidden");
  memoForm.classList.add("hidden");
  editForm.classList.add("hidden");
  modalText.style.display = "none";
  confirmButtons.style.display = "none";

  if (type === "task") {
    taskForm.classList.remove("hidden");
  } else if (type === "memo") {
    memoForm.classList.remove("hidden");
  } else if (type === "edit") {
    editForm.classList.remove("hidden");
  } else {
    modalText.style.display = "block";
    confirmButtons.style.display = "flex";
  }

  modal.style.display = "flex";
  modal.classList.remove("hidden");
  modal.dataset.type = type;
}

function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
  document.getElementById("taskForm").reset();
  document.getElementById("memoForm").reset();
  document.getElementById("editForm").reset();
}

function hideMemoModal() {
  const memoModal = document.getElementById("memoViewModal");
  memoModal.classList.add("hidden");
  memoModal.style.display = "none";
  document.getElementById("fullMemoText").textContent = "";
  document.getElementById("deleteMemoBtn").onclick = null;
}

function confirmModal() {
  const type = document.getElementById("modal").dataset.type;
  hideModal();
  if (type === "memo") {
    addMemo();
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
    <strong class="task-title">${name}</strong><br>
    頻度: ${frequency} ／ 予定日: ${dueDate || "（未設定）"}<br>
    メモ: ${note || "なし"}
  `;

  taskDiv.addEventListener("click", () => {
    openEditModal(taskDiv);
  });

  const containerId = `tasks-${assignee}-${status}`;
  const container = document.getElementById(containerId);
  if (container) {
    container.appendChild(taskDiv);
  }
}

function openEditModal(taskDiv) {
  const oldForm = document.getElementById("editForm");
  const newForm = oldForm.cloneNode(true);
  oldForm.parentNode.replaceChild(newForm, oldForm);

  newForm.querySelector("#editTaskId").value = taskDiv.dataset.taskId;
  newForm.querySelector("#editStatus").value = taskDiv.dataset.status;
  newForm.querySelector("#editAssignee").value = taskDiv.dataset.assignee;

  showModal("edit");

  newForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const newStatus = newForm.querySelector("#editStatus").value;
    const newAssignee = newForm.querySelector("#editAssignee").value;

    taskDiv.dataset.status = newStatus;
    taskDiv.dataset.assignee = newAssignee;

    if (newStatus === "完了") {
      taskDiv.remove();
    } else {
      const newContainerId = `tasks-${newAssignee}-${newStatus}`;
      const container = document.getElementById(newContainerId);
      if (container) {
        container.appendChild(taskDiv);
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
      const memoModal = document.getElementById("memoViewModal");
      memoModal.classList.remove("hidden");
      memoModal.style.display = "flex";

      document.getElementById("deleteMemoBtn").onclick = function () {
        memoDiv.remove();
        hideMemoModal();
      };
    });

    document.getElementById("memos").appendChild(memoDiv);
  }
  hideModal();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").style.display = "none";

  document.getElementById("taskForm").addEventListener("submit", addTaskFromForm);
  document.getElementById("memoForm").addEventListener("submit", addMemoFromForm);
});
