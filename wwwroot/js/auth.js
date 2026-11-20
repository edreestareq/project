/**
 * KARAJAK AI - Core Authentication, Authorization & API Communication
 * Production-ready security layer with JWT support and role-based guards.
 */

const API_BASE = '/api';

// Retrieve auth token
function getToken() {
    return localStorage.getItem('karajak_token');
}

// Retrieve current logged in user
function getUser() {
    const raw = localStorage.getItem('karajak_user');
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
