(function () {
  var buttons = document.querySelectorAll(".lang button");
  var nodes = document.querySelectorAll("[data-en][data-he]");
  var panels = document.querySelectorAll(".i18n[data-show]");

  function readLang() {
    try {
      var fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (fromUrl === "he" || fromUrl === "en") return fromUrl;
      if (localStorage.getItem("rnak-lang") === "he") return "he";
    } catch (e) {}
    return document.documentElement.lang === "he" ? "he" : "en";
  }

  function persistUrl(lang) {
    try {
      var url = new URL(window.location.href);
      if (url.searchParams.get("lang") === lang) return;
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function syncLinks(lang) {
    document.querySelectorAll("a[href]").forEach(function (anchor) {
      var raw = anchor.getAttribute("href");
      if (!raw || /^(mailto:|https?:|tel:|#)/i.test(raw) || /\.pdf($|[?#])/i.test(raw)) return;
      try {
        var url = new URL(raw, document.baseURI);
        if (url.origin !== window.location.origin) return;
        url.searchParams.set("lang", lang);
        anchor.setAttribute("href", url.pathname + url.search + url.hash);
      } catch (e) {}
    });
  }

  function setLang(lang) {
    lang = lang === "he" ? "he" : "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
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
    persistUrl(lang);
    syncLinks(lang);
    document.documentElement.setAttribute("data-i18n-ready", "1");
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  setLang(readLang());

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

  var form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) return;
      event.preventDefault();

      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var phone = form.elements.phone.value.trim();
      var message = form.elements.message.value.trim();
      var lang = document.documentElement.lang === "he" ? "he" : "en";
      var subject = lang === "he" ? "פנייה לתמיכת Rnak" : "Rnak support request";
      var body = [
        (lang === "he" ? "שם: " : "Name: ") + name,
        (lang === "he" ? "אימייל: " : "Email: ") + email,
        (lang === "he" ? "טלפון: " : "Phone: ") + phone,
        "",
        message
      ].join("\n");

      window.location.href = "mailto:rnakdesk@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

      var status = form.querySelector(".contact-status");
      if (status) {
        status.hidden = false;
        status.setAttribute("data-en", "Your email app will open. Send the message so we can reply.");
        status.setAttribute("data-he", "ייפתח חלון המייל. שלחו את ההודעה כדי שנקבל את הפנייה.");
        status.textContent = status.getAttribute("data-" + lang);
      }
    });
  }
})();
