(function () {
  var theme = "dark";
  try {
    var stored = localStorage.getItem("nota-theme");
    if (stored === "light" || stored === "dark") theme = stored;
  } catch (_err) {
    /* localStorage may be blocked */
  }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
})();
