/**
 * KARAJAK AI - Seller & Dealership Hub Module
 * Handles: Inventory Management, Add Listing, Booking Requests (Approve / Decline), Financial Analytics.
 * Features: Instant live UI removal and visual animation upon action execution.
 */

// ─── SELLER DASHBOARD ───────────────────────────────────────────────────────────
async function initSellerDashboard() {
    if (!requireAuth('Seller')) return;
    const user = getUser();

    // Populate Sidebar User Capsule
    const nameEl = document.getElementById('seller-name');
    const avatarEl = document.getElementById('seller-avatar');
    if (nameEl && user) nameEl.innerText = user.fullName || 'Verified Dealer';
    if (avatarEl && user && user.profilePicture) avatarEl.src = user.profilePicture;

    try {
        const [carsRes, bookingsRes] = await Promise.all([
            apiCall(`/cars/my-listings?sellerId=${user.id}`),
            apiCall(`/bookings/seller?sellerId=${user.id}`)
        ]);

        const cars = (carsRes && carsRes.ok) ? await carsRes.json() : [];
        const bookings = (bookingsRes && bookingsRes.ok) ? await bookingsRes.json() : [];

        // Update KPI Cards
        const statCards = document.querySelectorAll('.stats-grid .stat-value');
        if (statCards.length >= 4) {
            statCards[0].innerText = cars.length.toLocaleString();
            statCards[1].innerText = cars.length > 0 ? (cars.length * 15).toLocaleString() : '0';
            statCards[2].innerText = bookings.filter(b => b.bookingStatus === 'Pending' || b.bookingStatus === 'Approved').length.toLocaleString();
            
            const totalRevenue = bookings
                .filter(b => b.bookingStatus === 'Paid' || b.bookingStatus === 'Completed')
                .reduce((sum, b) => sum + (b.offerAmount || 0), 0);
            statCards[3].innerText = formatCurrency(totalRevenue);
        }

        // Render Recent Inquiries
        renderSellerDashboardInquiries(bookings.slice(0, 5));

    } catch (err) {
        console.error('[initSellerDashboard]', err);
    }
}

function renderSellerDashboardInquiries(bookings) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">لا توجد استفسارات أو طلبات حجز حالياً.</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const buyerName = b.buyer ? b.buyer.fullName : 'Verified Client';
        const carTitle = b.car ? `${b.car.year} ${b.car.brand} ${b.car.model}` : 'Vehicle';
        const note = b.notes || 'Interested in this vehicle and scheduling a private viewing.';
        const statusClass = b.bookingStatus === 'Approved' ? 'status-active' : (b.bookingStatus === 'Pending' ? 'status-pending' : 'status-rejected');

        return `
            <tr>
                <td><strong>${buyerName}</strong></td>
                <td style="color:var(--accent-orange); font-weight:600;">${carTitle}</td>
                <td style="color:var(--text-secondary); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${note}</td>
                <td style="font-size:0.8rem; color:var(--text-muted);">${formatDate(b.bookingDate)}</td>
                <td><span class="status-chip ${statusClass}">${b.bookingStatus}</span></td>
            </tr>
        `;
    }).join('');
}


// ─── SELLER LISTINGS MANAGEMENT (Figure 5.48) ──────────────────────────────────
async function loadSellerListings() {
    if (!requireAuth('Seller')) return;
    const user = getUser();

    try {
        const res = await apiCall(`/cars/my-listings?sellerId=${user.id}`);
        if (!res || !res.ok) return;

        const cars = await res.json();
        renderSellerListingsTable(cars);

        // Update KPI Pills
        const totalValue = cars.reduce((sum, c) => sum + (c.price || 0), 0);
        const activeAds = cars.filter(c => c.status === 'Available').length;

        const kpis = document.querySelectorAll('.stat-card .stat-value');
        if (kpis.length >= 2) {
            kpis[0].innerText = formatCurrency(totalValue);
            kpis[1].innerText = `${activeAds} إعلانات نشطة`;
        }

    } catch (err) {
        console.error('[loadSellerListings]', err);
    }
}

function renderSellerListingsTable(cars) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;

    if (!cars || cars.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">لم تقم بإضافة سيارات بعد. اضغط على "+ أضف سيارة جديدة" للبدء.</td></tr>';
        return;
    }

    tbody.innerHTML = cars.map(car => {
        const img = (car.images && car.images.length > 0) ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=300&q=80';
        const isAvailable = car.status === 'Available';
        const isPending = car.status === 'Pending';
        const statusClass = isAvailable ? 'status-active' : (isPending ? 'status-pending' : 'status-rejected');
        const statusText = isAvailable ? 'ACTIVE' : (isPending ? 'PENDING AUDIT' : car.status.toUpperCase());

        return `
            <tr id="seller-car-row-${car.id}">
                <td><img src="${img}" style="width:75px; height:50px; border-radius:6px; object-fit:cover;"></td>
                <td>
                    <strong>${car.year} ${car.brand} ${car.model}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${car.mileage.toLocaleString()} mi • ${car.fuelType} • ${car.transmission}</div>
                </td>
                <td style="font-weight:700; color:var(--accent-orange); font-size:1.05rem;">${formatCurrency(car.price)}</td>
                <td><span class="status-chip ${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <a href="/car-details.html?id=${car.id}" class="btn btn-outline btn-sm" target="_blank">معاينة</a>
                        <button class="btn btn-danger btn-sm" onclick="deleteListing(${car.id})">حذف</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// REAL DELETE WITH INSTANT VISUAL REMOVAL FROM SCREEN
async function deleteListing(carId) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً من المنصة؟')) return;

    // 1. Instant smooth animation & removal from table
    const row = document.getElementById(`seller-car-row-${carId}`);
    if (row) {
        row.style.transition = 'all 0.35s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(40px)';
        setTimeout(() => row.remove(), 350);
    }

    try {
        const res = await apiCall(`/cars/${carId}`, 'DELETE');
        if (res && res.ok) {
            showToast('✅ تم حذف الإعلان وإزالته من القائمة بنجاح.');
        } else {
            showToast('تعذر حذف الإعلان.', 'error');
            loadSellerListings();
        }
    } catch (err) {
        console.error('[deleteListing]', err);
    }
}


// ─── ADD VEHICLE LISTING (Figure 5.45) ─────────────────────────────────────────
function initAddListing() {
    if (!requireAuth('Seller')) return;

    const form = document.querySelector('form');
    if (!form) return;

    form.onsubmit = async function(e) {
        e.preventDefault();
        const user = getUser();
        if (!user) return;

        const make = document.getElementById('make')?.value || 'Porsche';
        const model = document.getElementById('model')?.value || '';
        const year = parseInt(document.getElementById('year')?.value || '2024', 10);
        const color = document.getElementById('color')?.value || 'Black';
        const price = parseFloat(document.getElementById('price')?.value || '0');
        const mileage = parseInt(document.getElementById('mileage')?.value || '0', 10);

        if (!model.trim() || price <= 0) {
            showToast('يرجى ملء جميع الحقول المطلوبة بالشكل الصحيح.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'جاري إرسال الإعلان...';
        }

        try {
            const res = await apiCall(`/cars?sellerId=${user.id}`, 'POST', {
                brand: make,
                model: model.trim(),
                year: year,
                price: price,
                mileage: mileage,
                color: color,
                fuelType: 'Petrol',
                transmission: 'Automatic',
                location: 'Amman, Jordan',
                description: `${year} ${make} ${model.trim()} in excellent condition with full service history.`
            });

            if (!res || !res.ok) {
                showToast('حدث خطأ أثناء إضافة السيارة.', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'متابعة إلى الصور ←';
                }
                return;
            }

            showToast('✅ تم إضافة الإعلان بنجاح وتم إرساله إلى تدقيق الإدارة!');
            setTimeout(() => {
                window.location.href = '/seller-listings.html';
            }, 1200);

        } catch (err) {
            console.error('[initAddListing]', err);
            showToast('تعذر الاتصال بالسيرفر.', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'متابعة إلى الصور ←';
            }
        }
    };
}


// ─── BOOKING REQUESTS (Figure 5.52) ───────────────────────────────────────────
async function loadSellerRequests() {
    if (!requireAuth('Seller')) return;
    const user = getUser();

    try {
        const res = await apiCall(`/bookings/seller?sellerId=${user.id}`);
        if (!res || !res.ok) return;

        const allRequests = await res.json();
        // Filter: Show Pending requests requiring action first
        const pendingRequests = allRequests.filter(r => r.bookingStatus === 'Pending');
        renderSellerRequestsList(pendingRequests);

        // Update count header
        const subheader = document.querySelector('main p');
        if (subheader) {
            subheader.innerText = `لديك ${pendingRequests.length} طلبات حجز جديدة بانتظار موافقتك.`;
        }

    } catch (err) {
        console.error('[loadSellerRequests]', err);
    }
}

function renderSellerRequestsList(requests) {
    const container = document.querySelector('div[style*="grid-template-columns: 2fr 1fr"] > div:first-child');
    if (!container) return;

    if (!requests || requests.length === 0) {
        container.innerHTML = '<div style="background:var(--bg-surface-card); padding:40px; border-radius:12px; text-align:center; color:var(--text-muted); font-size:1.1rem;">✅ تم الرد والموافقة على جميع طلبات الحجز! لا توجد طلبات معلقة حالياً.</div>';
        return;
    }

    container.innerHTML = requests.map(b => {
        const buyerName = b.buyer ? b.buyer.fullName : 'Verified Client';
        const carTitle = b.car ? `${b.car.year} ${b.car.brand} ${b.car.model}` : 'Vehicle';
        const buyerImg = (b.buyer && b.buyer.profilePicture) ? b.buyer.profilePicture : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80';
        const amount = b.offerAmount || (b.car ? b.car.price : 0);

        return `
            <div id="seller-booking-card-${b.id}" style="background:var(--bg-surface-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:24px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; gap:14px; align-items:center;">
                        <img src="${buyerImg}" style="width:52px; height:52px; border-radius:50%; object-fit:cover;">
                        <div>
                            <h4 style="font-weight:800; font-size:1.05rem; margin:0;">${buyerName}</h4>
                            <span class="status-chip status-active" style="padding:1px 8px; font-size:0.7rem; margin-top:2px;">هوية موثقة</span>
                        </div>
                    </div>
                    <div style="text-align:left;">
                        <div style="font-size:1.4rem; font-weight:900; color:var(--accent-orange);">${formatCurrency(amount)}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${formatDate(b.bookingDate)}</div>
                    </div>
                </div>

                <div style="margin:16px 0;">
                    <strong style="color:var(--text-primary); font-size:1.05rem;">${carTitle}</strong>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:6px; background:rgba(0,0,0,0.25); padding:12px; border-radius:var(--radius-sm); line-height:1.5;">
                        "${b.notes || 'أنا مهتم جداً بهذه السيارة ومستعد لدفع العربون وتحديد موعد الاستلام والفحص فور تأكيد موافقتكم.'}"
                    </p>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:0.8rem; color:var(--text-muted);">
                        📅 موعد الاستلام المقترح: ${formatDate(b.scheduledHandoverDate || b.bookingDate)} • 🕒 ${b.scheduledTimeSlot || '09:00 AM'}
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-secondary btn-sm" style="background:#ef4444; color:white; border:none;" onclick="updateBookingStatus(${b.id}, 'Declined')">رفض ✕</button>
                        <button class="btn btn-primary btn-sm" style="background:#10b981; border:none;" onclick="updateBookingStatus(${b.id}, 'Approved')">موافق على الحجز ✓</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// REAL APPROVAL / DECLINE FOR BOOKING REQUESTS WITH INSTANT VISUAL REMOVAL
async function updateBookingStatus(bookingId, status) {
    // 1. Instant smooth animation & removal from screen
    const card = document.getElementById(`seller-booking-card-${bookingId}`);
    if (card) {
        card.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.85) translateY(-25px)';
        setTimeout(() => {
            card.remove();
            const remaining = document.querySelectorAll('[id^="seller-booking-card-"]');
            if (remaining.length === 0) {
                const container = document.querySelector('div[style*="grid-template-columns: 2fr 1fr"] > div:first-child');
                if (container) {
                    container.innerHTML = '<div style="background:var(--bg-surface-card); padding:40px; border-radius:12px; text-align:center; color:var(--text-muted); font-size:1.1rem;">✅ تم الرد والموافقة على جميع طلبات الحجز! لا توجد طلبات معلقة حالياً.</div>';
                }
            }
        }, 350);
    }

    // Decrement subheader counter
    const subheader = document.querySelector('main p');
    if (subheader) {
        const currentCount = parseInt(subheader.innerText.replace(/\D/g, '') || '1', 10);
        const newCount = Math.max(0, currentCount - 1);
        subheader.innerText = `لديك ${newCount} طلبات حجز جديدة بانتظار موافقتك.`;
    }

    // 2. Real Backend API Call
    try {
        const res = await apiCall(`/bookings/${bookingId}/status`, 'PATCH', {
            status: status,
            reason: status === 'Declined' ? 'المعرض غير متاح حالياً' : null
        });

        if (!res || !res.ok) {
            showToast('حدث خطأ أثناء تحديث حالة الطلب.', 'error');
            return;
        }

        if (status === 'Approved') {
            showToast('✅ تمت الموافقة على طلب الحجز وحذفه من قائمة الانتظار!');
        } else {
            showToast('تم رفض طلب الحجز وإزالته من القائمة.', 'warning');
        }

    } catch (err) {
        console.error('[updateBookingStatus]', err);
    }
}


// ─── SELLER ANALYTICS (Figure 5.47) ───────────────────────────────────────────
async function loadSellerAnalytics() {
    if (!requireAuth('Seller')) return;
    const user = getUser();

    try {
        const res = await apiCall(`/bookings/seller?sellerId=${user.id}`);
        if (!res || !res.ok) return;

        const bookings = await res.json();
        const completed = bookings.filter(b => b.bookingStatus === 'Paid' || b.bookingStatus === 'Completed');
        const totalEarnings = completed.reduce((sum, b) => sum + (b.offerAmount || 0), 0);

        const statVals = document.querySelectorAll('.stat-card .stat-value');
        if (statVals.length >= 3) {
            statVals[0].innerText = formatCurrency(totalEarnings);
            statVals[1].innerText = `${completed.length} مركبة`;
            statVals[2].innerText = formatCurrency(completed.length > 0 ? (totalEarnings / completed.length) : 0);
        }

        const tbody = document.querySelector('.data-table tbody');
        if (tbody) {
            if (completed.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">لا توجد مبيعات مكتملة بعد. ستظهر الصفقات المكتملة هنا فور إتمام الدفع.</td></tr>';
            } else {
                tbody.innerHTML = completed.map(b => {
                    const carTitle = b.car ? `${b.car.year} ${b.car.brand} ${b.car.model}` : 'مركبة';
                    const buyerName = b.buyer ? b.buyer.fullName : 'عميل معتمد';
                    const dateStr = formatDate(b.createdAt);
                    return `
                        <tr>
                            <td>${dateStr}</td>
                            <td><strong>${carTitle}</strong></td>
                            <td>${buyerName}</td>
                            <td style="font-weight:700; color:var(--accent-orange);">${formatCurrency(b.offerAmount || 0)}</td>
                            <td><span class="status-chip status-active">مكتمل</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }

    } catch (err) {
        console.error('[loadSellerAnalytics]', err);
    }
}
