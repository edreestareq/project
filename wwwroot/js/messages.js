/**
 * KARAJAK AI - Buyer-Seller Real-Time Messaging Module
 * Handles: Conversations list view, thread view, car context header, live sending & polling.
 */

let chatConversations = [];
let activeOtherUserId = null;
let activeCarId = null;
let chatPollTimer = null;

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
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
        pane.innerHTML = '<div class="chat-empty-list">لا توجد محادثات حالياً.<br>يمكنك بدء محادثة من صفحة أي سيارة في السوق.</div>';
        return;
    }

    pane.innerHTML = list.map(c => {
        const avatar = c.otherUserAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
        const carTitle = c.car ? `${c.car.year} ${c.car.brand} ${c.car.model}` : '';
        const carIdArg = c.car ? c.car.id : 'null';
        const roleLabel = c.otherUserRole === 'Seller' ? 'معرض / بائع' : 'مشتري';
        const badge = c.unreadCount > 0 ? `<span class="conv-badge">${c.unreadCount}</span>` : '';

        return `
            <div class="chat-list-item" onclick="openChatThread(${c.otherUserId}, ${carIdArg})">
                <img src="${escapeHtml(avatar)}" class="user-avatar" alt="">
                <div class="conv-body">
                    <div class="conv-row">
                        <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                            <h4>${escapeHtml(c.otherUserName)}</h4>
                            <span style="font-size:0.7rem; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:99px;">${roleLabel}</span>
                        </div>
                        <span class="conv-time">${formatChatTime(c.lastMessageTime)}</span>
                    </div>
                    ${carTitle ? `<div class="conv-car" style="margin-top:2px;">🚗 ${escapeHtml(carTitle)}</div>` : ''}
                    <div class="conv-row" style="margin-top:4px;">
                        <p class="conv-last">${escapeHtml(c.lastMessage)}</p>
                        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                            ${badge}
                            <span style="font-size:0.78rem; color:var(--accent-orange); font-weight:700;">فتح المحادثة ←</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function backToConversationsList() {
    activeOtherUserId = null;
    activeCarId = null;
    const listView = document.getElementById('conversations-view');
    const threadView = document.getElementById('thread-view');
    if (threadView) threadView.style.display = 'none';
    if (listView) listView.style.display = 'block';

    const user = getUser();
    if (user) loadConversations(user.id, true);
}

function reportActiveUser() {
    if (activeOtherUserId) {
        reportTarget('User', activeOtherUserId);
    }
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

    const listView = document.getElementById('conversations-view');
    const threadView = document.getElementById('thread-view');
    if (listView) listView.style.display = 'none';
    if (threadView) threadView.style.display = 'flex';

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
            const img = (car.images && car.images.length > 0) ? car.images[0].imageUrl : NO_CAR_IMAGE;
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
                        <div>${escapeHtml(m.content)}</div>
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
