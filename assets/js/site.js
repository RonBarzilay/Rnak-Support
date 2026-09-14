(function () {
  var buttons = document.querySelectorAll(".lang button");
  var nodes = document.querySelectorAll("[data-en][data-he]");
  var panels = document.querySelectorAll(".i18n[data-show]");

  function setLang(lang) {
    document.documentElement.lang = lang;
    document.body.dir = lang === "he" ? "rtl" : "ltr";
    var enTitle = document.body.getAttribute("data-title-en");
    var heTitle = document.body.getAttribute("data-title-he");
    if (enTitle && heTitle) {
      document.title = lang === "he" ? heTitle : enTitle;
    }
    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-lang") === lang));
    });
    nodes.forEach(function (node) {
      node.innerHTML = node.getAttribute("data-" + lang);
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-show") !== lang;
    });
    try {
      localStorage.setItem("rnak-lang", lang);
    } catch (e) {}
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  var saved = null;
  try {
    saved = localStorage.getItem("rnak-lang");
  } catch (e) {}
  setLang(saved === "he" ? "he" : "en");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      setLang(button.getAttribute("data-lang"));
    });
  });

  document.querySelectorAll(".faq-q").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".faq-item");
      var willOpen = !item.classList.contains("is-open");
      document.querySelectorAll(".faq-item").forEach(function (other) {
        other.classList.remove("is-open");
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
})();
