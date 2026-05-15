
let currentLang = "fr";

const toggle = document.getElementById("lang-toggle");

if(toggle){
  toggle.addEventListener("click", () => {
    currentLang = currentLang === "fr" ? "ar" : "fr";

    document.getElementById("hero-title").innerText =
      translations[currentLang].heroTitle;

    document.getElementById("hero-text").innerText =
      translations[currentLang].heroText;

    document.body.dir = currentLang === "ar" ? "rtl" : "ltr";
  });
}
