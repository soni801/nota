(function () {
  var name = location.host;
  document.title = name;
  var wordmark = document.querySelector(".wordmark");
  if (wordmark) wordmark.textContent = name;
})();
