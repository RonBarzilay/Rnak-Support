(function () {
  "use strict";

  var buttons = document.querySelectorAll(".lang button");
  var nodes = document.querySelectorAll("[data-en][data-he]");
  var panels = document.querySelectorAll(".i18n[data-show]");

  var FORM_COPY = {
    en: {
      nameRequired: "Enter your full name.",
      nameInvalid: "Enter at least 2 letters. Letters, spaces, hyphens and apostrophes only.",
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter a valid email address, for example name@example.com.",
      phoneRequired: "Enter your phone number.",
      phoneInvalid: "Enter a valid phone number, for example 0501234567 or +972501234567.",
      messageRequired: "Enter a message.",
      messageShort: "Enter at least 10 characters so we can help.",
      sending: "Sending…",
      sent: "Thanks! Your message was sent. We will get back to you by email.",
      failed: "We could not send your message. Please try again, or email rnakdesk@gmail.com.",
      offline: "You appear to be offline. Check your connection and try again."
    },
    he: {
      nameRequired: "נא למלא שם מלא.",
      nameInvalid: "נא להזין לפחות 2 אותיות. אותיות, רווחים, מקפים וגרשים בלבד.",
      emailRequired: "נא למלא כתובת אימייל.",
      emailInvalid: "נא להזין כתובת אימייל תקינה, לדוגמה \u2066name@example.com\u2069.",
      phoneRequired: "נא למלא מספר טלפון.",
      phoneInvalid: "נא להזין מספר טלפון תקין, לדוגמה \u20660501234567\u2069 או \u2066+972501234567\u2069.",
      messageRequired: "נא לכתוב הודעה.",
      messageShort: "נא לכתוב לפחות 10 תווים כדי שנוכל לעזור.",
      sending: "שולח…",
      sent: "תודה! ההודעה נשלחה. נחזור אליכם במייל.",
      failed: "לא הצלחנו לשלוח את ההודעה. נסו שוב, או כתבו אל \u2066rnakdesk@gmail.com\u2069.",
      offline: "נראה שאין חיבור לאינטרנט. בדקו את החיבור ונסו שוב."
    }
  };

  function currentLang() {
    return document.documentElement.lang === "he" ? "he" : "en";
  }

  function t(key) {
    return FORM_COPY[currentLang()][key] || FORM_COPY.en[key] || "";
  }

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

  function refreshFormCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-copy"));
    });
    document.querySelectorAll("[data-label-en][data-label-he]").forEach(function (el) {
      if (el.getAttribute("aria-busy") === "true") {
        el.textContent = t("sending");
      } else {
        el.textContent = el.getAttribute("data-label-" + currentLang());
      }
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
    refreshFormCopy();
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
  if (!form) return;

  var NAME_MAX = 60;
  var MESSAGE_MIN = 10;
  var MESSAGE_MAX = 1000;
  var LOCAL_PHONE_MAX = 10;
  var INTL_PHONE_MAX = 12;
  var SUBMIT_TIMEOUT_MS = 15000;

  var EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  var LOCAL_PHONE_PATTERN = /^0\d{8,9}$/;
  var INTL_PHONE_PATTERN = /^\+[1-9]\d{7,11}$/;

  function sanitizeName(value) {
    return value
      .replace(/[^\p{L}\p{M} '\u05F3\u2019-]/gu, "")
      .replace(/^[ '\u05F3\u2019-]+/u, "")
      .replace(/ {2,}/g, " ")
      .replace(/([-'\u05F3\u2019])[-'\u05F3\u2019]+/gu, "$1")
      .slice(0, NAME_MAX);
  }

  function sanitizeEmail(value) {
    var cleaned = value.replace(/[^A-Za-z0-9._%+@-]/g, "");
    var at = cleaned.indexOf("@");
    if (at !== -1) {
      cleaned = cleaned.slice(0, at + 1) + cleaned.slice(at + 1).replace(/@/g, "").replace(/[_%+]/g, "");
    }
    return cleaned.replace(/\.{2,}/g, ".").replace(/^\./, "").replace("@.", "@").slice(0, 254);
  }

  function sanitizePhone(value) {
    var hasPlus = value.trim().charAt(0) === "+";
    var digits = value.replace(/\D/g, "");
    if (hasPlus) return "+" + digits.slice(0, INTL_PHONE_MAX);
    return digits.slice(0, LOCAL_PHONE_MAX);
  }

  function sanitizeMessage(value) {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, MESSAGE_MAX);
  }

  function validateName(value) {
    var trimmed = value.trim();
    if (!trimmed) return "nameRequired";
    if ((trimmed.match(/\p{L}/gu) || []).length < 2) return "nameInvalid";
    if (!/^[\p{L}\p{M}]([\p{L}\p{M} '\u05F3\u2019-]*[\p{L}\p{M}'\u05F3\u2019])?$/u.test(trimmed)) return "nameInvalid";
    return "";
  }

  function validateEmail(value) {
    var trimmed = value.trim();
    if (!trimmed) return "emailRequired";
    var local = trimmed.split("@")[0];
    if (!EMAIL_PATTERN.test(trimmed) || local.length > 64 || /^\.|\.$/.test(local) || /\.\./.test(trimmed)) {
      return "emailInvalid";
    }
    return "";
  }

  function validatePhone(value) {
    var trimmed = value.trim();
    if (!trimmed) return "phoneRequired";
    if (!LOCAL_PHONE_PATTERN.test(trimmed) && !INTL_PHONE_PATTERN.test(trimmed)) return "phoneInvalid";
    return "";
  }

  function validateMessage(value) {
    var trimmed = value.trim();
    if (!trimmed) return "messageRequired";
    if (trimmed.length < MESSAGE_MIN) return "messageShort";
    return "";
  }

  var FIELDS = {
    name: { sanitize: sanitizeName, validate: validateName, allowed: /^[\p{L}\p{M} '\u05F3\u2019-]$/u },
    email: { sanitize: sanitizeEmail, validate: validateEmail, allowed: /^[A-Za-z0-9._%+@-]$/ },
    phone: { sanitize: sanitizePhone, validate: validatePhone, allowed: /^[0-9+]$/ },
    message: { sanitize: sanitizeMessage, validate: validateMessage }
  };

  var FIELD_ORDER = ["name", "email", "phone", "message"];
  var submitButton = form.querySelector('button[type="submit"]');
  var status = form.querySelector(".contact-status");
  var counter = document.getElementById("contact-message-count");
  var endpoint = form.getAttribute("data-endpoint");

  form.noValidate = true;

  function setFieldError(input, key) {
    var field = input.closest(".field");
    var error = document.getElementById(input.id + "-error");
    if (!field || !error) return;
    field.classList.toggle("is-invalid", Boolean(key));
    if (key) {
      input.setAttribute("aria-invalid", "true");
      error.setAttribute("data-copy", key);
      error.textContent = t(key);
      error.hidden = false;
    } else {
      input.removeAttribute("aria-invalid");
      error.removeAttribute("data-copy");
      error.textContent = "";
      error.hidden = true;
    }
  }

  function setStatus(key, isError) {
    if (!status) return;
    if (!key) {
      status.hidden = true;
      status.textContent = "";
      status.removeAttribute("data-copy");
      status.classList.remove("is-error");
      return;
    }
    status.setAttribute("data-copy", key);
    status.textContent = t(key);
    status.classList.toggle("is-error", Boolean(isError));
    status.hidden = false;
  }

  function setBusy(busy) {
    if (!submitButton) return;
    submitButton.disabled = busy;
    if (busy) {
      submitButton.setAttribute("aria-busy", "true");
    } else {
      submitButton.removeAttribute("aria-busy");
    }
    refreshFormCopy();
  }

  function updateCounter() {
    if (!counter) return;
    var length = form.elements.message.value.length;
    counter.textContent = length + " / " + MESSAGE_MAX;
    counter.classList.toggle("is-near-limit", length >= MESSAGE_MAX * 0.9);
  }

  function applySanitizer(input, rules) {
    var value = input.value;
    var next = rules.sanitize(value);
    if (next === value) return;
    var caret = null;
    try {
      caret = input.selectionStart;
    } catch (e) {}
    input.value = next;
    if (caret === null) return;
    var position = Math.min(rules.sanitize(value.slice(0, caret)).length, next.length);
    try {
      input.setSelectionRange(position, position);
    } catch (e) {}
  }

  FIELD_ORDER.forEach(function (key) {
    var input = form.elements[key];
    var rules = FIELDS[key];
    if (!input || !rules) return;

    input.addEventListener("beforeinput", function (event) {
      if (!rules.allowed || event.isComposing) return;
      if (event.inputType !== "insertText" || typeof event.data !== "string") return;
      var chars = Array.from(event.data);
      if (!chars.every(function (char) { return rules.allowed.test(char); })) {
        event.preventDefault();
      }
    });

    input.addEventListener("input", function (event) {
      if (event.isComposing) return;
      applySanitizer(input, rules);
      if (key === "message") updateCounter();
      if (input.getAttribute("aria-invalid") === "true") {
        setFieldError(input, rules.validate(input.value));
      }
      setStatus(null);
    });

    input.addEventListener("compositionend", function () {
      applySanitizer(input, rules);
      if (key === "message") updateCounter();
    });

    input.addEventListener("blur", function () {
      if (key !== "message" && input.value !== input.value.trim()) {
        input.value = input.value.trim();
      }
      if (input.value) setFieldError(input, rules.validate(input.value));
    });
  });

  updateCounter();

  function collectValues() {
    var values = {};
    var firstInvalid = null;
    FIELD_ORDER.forEach(function (key) {
      var input = form.elements[key];
      var rules = FIELDS[key];
      input.value = rules.sanitize(input.value);
      if (key !== "message") input.value = input.value.trim();
      var error = rules.validate(input.value);
      setFieldError(input, error);
      if (error && !firstInvalid) firstInvalid = input;
      values[key] = input.value.trim();
    });
    return { values: values, firstInvalid: firstInvalid };
  }

  function postForm(payload) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, SUBMIT_TIMEOUT_MS) : null;
    return fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok || String(data.success) !== "true") {
            throw new Error(data.message || "Request failed with status " + response.status);
          }
          return data;
        });
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (submitButton && submitButton.disabled) return;
    setStatus(null);

    var result = collectValues();
    updateCounter();
    if (result.firstInvalid) {
      result.firstInvalid.focus();
      return;
    }

    if (form.elements._honey && form.elements._honey.value) {
      form.reset();
      updateCounter();
      setStatus("sent");
      return;
    }

    if (!endpoint) {
      setStatus("failed", true);
      return;
    }

    if (navigator.onLine === false) {
      setStatus("offline", true);
      return;
    }

    var values = result.values;
    var payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      message: values.message,
      language: currentLang(),
      page: window.location.href,
      _replyto: values.email,
      _subject: "Rnak support request from " + values.name,
      _template: "table",
      _captcha: "false"
    };

    setBusy(true);
    postForm(payload)
      .then(function () {
        form.reset();
        FIELD_ORDER.forEach(function (key) {
          setFieldError(form.elements[key], null);
        });
        updateCounter();
        setStatus("sent");
      })
      .catch(function (error) {
        console.error("Contact form submission failed:", error);
        setStatus(navigator.onLine === false ? "offline" : "failed", true);
      })
      .finally(function () {
        setBusy(false);
      });
  });
})();
