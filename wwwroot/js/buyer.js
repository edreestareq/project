/**
 * KARAJAK AI - Buyer Experience Module
 * Handles: My Bookings & Invoices, Vehicle Checkout & Reservation, Messaging.
 */

// ─── REAL-TIME BUYER-SELLER MESSAGING ──────────────────────────────────────────
let chatConversations = [];
let activeOtherUserId = null;
let activeCarId = null;
let chatPollTimer = null;

function escChatHtml(v) {
    const d = document.createElement('div');
    d.textContent = v == null ? '' : String(v);
    return d.innerHTML;
}

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

async function initMessages() {
    if (!requireAuth()) return;
    const user = getUser();
    if (!user) return;

    const role = (user.role || '').toLowerCase();
    if (role === 'admin') {
        showToast('المراسلة المباشرة متاحة لحسابات المشترين والبائعين فقط.', 'warning');
        window.location.href = '/admin-dashboard.html';
        return;
    }

    const backLink = document.getElementById('chat-back-dashboard');
    if (backLink) {
        backLink.href = role === 'seller' ? '/seller-dashboard.html' : '/buyer-dashboard.html';
        backLink.innerText = role === 'seller' ? '← لوحة المعرض' : '← حجوزاتي';
    }

    const params = new URLSearchParams(window.location.search);
    const toId = parseInt(params.get('to') || params.get('receiverId') || '0', 10);
    const carId = parseInt(params.get('carId') || '0', 10) || null;

    await loadConversations(user.id);

    if (toId && toId !== user.id) {
        await openChatThread(toId, carId);
    }

    if (chatPollTimer) clearInterval(chatPollTimer);
    chatPollTimer = setInterval(async () => {
        if (document.hidden) return;
        await loadConversations(user.id, true);
        if (activeOtherUserId) {
            await openChatThread(activeOtherUserId, activeCarId, true);
        }
    }, 4000);
}

async function loadConversations(userId, silent = false) {
    const pane = document.getElementById('conversations-list-pane');
    try {
        const res = await apiCall(`/messages/conversations?userId=${userId}`);
        if (!res || !res.ok) return;
        chatConversations = await res.json();
        renderConversationsList(chatConversations);
    } catch (err) {
        if (!silent && pane) {
            pane.innerHTML = '<div class="chat-empty-list">تعذر تحميل المحادثات.</div>';
        }
    }
}

function renderConversationsList(list) {
    const pane = document.getElementById('conversations-list-pane');
    if (!pane) return;

    if (!list || list.length === 0) {
        pane.innerHTML = '<div class="chat-empty-list">لا توجد محادثات حالياً.<br>ابدأ محادثة من صفحة أي سيارة في السوق.</div>';
        return;
    }

    pane.innerHTML = list.map(c => {
        const isActive = c.otherUserId === activeOtherUserId;
        const avatar = c.otherUserAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
        const carTitle = c.car ? `${c.car.year} ${c.car.brand} ${c.car.model}` : '';
        const carIdArg = c.car ? c.car.id : 'null';
        const badge = c.unreadCount > 0 ? `<span class="conv-badge">${c.unreadCount}</span>` : '';

        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" onclick="openChatThread(${c.otherUserId}, ${carIdArg})">
                <img src="${escChatHtml(avatar)}" class="user-avatar" alt="">
                <div class="conv-body">
                    <div class="conv-row">
                        <h4>${escChatHtml(c.otherUserName)}</h4>
                        <span class="conv-time">${formatChatTime(c.lastMessageTime)}</span>
                    </div>
                    ${carTitle ? `<div class="conv-car">${escChatHtml(carTitle)}</div>` : ''}
                    <div class="conv-row" style="margin-top:2px;">
                        <p class="conv-last">${escChatHtml(c.lastMessage)}</p>
                        ${badge}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterConversations() {
    const q = (document.getElementById('chat-search-input')?.value || '').trim().toLowerCase();
    if (!q) {
        renderConversationsList(chatConversations);
        return;
    }
    const filtered = chatConversations.filter(c =>
        (c.otherUserName || '').toLowerCase().includes(q) ||
        (c.lastMessage || '').toLowerCase().includes(q) ||
        (c.car && `${c.car.brand} ${c.car.model}`.toLowerCase().includes(q))
    );
    renderConversationsList(filtered);
}

async function openChatThread(otherUserId, carId = null, silent = false) {
    const user = getUser();
    if (!user) return;

    activeOtherUserId = otherUserId;
    activeCarId = carId;
    renderConversationsList(chatConversations);

    const noSel = document.getElementById('chat-no-selection');
    const activePane = document.getElementById('chat-active-thread');
    if (noSel) noSel.style.display = 'none';
    if (activePane) activePane.style.display = 'flex';

    try {
        const q = carId ? `&carId=${carId}` : '';
        const res = await apiCall(`/messages/thread?userId=${user.id}&otherUserId=${otherUserId}${q}`);
        if (!res || !res.ok) return;

        const data = await res.json();
        const messages = data.messages || [];
        const car = data.carContext;
        const other = data.otherUser;

        if (other) {
            document.getElementById('thread-user-name').innerText = other.fullName;
            document.getElementById('thread-user-avatar').src = other.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
            document.getElementById('thread-user-role').innerText = other.role === 'Seller' ? 'معرض / بائع' : 'مشتري';
            const input = document.getElementById('live-chat-input');
            if (input) input.placeholder = `اكتب رسالتك إلى ${other.fullName}...`;
        }

        const carHeader = document.getElementById('thread-car-header');
        if (car && carHeader) {
            carHeader.style.display = 'flex';
            const img = (car.images && car.images.length > 0) ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80';
            document.getElementById('thread-car-img').src = img;
            document.getElementById('thread-car-title').innerText = `${car.year} ${car.brand} ${car.model}`;
            document.getElementById('thread-car-meta').innerText = `${Number(car.mileage || 0).toLocaleString()} ميل • ${car.location || ''}`;
            document.getElementById('thread-car-price').innerText = formatCurrency(car.price);
            document.getElementById('thread-car-link').href = `/car-details.html?id=${car.id}`;

            const bookBtn = document.getElementById('thread-car-book');
            if (bookBtn) {
                if ((user.role || '').toLowerCase() === 'buyer' && car.status === 'Available') {
                    bookBtn.style.display = 'inline-flex';
                    bookBtn.href = `/checkout.html?carId=${car.id}`;
                } else {
                    bookBtn.style.display = 'none';
                }
            }
        } else if (carHeader) {
            carHeader.style.display = 'none';
        }

        const threadEl = document.getElementById('active-chat-messages');
        if (!threadEl) return;

        const wasAtBottom = (threadEl.scrollHeight - threadEl.scrollTop - threadEl.clientHeight) < 60;

        if (messages.length === 0) {
            threadEl.innerHTML = '<div class="chat-empty-thread">لا توجد رسائل بعد. ابدأ المحادثة بإرسال رسالتك الأولى!</div>';
        } else {
            threadEl.innerHTML = messages.map(m => {
                const isMine = m.senderId === user.id;
                return `
                    <div class="chat-bubble ${isMine ? 'sent' : 'received'}">
                        <div>${escChatHtml(m.content)}</div>
                        <div class="bubble-time">${formatChatTime(m.sentAt)}</div>
                    </div>
                `;
            }).join('');
        }

        if (!silent || wasAtBottom) {
            threadEl.scrollTop = threadEl.scrollHeight;
        }
    } catch (err) {
        console.error('[openChatThread]', err);
    }
}

async function sendLiveMsg() {
    const user = getUser();
    const input = document.getElementById('live-chat-input');
    if (!user || !input || !activeOtherUserId) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    const sendBtn = document.getElementById('send-msg-btn');
    if (sendBtn) sendBtn.disabled = true;

    try {
        const res = await apiCall(`/messages/send?senderId=${user.id}`, 'POST', {
            receiverId: activeOtherUserId,
            carId: activeCarId,
            content: text
        });

        if (res && res.ok) {
            await openChatThread(activeOtherUserId, activeCarId);
            await loadConversations(user.id, true);
        } else {
            showToast('تعذر إرسال الرسالة.', 'error');
            input.value = text;
        }
    } catch (err) {
        console.error('[sendLiveMsg]', err);
        showToast('حدث خطأ أثناء إرسال الرسالة.', 'error');
        input.value = text;
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
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
