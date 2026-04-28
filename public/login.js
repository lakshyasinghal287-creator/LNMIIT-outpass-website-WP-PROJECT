const messageBox = document.getElementById("message");
const loginBtn = document.getElementById("loginBtn");

function showMessage(text, type) {
  messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
}

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage("Please enter email and password", "error");
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Login failed", "error");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.role === "student") {
      window.location.href = "/student.html";
    } else {
      window.location.href = "/admin.html";
    }
  } catch (error) {
    showMessage("Server error", "error");
  }
});
