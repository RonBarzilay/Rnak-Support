(function () {
  var lang = "en";
  try {
    var fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "he" || fromUrl === "en") {
      lang = fromUrl;
      localStorage.setItem("rnak-lang", lang);
    } else if (localStorage.getItem("rnak-lang") === "he") {
      lang = "he";
    }
  } catch (e) {}
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
})();
