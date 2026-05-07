const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "/index.html";

document.getElementById("userBadge").textContent = `${user.name} (${user.role})`;

const formMessage = document.getElementById("formMessage");
const recordsBody = document.getElementById("recordsBody");

function showMessage(text, type) {
  formMessage.innerHTML = `<div class="message ${type}">${text}</div>`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function statusClass(status) {
  if (status === "delivered") return "status-approved";
  if (status === "dispatched") return "status-pending";
  if (status === "in-transit") return "status-rejected";
  return "";
}

function updateStats(records) {
  document.getElementById("totalCount").textContent = records.length;
  document.getElementById("incomingCount").textContent = records.filter((r) => r.movementType === "incoming").length;
  document.getElementById("outgoingCount").textContent = records.filter((r) => r.movementType === "outgoing").length;
  document.getElementById("deliveredCount").textContent = records.filter((r) => r.status === "delivered").length;
}

function renderTable(records) {
  recordsBody.innerHTML = "";

  if (!records.length) {
    recordsBody.innerHTML = `<tr><td colspan="9">No records found</td></tr>`;
    updateStats([]);
    return;
  }

  updateStats(records);

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.referenceNo}</td>
      <td>${record.movementType} / ${record.articleType}</td>
      <td>${record.sender}</td>
      <td>${record.receiver}</td>
      <td>${record.department}</td>
      <td>${formatDate(record.recordDate)}</td>
      <td class="${statusClass(record.status)}">${record.status}</td>
      <td>${record.remarks || "-"}</td>
      <td>
        <select id="status-${record._id}">
          <option value="received">Received</option>
          <option value="in-transit">In Transit</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
        </select>
        <button class="small" onclick="updateRecord('${record._id}')">Save</button>
      </td>
    `;
    recordsBody.appendChild(row);
    document.getElementById(`status-${record._id}`).value = record.status;
  });
}

async function loadAllRecords() {
  const response = await fetch(`/records/all?userId=${user.id}`);
  const data = await response.json();
  if (!response.ok) return;
  renderTable(data);
}

async function createRecord() {
  const payload = {
    userId: user.id,
    movementType: document.getElementById("movementType").value,
    articleType: document.getElementById("articleType").value,
    referenceNo: document.getElementById("referenceNo").value.trim(),
    sender: document.getElementById("sender").value.trim(),
    receiver: document.getElementById("receiver").value.trim(),
    department: document.getElementById("department").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    recordDate: document.getElementById("recordDate").value,
    status: document.getElementById("status").value,
    remarks: document.getElementById("remarks").value.trim()
  };

  const response = await fetch("/records/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    showMessage(data.message || "Failed to create record", "error");
    return;
  }

  showMessage("Record saved", "success");
  loadAllRecords();
}

async function searchRecords() {
  const params = new URLSearchParams({
    userId: user.id,
    movementType: document.getElementById("fMovement").value,
    articleType: document.getElementById("fArticle").value,
    status: document.getElementById("fStatus").value,
    department: "all",
    keyword: document.getElementById("fKeyword").value.trim()
  });

  const response = await fetch(`/records/search?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) return;
  renderTable(data);
}

async function updateRecord(recordId) {
  const status = document.getElementById(`status-${recordId}`).value;

  const response = await fetch("/records/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, recordId, status })
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.message || "Update failed");
    return;
  }

  loadAllRecords();
}

window.updateRecord = updateRecord;

document.getElementById("createBtn").addEventListener("click", createRecord);
document.getElementById("searchBtn").addEventListener("click", searchRecords);
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("fMovement").value = "all";
  document.getElementById("fArticle").value = "all";
  document.getElementById("fStatus").value = "all";
  document.getElementById("fKeyword").value = "";
  loadAllRecords();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "/index.html";
});

loadAllRecords();
