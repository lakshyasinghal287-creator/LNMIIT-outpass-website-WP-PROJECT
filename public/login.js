const messageBox = document.getElementById("message");
const loginBtn = document.getElementById("loginBtn");

function showMessage(text, type) {
  messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
}

loginBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;

  if (!name) {
    showMessage("Please enter your name", "error");
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role })
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
