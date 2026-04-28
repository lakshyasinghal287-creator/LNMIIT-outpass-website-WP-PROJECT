const messageBox = document.getElementById("signupMessage");

function showMessage(text, type) {
  messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
}

document.getElementById("signupBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const hostelRoom = document.getElementById("hostelRoom").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !hostelRoom || !phone || !password) {
    showMessage("Please fill all fields", "error");
    return;
  }

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, hostelRoom, phone, password })
  });

  const data = await response.json();

  if (!response.ok) {
    showMessage(data.message || "Signup failed", "error");
    return;
  }

  showMessage("Signup successful. Redirecting to login...", "success");
  setTimeout(() => {
    window.location.href = "/index.html";
  }, 1200);
});
