(function () {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  window.toggleTheme = function () {
    document.body.classList.toggle("dark");
    const mode = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", mode);

    const toggleBtn = document.getElementById("themeToggle");
    if (toggleBtn) {
      toggleBtn.textContent = mode === "dark" ? "Light Mode" : "Night Mode";
    }
  };

  window.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("themeToggle");
    if (toggleBtn) {
      const mode = document.body.classList.contains("dark") ? "dark" : "light";
      toggleBtn.textContent = mode === "dark" ? "Light Mode" : "Night Mode";
      toggleBtn.addEventListener("click", window.toggleTheme);
    }
  });
})();
