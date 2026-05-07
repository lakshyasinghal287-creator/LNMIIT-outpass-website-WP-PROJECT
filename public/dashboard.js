const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "/index.html";

document.getElementById("userBadge").textContent = `${user.name} (${user.role})`;
const formMessage = document.getElementById("formMessage");
const recordsBody = document.getElementById("recordsBody");
let currentRecords = [];
const DEPARTMENTS = [
  "Accounts",
  "Admissions",
  "Central Library",
  "Dean Office",
  "Estate Office",
  "Examination Cell",
  "Hostel Office",
  "Human Resources",
  "IT Services",
  "Registrar Office",
  "Security Office",
  "Student Affairs"
];

function showMessage(text, type) { formMessage.innerHTML = `<div class="message ${type}">${text}</div>`; }
function formatDate(date) { return new Date(date).toLocaleDateString(); }
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function titleCaseText(value) {
  if (!value) return "-";
  return String(value)
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function formatType(movementType, articleType) {
  return `${titleCaseText(movementType)} / ${titleCaseText(articleType)}`;
}
function statusClass(status) {
  if (status === "delivered") return "status-approved";
  if (status === "dispatched") return "status-pending";
  if (status === "in-transit") return "status-rejected";
  return "";
}
function progressPercent(status) {
  if (status === "received") return 25;
  if (status === "dispatched") return 50;
  if (status === "in-transit") return 75;
  return 100;
}
function isValidReferenceNo(value) {
  return /^[A-Za-z0-9-]{3,20}$/.test(value);
}
function generateReferenceNo() {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `LN-POST-${Date.now().toString().slice(-5)}${randomPart}`;
}
function setNewReferenceNo() {
  document.getElementById("referenceNo").value = generateReferenceNo();
}
function switchPage(pageId) {
  const pages = ["dashboardPage", "searchPage", "addPage"];
  pages.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.classList.toggle("hidden-page", id !== pageId);
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    const active = btn.dataset.page === pageId;
    btn.classList.toggle("active", active);
    btn.classList.toggle("secondary", !active);
  });
}

function renderKpis(k) {
  document.getElementById("todayIncoming").textContent = k.todayIncoming;
  document.getElementById("todayOutgoing").textContent = k.todayOutgoing;
  document.getElementById("pendingDispatch").textContent = k.pendingDispatch;
  document.getElementById("deliveredCount").textContent = k.delivered;
  document.getElementById("overdueCount").textContent = k.overdueCount;
  document.getElementById("totalCount").textContent = k.total;
}

function renderPipeline(flow) {
  document.getElementById("flowReceived").textContent = flow.received;
  document.getElementById("flowDispatched").textContent = flow.dispatched;
  document.getElementById("flowTransit").textContent = flow.inTransit;
  document.getElementById("flowDelivered").textContent = flow.delivered;
}

function renderActionCenter(items) {
  const box = document.getElementById("actionCenterList");
  box.innerHTML = items.length
    ? items.map(i => `<div class="action-item"><strong>${i.referenceNo}</strong> - ${titleCaseText(i.department)}<br><span class="muted">${i.sender} To ${i.receiver} (${formatDate(i.recordDate)})</span></div>`).join("")
    : "<div class='muted'>No overdue records.</div>";
}

function renderDepartmentBars(items) {
  const box = document.getElementById("deptBars");
  if (!items.length) { box.innerHTML = "<div class='muted'>No department data.</div>"; return; }
  const max = Math.max(...items.map(d => d.pending), 1);
  box.innerHTML = items.map(d => {
    const w = Math.round((d.pending / max) * 100);
    return `<div class="bar-row"><div class="bar-header"><span>${titleCaseText(d.department)}</span><span>${d.pending}/${d.total}</span></div><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div></div>`;
  }).join("");
}

function renderTable(records) {
  if (!records.length) {
    recordsBody.innerHTML = `<tr><td colspan="9">No records found</td></tr>`;
    return;
  }

  recordsBody.innerHTML = records.map(r => `
    <tr>
      <td>${r.referenceNo}</td>
      <td>${formatType(r.movementType, r.articleType)}</td>
      <td>${r.sender}</td>
      <td>${r.receiver}</td>
      <td>${r.department}</td>
      <td>${formatDate(r.recordDate)}</td>
      <td class="${statusClass(r.status)}">${titleCaseText(r.status)}</td>
      <td>
        <div class="progress-track compact"><div class="progress-fill" style="width:${progressPercent(r.status)}%"></div></div>
      </td>
      <td>
        <select id="status-${r._id}">
          <option value="received">Received</option>
          <option value="dispatched">Dispatched</option>
          <option value="in-transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
        <button class="small" onclick="updateRecord('${r._id}')">Save</button>
      </td>
    </tr>
  `).join("");

  records.forEach(r => { document.getElementById(`status-${r._id}`).value = r.status; });
}

async function loadAllRecords() {
  const response = await fetch(`/records/all?userId=${user.id}`);
  const data = await response.json();
  if (!response.ok) return;
  currentRecords = data;
  renderTable(data);
}

async function loadAnalytics() {
  const response = await fetch(`/records/analytics?userId=${user.id}`);
  const data = await response.json();
  if (!response.ok) return;
  renderKpis(data.kpis);
  renderPipeline(data.flow);
  renderActionCenter(data.actionCenter);
  renderDepartmentBars(data.departmentSummary);
}

async function refreshDashboard() {
  await loadAllRecords();
  await loadAnalytics();
}

async function createRecord() {
  const selectedDepartment = document.getElementById("department").value.trim();
  const selectedDate = document.getElementById("recordDate").value;
  const referenceNo = document.getElementById("referenceNo").value.trim();
  const sender = document.getElementById("sender").value.trim();
  const receiver = document.getElementById("receiver").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const remarks = document.getElementById("remarks").value.trim();
  if (!selectedDepartment || !DEPARTMENTS.includes(selectedDepartment)) {
    return showMessage("Please select a valid department.", "error");
  }
  if (!isValidReferenceNo(referenceNo)) {
    return showMessage("Reference No must be 3-20 characters (letters, numbers, hyphen).", "error");
  }
  if (sender.length < 3 || sender.length > 80) {
    return showMessage("Sender must be 3-80 characters.", "error");
  }
  if (receiver.length < 3 || receiver.length > 80) {
    return showMessage("Receiver must be 3-80 characters.", "error");
  }
  if (subject.length < 5 || subject.length > 120) {
    return showMessage("Subject must be 5-120 characters.", "error");
  }
  if (remarks.length > 300) {
    return showMessage("Remarks must be at most 300 characters.", "error");
  }
  if (!selectedDate) {
    return showMessage("Please select a date.", "error");
  }
  if (selectedDate > todayIso()) {
    return showMessage("Future dates are not allowed.", "error");
  }

  const payload = {
    userId: user.id,
    movementType: document.getElementById("movementType").value,
    articleType: document.getElementById("articleType").value,
    referenceNo,
    sender,
    receiver,
    department: selectedDepartment,
    subject,
    recordDate: selectedDate,
    status: document.getElementById("status").value,
    remarks
  };
  const response = await fetch("/records/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) return showMessage(data.message || "Failed to create record", "error");
  showMessage("Record saved", "success");
  setNewReferenceNo();
  await refreshDashboard();
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
  currentRecords = data;
  renderTable(data);
}

async function updateRecord(recordId) {
  const status = document.getElementById(`status-${recordId}`).value;
  const response = await fetch("/records/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, recordId, status }) });
  const data = await response.json();
  if (!response.ok) return alert(data.message || "Update failed");
  await refreshDashboard();
}

function demoPayload() {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return [
    { movementType: "incoming", articleType: "letter", referenceNo: "LN-POST-1001", sender: "UGC New Delhi", receiver: "Registrar LNMIIT", department: "Registrar Office", subject: "Accreditation Notice", recordDate: daysAgo(0), status: "received", remarks: "Marked urgent" },
    { movementType: "outgoing", articleType: "official-document", referenceNo: "LN-POST-1002", sender: "Accounts Section LNMIIT", receiver: "Bank of Rajasthan", department: "Accounts", subject: "Fee Reconciliation File", recordDate: daysAgo(1), status: "dispatched", remarks: "Speed post" },
    { movementType: "incoming", articleType: "parcel", referenceNo: "LN-POST-1003", sender: "TechBooks India", receiver: "Central Library LNMIIT", department: "Library", subject: "New Semester Book Shipment", recordDate: daysAgo(2), status: "in-transit", remarks: "Arrival expected tomorrow" },
    { movementType: "outgoing", articleType: "letter", referenceNo: "LN-POST-1004", sender: "Dean Academics LNMIIT", receiver: "AICTE Regional Office", department: "Dean Office", subject: "Annual Academic Compliance", recordDate: daysAgo(4), status: "received", remarks: "Pending dispatch" },
    { movementType: "incoming", articleType: "official-document", referenceNo: "LN-POST-1005", sender: "Jaipur Municipal Corporation", receiver: "Estate Office LNMIIT", department: "Estate", subject: "Property Tax Communication", recordDate: daysAgo(6), status: "delivered", remarks: "Delivered to estate team" },
    { movementType: "outgoing", articleType: "parcel", referenceNo: "LN-POST-1006", sender: "Examination Cell LNMIIT", receiver: "Confidential Printing Services", department: "Examination Cell", subject: "Question Paper Envelopes", recordDate: daysAgo(5), status: "in-transit", remarks: "Track with courier desk" }
  ];
}

async function loadDemoData() {
  const sample = demoPayload();
  let created = 0;
  for (const item of sample) {
    const r = await fetch("/records/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, ...item }) });
    if (r.ok) created += 1;
  }
  if (created === 0) showMessage("Demo records already exist.", "error");
  else showMessage(`Demo data loaded. Added ${created} records.`, "success");
  await refreshDashboard();
}

window.updateRecord = updateRecord;

document.getElementById("createBtn").addEventListener("click", createRecord);
document.getElementById("searchBtn").addEventListener("click", searchRecords);
document.getElementById("demoBtn").addEventListener("click", loadDemoData);
document.getElementById("refreshBtn").addEventListener("click", refreshDashboard);
document.getElementById("resetBtn").addEventListener("click", async () => {
  document.getElementById("fMovement").value = "all";
  document.getElementById("fArticle").value = "all";
  document.getElementById("fStatus").value = "all";
  document.getElementById("fKeyword").value = "";
  await refreshDashboard();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "/index.html";
});
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchPage(btn.dataset.page));
});

document.getElementById("recordDate").setAttribute("max", todayIso());
setNewReferenceNo();
switchPage("dashboardPage");

refreshDashboard();

