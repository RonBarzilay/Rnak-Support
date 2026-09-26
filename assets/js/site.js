(function () {
  var buttons = document.querySelectorAll(".lang button");
  var nodes = document.querySelectorAll("[data-en][data-he]");
  var panels = document.querySelectorAll(".i18n[data-show]");
  var FIELD_ERRORS = {
    en: {
      nameRequired: "Enter your full name.",
      nameInvalid: "Use letters only.",
      emailRequired: "Enter your email.",
      emailInvalid: "Enter a valid email address.",
      phoneRequired: "Enter your phone number.",
      phoneInvalid: "Use numbers only, at least 8 digits.",
      messageRequired: "Enter a message.",
      messageShort: "Write a bit more so we can help."
    },
    he: {
      nameRequired: "נא למלא שם מלא.",
      nameInvalid: "השם יכול לכלול אותיות בלבד.",
      emailRequired: "נא למלא אימייל.",
      emailInvalid: "נא להזין כתובת אימייל תקינה.",
      phoneRequired: "נא למלא מספר טלפון.",
      phoneInvalid: "הטלפון יכול לכלול ספרות בלבד, לפחות 8 ספרות.",
      messageRequired: "נא לכתוב הודעה.",
      messageShort: "נא לכתוב עוד קצת כדי שנוכל לעזור."
    }
  };

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
    refreshFieldErrors();
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

  function currentLang() {
    return document.documentElement.lang === "he" ? "he" : "en";
  }

  function refreshFieldErrors() {
    var copy = FIELD_ERRORS[currentLang()];
    document.querySelectorAll(".field-error[data-error]").forEach(function (el) {
      var key = el.getAttribute("data-error");
      if (key && copy[key]) el.textContent = copy[key];
    });
  }

  function setFieldError(input, key) {
    var field = input.closest(".field");
    var error = document.getElementById(input.id + "-error");
    if (!field || !error) return;
    if (!key) {
      field.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      error.hidden = true;
      error.textContent = "";
      error.removeAttribute("data-error");
      return;
    }
    field.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    error.hidden = false;
    error.setAttribute("data-error", key);
    error.textContent = FIELD_ERRORS[currentLang()][key];
  }

  function letterCount(value) {
    return (value.match(/\p{L}/gu) || []).length;
  }

  function digitCount(value) {
    return (value.match(/\d/g) || []).length;
  }

  function sanitizeName(value) {
    return value.replace(/[^\p{L}\p{M}\s'\u05F3\u2019-]/gu, "").replace(/\s+/g, " ");
  }

  function sanitizeEmail(value) {
    return value.replace(/[^a-zA-Z0-9.!#$%&'*+/=?^_`{|}~@-]/g, "");
  }

  function sanitizePhone(value) {
    var plus = value.charAt(0) === "+" ? "+" : "";
    return plus + value.replace(/\D/g, "").slice(0, 15);
  }

  function validateName(value) {
    if (!value.trim()) return "nameRequired";
    if (letterCount(value) < 2) return "nameInvalid";
    return "";
  }

  function validateEmail(value) {
    if (!value.trim()) return "emailRequired";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "emailInvalid";
    return "";
  }

  function validatePhone(value) {
    if (!value.trim()) return "phoneRequired";
    if (digitCount(value) < 8) return "phoneInvalid";
    return "";
  }

  function validateMessage(value) {
    if (!value.trim()) return "messageRequired";
    if (value.trim().length < 10) return "messageShort";
    return "";
  }

  var form = document.querySelector(".contact-form");
  if (form) {
    var sanitizers = {
      name: sanitizeName,
      email: sanitizeEmail,
      phone: sanitizePhone
    };
    var validators = {
      name: validateName,
      email: validateEmail,
      phone: validatePhone,
      message: validateMessage
    };

    ["name", "email", "phone", "message"].forEach(function (key) {
      var input = form.elements[key];
      if (!input) return;
      input.addEventListener("input", function () {
        if (sanitizers[key]) {
          var next = sanitizers[key](input.value);
          if (input.value !== next) input.value = next;
        }
        if (input.getAttribute("aria-invalid") === "true") {
          setFieldError(input, validators[key](input.value));
        }
      });
      input.addEventListener("blur", function () {
        setFieldError(input, validators[key](input.value));
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstInvalid = null;
      var values = {};
      ["name", "email", "phone", "message"].forEach(function (key) {
        var input = form.elements[key];
        var error = validators[key](input.value);
        setFieldError(input, error);
        if (error && !firstInvalid) firstInvalid = input;
        values[key] = input.value.trim();
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var lang = currentLang();
      var subject = lang === "he" ? "פנייה לתמיכת Rnak" : "Rnak support request";
      var body = [
        (lang === "he" ? "שם: " : "Name: ") + values.name,
        (lang === "he" ? "אימייל: " : "Email: ") + values.email,
        (lang === "he" ? "טלפון: " : "Phone: ") + values.phone,
        "",
        values.message
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
