/**
 * KARAJAK AI - Production Navigation & Real Auth State
 */
function renderHeader(activePage = "") {
    const userJson = localStorage.getItem("karajak_user");
    const user = userJson ? JSON.parse(userJson) : null;

    let roleLinks = `
        <li><a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="/index.html">الرئيسية</a></li>
        <li><a class="nav-link ${activePage === 'marketplace' ? 'active' : ''}" href="/marketplace.html">سوق السيارات</a></li>
    `;

    if (user) {
        if (user.role === 'Buyer') {
            roleLinks += `
                <li><a class="nav-link ${activePage === 'buyer-dashboard' ? 'active' : ''}" href="/buyer-dashboard.html">حجوزاتي وفواتيري</a></li>
                <li><a class="nav-link ${activePage === 'messages' ? 'active' : ''}" href="/messages.html">المحادثات</a></li>
            `;
        } else if (user.role === 'Seller') {
            roleLinks += `
                <li><a class="nav-link ${activePage === 'seller-dashboard' ? 'active' : ''}" href="/seller-dashboard.html">لوحة المعرض</a></li>
                <li><a class="nav-link ${activePage === 'seller-listings' ? 'active' : ''}" href="/seller-listings.html">سياراتي</a></li>
                <li><a class="nav-link ${activePage === 'seller-add-listing' ? 'active' : ''}" href="/seller-add-listing.html">+ أضف سيارة</a></li>
                <li><a class="nav-link ${activePage === 'seller-requests' ? 'active' : ''}" href="/seller-requests.html">طلبات الحجز</a></li>
                <li><a class="nav-link ${activePage === 'seller-analytics' ? 'active' : ''}" href="/seller-analytics.html">الأرباح</a></li>
                <li><a class="nav-link ${activePage === 'messages' ? 'active' : ''}" href="/messages.html">المحادثات</a></li>
            `;
        } else if (user.role === 'Admin') {
            roleLinks += `
                <li><a class="nav-link ${activePage === 'admin-dashboard' ? 'active' : ''}" href="/admin-dashboard.html">لوحة الإدارة</a></li>
                <li><a class="nav-link ${activePage === 'admin-listings' ? 'active' : ''}" href="/admin-listings.html">تدقيق الإعلانات</a></li>
                <li><a class="nav-link ${activePage === 'admin-users' ? 'active' : ''}" href="/admin-users.html">المستخدمين</a></li>
                <li><a class="nav-link ${activePage === 'admin-transactions' ? 'active' : ''}" href="/admin-transactions.html">العمليات المالية</a></li>
                <li><a class="nav-link ${activePage === 'admin-reports' ? 'active' : ''}" href="/admin-reports.html">الشكاوى</a></li>
                <li><a class="nav-link ${activePage === 'admin-settings' ? 'active' : ''}" href="/admin-settings.html">الإعدادات</a></li>
            `;
        }
    } else {
        roleLinks += `
            <li><a class="nav-link ${activePage === 'auth-portal' ? 'active' : ''}" href="/auth-portal.html">بوابات الدخول</a></li>
        `;
    }

    let authActions = '';
    if (user) {
        authActions = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="display:flex; align-items:center; gap:8px; padding:4px 10px; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:24px;">
                    <img src="${user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                    <div style="text-align:right;">
                        <div style="font-size:0.82rem; font-weight:700; line-height:1.2;">${user.fullName}</div>
                        <span class="status-chip status-${(user.role || 'buyer').toLowerCase()}" style="padding:1px 6px; font-size:0.62rem; font-weight:700;">${user.role}</span>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="logoutUser()" style="border-color:#ef4444; color:#ef4444; padding:6px 12px; font-size:0.8rem; font-weight:700;">
                    خروج ⎋
                </button>
            </div>
        `;
    } else {
        authActions = `
            <div style="display:flex; align-items:center; gap:8px;">
                <a href="/auth-portal.html" class="btn btn-outline btn-sm" style="padding:6px 14px; font-size:0.85rem;">تسجيل الدخول</a>
                <a href="/buyer-register.html" class="btn btn-primary btn-sm" style="padding:6px 14px; font-size:0.85rem;">حساب جديد</a>
            </div>
        `;
    }

    const navbarHtml = `
    <nav class="navbar" style="border-bottom:1px solid var(--border-color); background:var(--bg-surface);">
        <div class="nav-container" style="display:flex; align-items:center; justify-content:space-between; max-width:1400px; margin:0 auto; padding:0 24px; height:68px;">
            <a class="brand-logo" href="/index.html" style="text-decoration:none; display:flex; align-items:center; gap:10px;">
                <div class="logo-badge" style="width:38px; height:38px; border-radius:8px; background:linear-gradient(135deg, #f97316, #ea580c); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.2rem;">K</div>
                <div class="brand-text">
                    <h1 style="font-size:1.3rem; font-weight:900; letter-spacing:0.5px; margin:0; line-height:1.1;">KARAJAK</h1>
                    <span style="font-size:0.68rem; color:var(--text-muted); font-weight:600; letter-spacing:1px;">AI AUTOMOTIVE PLATFORM</span>
                </div>
            </a>
            <ul class="nav-menu" style="display:flex; gap:18px; list-style:none; margin:0; padding:0; align-items:center;">
                ${roleLinks}
            </ul>
            <div class="nav-actions" style="display:flex; align-items:center; gap:12px;">
                <button class="btn btn-outline btn-sm" onclick="toggleGlobalTheme()" id="theme-btn" style="padding:5px 10px; font-size:0.85rem;" title="تغيير المظهر">
                    ☀️
                </button>
                <button class="btn btn-outline btn-sm" onclick="toggleGlobalLang()" id="lang-btn" style="padding:5px 10px; font-size:0.8rem; font-weight:600;">
                    EN
                </button>
                ${authActions}
            </div>
        </div>
    </nav>
    `;

    const placeholder = document.getElementById("header-placeholder");
    if (placeholder) placeholder.innerHTML = navbarHtml;

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
    const btn = document.getElementById("theme-btn");
    if (btn) btn.innerText = theme === "dark" ? "☀️ Light" : "🌙 Dark";

    const lang = localStorage.getItem("karajak_lang") || "ar";
    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    const langBtn = document.getElementById("lang-btn");
    if (langBtn) langBtn.innerText = lang === "ar" ? "English" : "العربية";
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
