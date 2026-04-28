const user = JSON.parse(localStorage.getItem("user") || "null");

if (!user || user.role !== "student") {
  window.location.href = "/index.html";
}

const requestsBody = document.getElementById("requestsBody");
const formMessage = document.getElementById("formMessage");

if (window.flatpickr) {
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
}

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

async function loadMyRequests() {
  const response = await fetch(`/outpass/my?userId=${user.id}`);
  const data = await response.json();

  requestsBody.innerHTML = "";

  if (!data.length) {
    requestsBody.innerHTML = `<tr><td colspan="5">No requests found</td></tr>`;
    return;
  }

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(item.outTime)}</td>
      <td>${formatDate(item.returnTime)}</td>
      <td>${item.reason}</td>
      <td class="${statusClass(item.status)}">${item.status}</td>
      <td>${item.adminComment || "-"}</td>
    `;
    requestsBody.appendChild(row);
  });
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

loadMyRequests();
