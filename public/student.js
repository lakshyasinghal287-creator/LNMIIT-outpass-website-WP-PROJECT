const user = JSON.parse(localStorage.getItem("user") || "null");

if (!user || user.role !== "student") {
  window.location.href = "/index.html";
}

const requestsBody = document.getElementById("requestsBody");
const formMessage = document.getElementById("formMessage");
const editModal = document.getElementById("editModal");
const editOutTime = document.getElementById("editOutTime");
const editReturnTime = document.getElementById("editReturnTime");
const editReason = document.getElementById("editReason");

let selectedOutpassId = null;
let myRequests = [];

const pickerOptions = {
  enableTime: true,
  dateFormat: "Y-m-d\\TH:i",
  altInput: true,
  altFormat: "d M Y, h:i K",
  minuteIncrement: 5,
  allowInput: false
};

flatpickr("#outTime", pickerOptions);
flatpickr("#returnTime", pickerOptions);
const editOutPicker = flatpickr("#editOutTime", pickerOptions);
const editReturnPicker = flatpickr("#editReturnTime", pickerOptions);

function showFormMessage(text, type) {
  formMessage.innerHTML = `<div class="message ${type}">${text}</div>`;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function statusClass(status) {
  if (status === "Approved") return "status-approved";
  if (status === "Rejected") return "status-rejected";
  return "status-pending";
}

function updateStats(data) {
  const pending = data.filter((x) => x.status === "Pending").length;
  const approved = data.filter((x) => x.status === "Approved").length;
  const rejected = data.filter((x) => x.status === "Rejected").length;

  document.getElementById("totalCount").textContent = data.length;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("approvedCount").textContent = approved;
  document.getElementById("rejectedCount").textContent = rejected;
}

function openEditModal(outpassId) {
  const request = myRequests.find((item) => item._id === outpassId);
  if (!request) return;

  selectedOutpassId = outpassId;
  editOutPicker.setDate(request.outTime, true);
  editReturnPicker.setDate(request.returnTime, true);
  editReason.value = request.reason;
  editModal.classList.add("show");
}

function closeEditModal() {
  editModal.classList.remove("show");
  selectedOutpassId = null;
}

async function loadMyRequests() {
  const response = await fetch(`/outpass/my?userId=${user.id}`);
  const data = await response.json();

  myRequests = data;
  updateStats(data);
  requestsBody.innerHTML = "";

  if (!data.length) {
    requestsBody.innerHTML = `<tr><td colspan="6">No requests found</td></tr>`;
    return;
  }

  data.forEach((item) => {
    const row = document.createElement("tr");

    const actionButtons = item.status === "Pending"
      ? `
        <button class="small" onclick="openEditModal('${item._id}')">Edit</button>
        <button class="small danger" onclick="cancelRequest('${item._id}')">Cancel</button>
      `
      : "-";

    row.innerHTML = `
      <td>${formatDate(item.outTime)}</td>
      <td>${formatDate(item.returnTime)}</td>
      <td>${item.reason}</td>
      <td class="${statusClass(item.status)}">${item.status}</td>
      <td>${item.adminComment || "-"}</td>
      <td>${actionButtons}</td>
    `;
    requestsBody.appendChild(row);
  });
}

async function cancelRequest(outpassId) {
  const ok = confirm("Are you sure you want to cancel this request?");
  if (!ok) return;

  const response = await fetch("/outpass/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, outpassId })
  });

  const data = await response.json();
  if (!response.ok) {
    showFormMessage(data.message || "Failed to cancel request", "error");
    return;
  }

  showFormMessage("Request canceled", "success");
  loadMyRequests();
}

async function saveEdit() {
  const outTime = editOutTime.value;
  const returnTime = editReturnTime.value;
  const reason = editReason.value.trim();

  if (!outTime || !returnTime || !reason) {
    alert("Please fill all fields");
    return;
  }

  const response = await fetch("/outpass/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      outpassId: selectedOutpassId,
      outTime,
      returnTime,
      reason
    })
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.message || "Failed to update request");
    return;
  }

  closeEditModal();
  showFormMessage("Request updated", "success");
  loadMyRequests();
}

document.getElementById("createBtn").addEventListener("click", async () => {
  const outTime = document.getElementById("outTime").value;
  const returnTime = document.getElementById("returnTime").value;
  const reason = document.getElementById("reason").value.trim();

  if (!outTime || !returnTime || !reason) {
    showFormMessage("Please fill all fields", "error");
    return;
  }

  const response = await fetch("/outpass/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, outTime, returnTime, reason })
  });

  const data = await response.json();

  if (!response.ok) {
    showFormMessage(data.message || "Failed to create request", "error");
    return;
  }

  showFormMessage("Outpass request created", "success");
  document.getElementById("outTime").value = "";
  document.getElementById("returnTime").value = "";
  document.getElementById("reason").value = "";
  loadMyRequests();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "/index.html";
});

document.getElementById("cancelEditBtn").addEventListener("click", closeEditModal);
document.getElementById("saveEditBtn").addEventListener("click", saveEdit);

editModal.addEventListener("click", (event) => {
  if (event.target === editModal) closeEditModal();
});

window.openEditModal = openEditModal;
window.cancelRequest = cancelRequest;

loadMyRequests();
