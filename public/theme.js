(function () {
  const saved = localStorage.getItem("theme") || "light";
  if (saved === "dark") {
    document.body.classList.add("dark");
  }

  function updateButton() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Night Mode";
  }

  window.toggleTheme = function () {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    updateButton();
  };

  window.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", window.toggleTheme);
    updateButton();
  });
})();
