/**
 * KARAJAK AI - Navigation & Theme Management
 * Top redundant navbar completely removed per user specification.
 * Dashboards utilize dedicated, professional sidebars.
 */

function renderHeader(activePage = "") {
    const placeholder = document.getElementById("header-placeholder");
    if (placeholder) {
        placeholder.innerHTML = "";
        placeholder.remove();
    }
    document.querySelectorAll("nav.navbar, header.navbar, .navbar, .nav-container").forEach(n => n.remove());
    initTheme();
}

function logoutUser() {
    localStorage.removeItem("karajak_user");
    localStorage.removeItem("karajak_token");
    window.location.href = "/auth-portal.html";
}

function initTheme() {
    const theme = localStorage.getItem("karajak_theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);

    const lang = localStorage.getItem("karajak_lang") || "ar";
    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
}

function toggleGlobalTheme() {
    const cur = localStorage.getItem("karajak_theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    localStorage.setItem("karajak_theme", next);
    initTheme();
}

function toggleGlobalLang() {
    const cur = localStorage.getItem("karajak_lang") || "ar";
    const next = cur === "ar" ? "en" : "ar";
    localStorage.setItem("karajak_lang", next);
    initTheme();
}
