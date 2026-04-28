const user = JSON.parse(localStorage.getItem("user") || "null");

if (!user || user.role !== "admin") {
  window.location.href = "/index.html";
}

const allRequestsBody = document.getElementById("allRequestsBody");
const commentModal = document.getElementById("commentModal");
const adminCommentInput = document.getElementById("adminCommentInput");
const cancelCommentBtn = document.getElementById("cancelCommentBtn");
const saveCommentBtn = document.getElementById("saveCommentBtn");

let selectedOutpassId = null;
let selectedStatus = null;

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function statusClass(status) {
  if (status === "Approved") return "status-approved";
  if (status === "Rejected") return "status-rejected";
  return "status-pending";
}

function openCommentModal(outpassId, status) {
  selectedOutpassId = outpassId;
  selectedStatus = status;
  adminCommentInput.value = "";
  commentModal.classList.add("show");
  adminCommentInput.focus();
}

function closeCommentModal() {
  commentModal.classList.remove("show");
  selectedOutpassId = null;
  selectedStatus = null;
}

async function submitStatusUpdate() {
  const adminComment = adminCommentInput.value.trim();

  const response = await fetch("/outpass/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adminUserId: user.id,
      outpassId: selectedOutpassId,
      status: selectedStatus,
      adminComment
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message || "Failed to update status");
    return;
  }

  closeCommentModal();
  loadAllRequests();
}

async function loadAllRequests() {
  const response = await fetch(`/outpass/all?userId=${user.id}`);
  const data = await response.json();

  allRequestsBody.innerHTML = "";

  if (!response.ok) {
    allRequestsBody.innerHTML = `<tr><td colspan="7">${data.message || "Error"}</td></tr>`;
    return;
  }

  if (!data.length) {
    allRequestsBody.innerHTML = `<tr><td colspan="7">No requests found</td></tr>`;
    return;
  }

  data.forEach((item) => {
    const row = document.createElement("tr");

    const actionButtons = item.status === "Pending"
      ? `
        <button class="small" onclick="openCommentModal('${item._id}', 'Approved')">Approve</button>
        <button class="small danger" onclick="openCommentModal('${item._id}', 'Rejected')">Reject</button>
      `
      : "-";

    row.innerHTML = `
      <td>${item.userId ? item.userId.name : "Unknown"}</td>
      <td>${formatDate(item.outTime)}</td>
      <td>${formatDate(item.returnTime)}</td>
      <td>${item.reason}</td>
      <td class="${statusClass(item.status)}">${item.status}</td>
      <td>${item.adminComment || "-"}</td>
      <td>${actionButtons}</td>
    `;
    allRequestsBody.appendChild(row);
  });
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "/index.html";
});

cancelCommentBtn.addEventListener("click", closeCommentModal);
saveCommentBtn.addEventListener("click", submitStatusUpdate);

commentModal.addEventListener("click", (event) => {
  if (event.target === commentModal) {
    closeCommentModal();
  }
});

window.openCommentModal = openCommentModal;
loadAllRequests();
