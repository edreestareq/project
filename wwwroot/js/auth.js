/**
 * KARAJAK AI - Core Authentication, Authorization & API Communication
 * Production-ready security layer with JWT support and role-based guards.
 */

const API_BASE = '/api';

// Retrieve auth token (isolated per browser tab via sessionStorage)
function getToken() {
    return sessionStorage.getItem('karajak_token');
}

// Retrieve current logged in user (isolated per browser tab via sessionStorage)
function getUser() {
    const raw = sessionStorage.getItem('karajak_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

// Route guard - Enforces login & optional role check
function requireAuth(allowedRole = null) {
    const user = getUser();
    const token = getToken();

    if (!user || !token) {
        window.location.href = '/auth-portal.html';
        return false;
    }

    if (allowedRole) {
        const userRole = (user.role || '').toLowerCase();
        const required = allowedRole.toLowerCase();

        if (userRole !== required) {
            // Redirect to appropriate dashboard based on actual role
            if (userRole === 'admin') {
                window.location.href = '/admin-dashboard.html';
            } else if (userRole === 'seller') {
                window.location.href = '/seller-dashboard.html';
            } else {
                window.location.href = '/buyer-dashboard.html';
            }
            return false;
        }
    }

    return true;
}

// Centralized API caller with automatic JWT header & error interceptor
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method: method,
        headers: headers
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        const response = await fetch(url, options);

        if (response.status === 401) {
            console.warn('[apiCall] 401 Unauthorized - Redirecting to auth portal.');
            logout();
            return null;
        }

        return response;
    } catch (error) {
        console.error(`[apiCall] Error requesting ${endpoint}:`, error);
        showToast('تعذر الاتصال بالخادم. يرجى التأكد من تشغيل السيرفر.', 'error');
        return null;
    }
}

// User logout
function logout() {
    sessionStorage.removeItem('karajak_token');
    sessionStorage.removeItem('karajak_user');
    localStorage.removeItem('karajak_token');
    localStorage.removeItem('karajak_user');
    window.location.href = '/auth-portal.html';
}

// Global Toast Notification
function showToast(message, type = 'success') {
    const existing = document.getElementById('karajak-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'karajak-toast';
    const bgColor = type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#10b981');

    toast.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        background: ${bgColor};
        color: #ffffff;
        padding: 14px 24px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.92rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        z-index: 100000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        direction: rtl;
    `;

    toast.innerHTML = `<span>${type === 'error' ? '✕' : '✓'}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// Helpers
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('ar-JO', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateString;
    }
}

const NO_CAR_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">' +
    '<rect width="600" height="380" fill="#111827"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="22">لا توجد صورة</text>' +
    '</svg>'
);

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function initTheme() {
    const theme = localStorage.getItem('karajak_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const lang = localStorage.getItem('karajak_lang') || 'ar';
    document.documentElement.setAttribute('lang', lang);
    if (document.body) document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}

function renderHeader() {
    initTheme();
}

function logoutUser() {
    logout();
}

async function reportTarget(targetType, targetId) {
    const user = getUser();
    if (!user) {
        window.location.href = '/auth-portal.html';
        return;
    }
    const reason = prompt('يرجى كتابة سبب البلاغ ليتم مراجعته من الإدارة:');
    if (!reason || !reason.trim()) return;

    try {
        const res = await apiCall(`/reports?reporterId=${user.id}`, 'POST', {
            targetType: targetType,
            targetId: targetId,
            reason: reason.trim(),
            priority: 'High Priority'
        });
        const data = res ? await res.json().catch(() => ({})) : {};
        if (res && res.ok) {
            showToast(data.message || '✅ تم إرسال البلاغ للإدارة بنجاح.');
        } else {
            showToast(data.message || 'تعذر إرسال البلاغ.', 'error');
        }
    } catch (err) {
        console.error('[reportTarget]', err);
        showToast('حدث خطأ أثناء إرسال البلاغ.', 'error');
    }
}

function initPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.dataset.pwToggleInit) return;
        input.dataset.pwToggleInit = '1';

        const wrap = document.createElement('div');
        wrap.className = 'password-field-wrap';
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'password-toggle-btn';
        btn.title = 'إظهار / إخفاء كلمة المرور';
        btn.setAttribute('aria-label', 'إظهار كلمة المرور');
        btn.setAttribute('aria-pressed', 'false');
        btn.innerText = '👁️';

        btn.onclick = () => {
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.innerText = isHidden ? '🙈' : '👁️';
            btn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
            btn.setAttribute('aria-label', isHidden ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
        };

        wrap.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', initPasswordToggles);

// ─── Collapsible sidebar (admin / seller / buyer dashboards) ───────────────────
const SIDEBAR_STATE_KEY = 'karajak_sidebar_collapsed';

function initSidebarToggle() {
    const layout = document.querySelector('.admin-layout, .dashboard-layout');
    const aside = layout ? layout.querySelector('aside') : null;
    if (!layout || !aside || layout.dataset.sidebarInit) return;
    layout.dataset.sidebarInit = '1';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sidebar-toggle-btn';
    closeBtn.title = 'إخفاء القائمة';
    closeBtn.setAttribute('aria-label', 'إخفاء القائمة الجانبية');
    closeBtn.innerText = '✕';
    aside.insertBefore(closeBtn, aside.firstChild);

    const reopenBar = document.createElement('div');
    reopenBar.className = 'sidebar-reopen-bar';
    reopenBar.style.display = 'none';
    reopenBar.innerHTML = '<button type="button" class="btn btn-outline btn-sm" aria-label="إظهار القائمة الجانبية">☰ القائمة</button>';
    layout.parentNode.insertBefore(reopenBar, layout);
    const openBtn = reopenBar.querySelector('button');

    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    const isMobile = () => window.innerWidth <= 900;

    const apply = (collapsed, persist) => {
        layout.classList.toggle('sidebar-collapsed', collapsed);
        reopenBar.style.display = collapsed ? 'block' : 'none';
        backdrop.classList.toggle('show', !collapsed && isMobile());
        openBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (persist) localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? '1' : '0');
    };

    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    const startCollapsed = saved === null ? isMobile() : saved === '1';
    apply(startCollapsed, false);

    closeBtn.onclick = () => apply(true, true);
    openBtn.onclick = () => apply(false, true);

    // Clicking anywhere outside the open sidebar closes it.
    // On desktop only blank areas close it, so normal buttons/links keep working untouched.
    document.addEventListener('click', e => {
        if (layout.classList.contains('sidebar-collapsed')) return;
        const t = e.target;
        if (aside.contains(t) || reopenBar.contains(t) || t.closest('.review-overlay')) return;
        if (!isMobile() && t.closest('a, button, input, select, textarea, label, [onclick]')) return;
        apply(true, true);
    });

    window.addEventListener('resize', () => {
        backdrop.classList.toggle('show', !layout.classList.contains('sidebar-collapsed') && isMobile());
    });
}

document.addEventListener('DOMContentLoaded', initSidebarToggle);
