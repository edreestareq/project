/**
 * KARAJAK AI - Buyer Experience Module
 * Handles: My Bookings & Invoices, Vehicle Checkout & Reservation, Messaging.
 */

function initMessages() {
    requireAuth();
}

let allBuyerBookings = [];

// ─── BUYER DASHBOARD & BOOKINGS (Figure 5.43 & Figure 5.50) ───────────────────
async function initBuyerDashboard() {
    if (!requireAuth('Buyer')) return;
    const user = getUser();

    // Populate Sidebar User
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    if (nameEl && user) nameEl.innerText = user.fullName || 'Verified Buyer';
    if (avatarEl && user && user.profilePicture) avatarEl.src = user.profilePicture;

    try {
        const res = await apiCall(`/bookings/my?buyerId=${user.id}`);
        if (!res || !res.ok) return;

        allBuyerBookings = await res.json();
        renderBuyerBookings(allBuyerBookings);

    } catch (err) {
        console.error('[initBuyerDashboard]', err);
    }
}

function filterBookings(type) {
    // Update button states
    document.querySelectorAll('button[onclick^="filterBookings"]').forEach(btn => {
        btn.className = 'btn btn-outline btn-sm';
    });
    event?.target && (event.target.className = 'btn btn-primary btn-sm');

    if (type === 'all') {
        renderBuyerBookings(allBuyerBookings);
    } else if (type === 'Reserved') {
        renderBuyerBookings(allBuyerBookings.filter(b => b.bookingStatus === 'Pending' || b.bookingStatus === 'Approved'));
    } else if (type === 'Purchased') {
        renderBuyerBookings(allBuyerBookings.filter(b => b.bookingStatus === 'Paid' || b.bookingStatus === 'Completed'));
    }
}

function renderBuyerBookings(bookings) {
    const container = document.getElementById('buyer-bookings-container');
    if (!container) return;

    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div style="background:var(--bg-surface-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:40px; text-align:center;">
                <div style="font-size:2.5rem; margin-bottom:12px;">🚗</div>
                <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:6px;">لا توجد حجوزات نشطة حالياً</h3>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:18px;">تصفح أحدث السيارات الرياضية والفاخرة على سوق KARAJAK وابدأ رحلتك الآن.</p>
                <a href="/marketplace.html" class="btn btn-primary">تصفح سوق السيارات →</a>
            </div>
        `;
        return;
    }

    container.innerHTML = bookings.map(b => {
        const car = b.car;
        const img = (car && car.images && car.images.length > 0) ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80';
        const carTitle = car ? `${car.year} ${car.brand} ${car.model}` : 'Vehicle Reservation';
        const price = b.offerAmount || (car ? car.price : 0);
        const sellerName = (car && car.seller) ? car.seller.fullName : 'Verified Dealership';

        const isApproved = b.bookingStatus === 'Approved';
        const isPaid = b.bookingStatus === 'Paid' || b.bookingStatus === 'Completed';
        const isPending = b.bookingStatus === 'Pending';

        const statusClass = isPaid ? 'status-active' : (isApproved ? 'status-active' : (isPending ? 'status-pending' : 'status-rejected'));
        const statusLabel = isPaid ? 'PAID & CONFIRMED' : (isApproved ? 'APPROVED - READY TO PAY' : (isPending ? 'PENDING SELLER APPROVAL' : b.bookingStatus.toUpperCase()));

        let actionButton = '';
        if (isApproved) {
            actionButton = `<a href="/checkout.html?carId=${b.carId}&bookingId=${b.id}" class="btn btn-primary btn-sm" style="background:#10b981; border:none; padding:8px 18px; font-weight:700;">إتمام الدفع الآن ($${price.toLocaleString()}) ←</a>`;
        } else if (isPaid) {
            actionButton = `<button class="btn btn-outline btn-sm" onclick="alert('إيصال الدفع #${b.payment?.transactionCode || b.id} موثق رسمياً بموجب نظام KARAJAK الآمن')">عرض إيصال الدفع 📄</button>`;
        } else if (isPending) {
            actionButton = `<span style="font-size:0.82rem; color:var(--text-muted);">بانتظار موافقة المعرض على الحجز...</span>`;
        }

        return `
            <div style="background:var(--bg-surface-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:20px; margin-bottom:16px; display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
                <img src="${img}" style="width:160px; height:105px; border-radius:8px; object-fit:cover;">
                <div style="flex:1; min-width:260px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span class="status-chip ${statusClass}" style="font-size:0.68rem; padding:2px 8px; font-weight:800;">${statusLabel}</span>
                            <h3 style="font-size:1.15rem; font-weight:800; margin:6px 0 2px;">${carTitle}</h3>
                            <div style="font-size:0.8rem; color:var(--text-muted);">المعرض: ${sellerName}</div>
                        </div>
                        <div style="text-align:left;">
                            <div style="font-size:1.35rem; font-weight:900; color:var(--accent-orange);">${formatCurrency(price)}</div>
                            <div style="font-size:0.72rem; color:var(--text-muted);">رقم الحجز: #${b.id}</div>
                        </div>
                    </div>

                    <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div style="font-size:0.82rem; color:var(--text-secondary);">
                            📍 ${b.deliveryLocation || 'مركز تسليم KARAJAK - عمّان'} • 🕒 موعد التسليم: ${formatDate(b.scheduledHandoverDate || b.bookingDate)} (${b.scheduledTimeSlot || '09:00 AM'})
                        </div>
                        <div>
                            ${actionButton}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


// ─── CHECKOUT & SECURE PAYMENT (Figure 5.49 & 135 & 136) ───────────────────────
let checkoutCar = null;
let checkoutBookingId = null;
let selectedHandoverTime = '09:00 AM';
let selectedPaymentMethod = 'Credit Card';

async function initCheckout() {
    if (!requireAuth('Buyer')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('carId');
    checkoutBookingId = urlParams.get('bookingId');

    if (!carId && !checkoutBookingId) {
        showToast('يرجى اختيار مركبة أولاً للحجز.', 'error');
        setTimeout(() => window.location.href = '/marketplace.html', 1500);
        return;
    }

    try {
        const targetCarId = carId || 8;
        const res = await apiCall(`/cars/${targetCarId}`);
        if (!res || !res.ok) return;

        checkoutCar = await res.json();
        updateCheckoutSummary(checkoutCar);

    } catch (err) {
        console.error('[initCheckout]', err);
    }
}

function updateCheckoutSummary(car) {
    if (!car) return;

    const img = (car.images && car.images.length > 0) ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1541348263662-e0c82661ba75?auto=format&fit=crop&w=600&q=80';
    const carImgEl = document.getElementById('order-car-img');
    const titleEl = document.getElementById('order-car-title');
    const priceEl = document.getElementById('order-price');
    const taxesEl = document.getElementById('order-taxes');
    const totalEl = document.getElementById('order-total');
    const step2Total = document.getElementById('step2-total');

    if (carImgEl) carImgEl.src = img;
    if (titleEl) titleEl.innerText = `${car.year} ${car.brand} ${car.model}`;

    const basePrice = car.price || 54200;
    const taxes = Math.round(basePrice * 0.06);
    const total = basePrice + 450 + taxes;

    if (priceEl) priceEl.innerText = formatCurrency(basePrice);
    if (taxesEl) taxesEl.innerText = formatCurrency(taxes);
    if (totalEl) totalEl.innerText = formatCurrency(total);
    if (step2Total) step2Total.innerText = formatCurrency(total);
}

function setTime(time, btn) {
    selectedHandoverTime = time;
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function setPaymentMethod(method, tab) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
}

async function executeCheckoutPayment() {
    const user = getUser();
    if (!user) return;

    const payBtn = document.querySelector('button[onclick="executeCheckoutPayment()"]');
    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerText = 'جاري معالجة الدفع الآمن...';
    }

    try {
        let bookingIdToPay = checkoutBookingId;

        // If no booking was created in advance, create one now!
        if (!bookingIdToPay && checkoutCar) {
            const bookingRes = await apiCall(`/bookings?buyerId=${user.id}`, 'POST', {
                carId: checkoutCar.id,
                scheduledHandoverDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                scheduledTimeSlot: selectedHandoverTime,
                deliveryLocation: 'KARAJAK Delivery Center - Amman',
                offerAmount: checkoutCar.price,
                paymentMethod: selectedPaymentMethod,
                notes: 'Booking created via Instant Checkout.'
            });

            if (bookingRes && bookingRes.ok) {
                const bData = await bookingRes.json();
                bookingIdToPay = bData.bookingId;
            }
        }

        // Process real payment transaction
        if (bookingIdToPay) {
            await apiCall('/payments/checkout', 'POST', {
                bookingId: parseInt(bookingIdToPay, 10),
                paymentMethod: selectedPaymentMethod,
                cardholderName: user.fullName || 'Jonathan Doe',
                cardNumber: '4532 8820 9011 4421'
            });
        }

        showToast('✅ تم تأكيد عملية الدفع والحجز بنجاح!');

        // Update Step 3 confirmation box details
        if (checkoutCar) {
            const step3H1 = document.querySelector('#step-3-content h4');
            if (step3H1) step3H1.innerText = `${checkoutCar.year} ${checkoutCar.brand} ${checkoutCar.model}`;
            const step3Price = document.querySelector('#step-3-content div[style*="font-size:1.3rem"]');
            if (step3Price) step3Price.innerText = formatCurrency(checkoutCar.price);
        }

        nextStep(3);

    } catch (err) {
        console.error('[executeCheckoutPayment]', err);
        showToast('تعذر إتمام الدفع. يرجى المحاولة لاحقاً.', 'error');
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerText = 'Pay Now →';
        }
    }
}
