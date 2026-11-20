/**
 * KARAJAK AI - Marketplace & Vehicle Discovery Module
 * Handles: Advanced Multi-parameter Car Filtering, Vehicle Deep Details, AI Search (Gemini API), AI Recommendations.
 */

let selectedFuel = 'All';

// ─── INITIALIZER ───────────────────────────────────────────────────────────────
function initMarketplace() {
    renderHeader('marketplace');
    renderMarketplaceUserBar();
    loadAiRecommendations();
    fetchMarketplaceCars();
}

function renderMarketplaceUserBar() {
    const userBar = document.getElementById('marketplace-user-bar');
    if (!userBar) return;
    const user = getUser();
    if (user) {
        let dashLink = '/buyer-dashboard.html';
        let dashLabel = 'لوحة المشتري';
        if (user.role === 'Seller') {
            dashLink = '/seller-dashboard.html';
            dashLabel = 'لوحة المعرض';
        } else if (user.role === 'Admin') {
            dashLink = '/admin-dashboard.html';
            dashLabel = 'لوحة الإدارة';
        }

        userBar.innerHTML = `
            <a href="${dashLink}" class="btn btn-outline btn-sm" style="font-weight:700;">📊 ${dashLabel}</a>
            <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:600;">${user.fullName}</span>
            <button class="btn btn-danger btn-sm" onclick="logoutUser()" style="padding:4px 10px; font-size:0.8rem;">خروج ⎋</button>
        `;
    } else {
        userBar.innerHTML = `
            <a href="/auth-portal.html" class="btn btn-primary btn-sm" style="font-weight:700;">تسجيل الدخول / حساب جديد</a>
        `;
    }
}

async function loadAiRecommendations() {
    const section = document.querySelector('.ai-match-section');
    try {
        const res = await apiCall('/ai/recommendations');
        if (!res || !res.ok) {
            if (section) section.style.display = 'none';
            return;
        }

        const items = await res.json();
        const container = document.getElementById('ai-recommendations-row');
        if (!container || !items || items.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }
        if (section) section.style.display = 'block';

        container.innerHTML = items.map(item => {
            const img = (item.car.images && item.car.images.length > 0) ? item.car.images[0].imageUrl : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80';
            return `
                <div class="ai-car-card" onclick="window.location.href='/car-details.html?id=${item.car.id}'">
                    <div class="match-badge">${item.matchPercentage}% AI Match</div>
                    <img src="${img}" class="ai-car-thumb">
                    <div class="ai-car-info">
                        <h4>${item.car.year} ${item.car.brand} ${item.car.model}</h4>
                        <div class="ai-car-meta">
                            <span>⚡ ${item.car.fuelType}</span>
                            <span>📍 ${item.car.mileage.toLocaleString()} mi</span>
                        </div>
                        <div class="ai-car-price">${formatCurrency(item.car.price)}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        if (section) section.style.display = 'none';
    }
}

// ─── MARKETPLACE DISCOVERY (Figure 5.40) ───────────────────────────────────────
async function fetchMarketplaceCars() {
    const make = document.getElementById('filter-make')?.value || '';
    const model = document.getElementById('filter-model-text')?.value || '';
    const maxPrice = document.getElementById('filter-max-price')?.value || '';
    const sortBy = document.getElementById('filter-sort-select')?.value || 'newest';

    const params = new URLSearchParams();
    if (make) params.append('brand', make);
    if (model) params.append('model', model);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (selectedFuel && selectedFuel !== 'All') params.append('fuelType', selectedFuel);
    params.append('sortBy', sortBy);

    const grid = document.getElementById('cars-grid-container');
    if (grid) {
        grid.innerHTML = "<div style='grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);'>جاري تحميل سيارات السوق...</div>";
    }

    try {
        const res = await apiCall(`/cars?${params.toString()}`);
        if (!res || !res.ok) return;

        const data = await res.json();
        const cars = data.data || [];

        const countTitle = document.getElementById('results-count-title');
        if (countTitle) countTitle.innerText = `عرض ${cars.length} سيارة متاحة بالسوق`;

        renderMarketplaceGrid(cars);

    } catch (err) {
        console.error('[fetchMarketplaceCars]', err);
    }
}

function renderMarketplaceGrid(cars) {
    const grid = document.getElementById('cars-grid-container');
    if (!grid) return;

    if (!cars || cars.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:60px 20px; background:var(--bg-surface-card); border:1px solid var(--border-color); border-radius:var(--radius-md); color:var(--text-muted); font-size:1.05rem;">
                <div style="font-size:2.5rem; margin-bottom:12px;">🚗</div>
                <h3 style="font-weight:800; margin-bottom:8px; color:var(--text-primary);">سوق السيارات خالٍ حالياً</h3>
                <p style="font-size:0.88rem; margin-bottom:18px;">لا توجد سيارات معروضة بعد في السوق. يمكنك تسجيل الدخول كتاجر لإضافة أول سيارة للبيع!</p>
                <a href="/seller-login.html" class="btn btn-primary btn-sm">تسجيل الدخول كتاجر لإضافة سيارة →</a>
            </div>
        `;
        return;
    }

    grid.innerHTML = cars.map(car => {
        const img = (car.images && car.images.length > 0) ? car.images[0].imageUrl : NO_CAR_IMAGE;

        return `
            <div class="car-card">
                <div class="car-image-container">
                    <img src="${img}" class="car-image" alt="${car.brand} ${car.model}">
                    <span class="car-badge badge-certified">CERTIFIED PRE-OWNED</span>
                </div>
                <div class="car-body">
                    <h3 class="car-title">${car.brand} ${car.model}</h3>
                    <div class="car-subtitle">${car.year} • ${car.fuelType} • ${car.driveTrain || 'AWD'}</div>
                    <div class="car-specs-row">
                        <span>🚀 ${car.mileage.toLocaleString()} mi</span>
                        <span>⚙️ ${car.transmission}</span>
                        <span>📍 ${car.location}</span>
                    </div>
                    <div class="car-footer">
                        <div class="car-price">${formatCurrency(car.price)}</div>
                        <a href="/car-details.html?id=${car.id}" class="btn btn-secondary btn-sm">عرض التفاصيل</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setFuel(fuel, el) {
    selectedFuel = fuel;
    document.querySelectorAll('.fuel-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    fetchMarketplaceCars();
}

function resetFilters() {
    const makeEl = document.getElementById('filter-make');
    const modelEl = document.getElementById('filter-model-text');
    const priceEl = document.getElementById('filter-max-price');

    if (makeEl) makeEl.value = '';
    if (modelEl) modelEl.value = '';
    if (priceEl) priceEl.value = '';

    selectedFuel = 'All';
    document.querySelectorAll('.fuel-chip').forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector(".fuel-chip[data-fuel='All']");
    if (allChip) allChip.classList.add('active');

    fetchMarketplaceCars();
}

function setQuery(text) {
    const input = document.getElementById('ai-search-input');
    if (input) input.value = text;
    triggerAiSearch();
}

// AI NATURAL LANGUAGE SEARCH (Gemini API)
async function triggerAiSearch() {
    const input = document.getElementById('ai-search-input');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;

    const banner = document.getElementById('ai-search-commentary');
    if (banner) {
        banner.style.display = 'block';
        banner.innerHTML = `✨ <strong>تحليل الذكاء الاصطناعي (Gemini):</strong> "${query}"...`;
    }

    try {
        const res = await apiCall('/ai/search', 'POST', { query: query });
        if (!res || !res.ok) return;

        const data = await res.json();
        if (banner) {
            banner.innerHTML = `✨ <strong>تحليل الذكاء الاصطناعي:</strong> ${data.aiAnalysisComment || 'تم تحليل طلبك ومطابقة أفضل السيارات المتوفرة.'}`;
        }

        const grid = document.getElementById('cars-grid-container');
        if (grid && data.results) {
            grid.innerHTML = data.results.map(r => {
                const img = (r.car.images && r.car.images.length > 0) ? r.car.images[0].imageUrl : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80';

                return `
                    <div class="car-card">
                        <div class="car-image-container">
                            <img src="${img}" class="car-image">
                            <span class="match-badge" style="top:10px; left:10px;">${r.matchPercentage}% AI MATCH</span>
                        </div>
                        <div class="car-body">
                            <h3 class="car-title">${r.car.brand} ${r.car.model}</h3>
                            <div class="car-subtitle">${r.car.year} • ${r.car.fuelType}</div>
                            <div style="font-size:0.78rem; color:#93c5fd; margin:6px 0; background:rgba(30,58,138,0.3); padding:6px 10px; border-radius:4px;">
                                💡 ${r.matchReason}
                            </div>
                            <div class="car-footer">
                                <div class="car-price">${formatCurrency(r.car.price)}</div>
                                <a href="/car-details.html?id=${r.car.id}" class="btn btn-primary btn-sm">عرض التفاصيل</a>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

    } catch (err) {
        console.error('[triggerAiSearch]', err);
    }
}

// ─── VEHICLE DEEP DETAILS ───────────────────────────────────────────────────────
async function loadCarDetails(carId) {
    const state = document.getElementById('car-state');
    const content = document.getElementById('car-content');

    try {
        const res = await apiCall(`/cars/${carId}`);
        if (!res || !res.ok) {
            if (state) state.innerHTML = '<div style="font-size:2.5rem; margin-bottom:10px;">🚫</div>هذه المركبة غير متاحة أو تم حذفها.<br><br><a href="/marketplace.html" class="btn btn-primary btn-sm">العودة إلى السوق</a>';
            return;
        }

        const car = await res.json();
        const user = getUser();
        const isOwner = !!(user && car.sellerId === user.id);
        const role = (user && user.role || '').toLowerCase();

        document.title = `${car.brand} ${car.model} | KARAJAK`;
        document.getElementById('breadcrumb-title').innerText = `${car.brand} ${car.model}`;
        document.getElementById('car-title').innerText = `${car.year} ${car.brand} ${car.model}`;
        document.getElementById('car-subtitle').innerText =
            `${Number(car.mileage).toLocaleString()} ميل • ${car.transmission || ''} • ${car.fuelType || ''} • ${car.location || ''}`;
        document.getElementById('checkout-price').innerText = formatCurrency(car.price);

        // Gallery
        const images = (car.images || []).map(i => i.imageUrl);
        const mainImg = document.getElementById('main-gallery-img');
        mainImg.src = images[0] || NO_CAR_IMAGE;
        const thumbs = document.getElementById('thumbs-container');
        thumbs.innerHTML = '';
        if (images.length > 1) {
            images.forEach(url => {
                const t = document.createElement('img');
                t.src = url;
                t.className = 'gallery-thumb';
                t.onclick = () => { mainImg.src = url; };
                thumbs.appendChild(t);
            });
        }

        // Description
        if (car.description) {
            document.getElementById('description-box').style.display = 'block';
            document.getElementById('car-description').innerText = car.description;
        }

        // Specs: only show fields that really exist
        const specs = [
            ['الماركة', car.brand], ['الموديل', car.model], ['سنة الصنع', car.year],
            ['المسافة المقطوعة', car.mileage != null ? `${Number(car.mileage).toLocaleString()} ميل` : null],
            ['نوع الوقود', car.fuelType], ['ناقل الحركة', car.transmission],
            ['نظام الدفع', car.driveTrain], ['المحرك', car.engineSize],
            ['استهلاك الوقود', car.fuelConsumption], ['سعة البطارية', car.batteryCapacity],
            ['مدى القيادة', car.rangePerCharge ? `${car.rangePerCharge} ميل` : null],
            ['نوع الشحن', car.chargingType], ['اللون', car.color], ['الموقع', car.location]
        ].filter(s => s[1] !== null && s[1] !== undefined && s[1] !== '');
        document.getElementById('specs-grid').innerHTML =
            specs.map(s => `<div><strong>${escapeHtml(s[0])}:</strong> ${escapeHtml(s[1])}</div>`).join('');

        // Features
        const features = (car.keyFeatures || '').split(',').map(f => f.trim()).filter(Boolean);
        if (features.length) {
            document.getElementById('features-box').style.display = 'block';
            document.getElementById('features-container').innerHTML = features
                .map(f => `<span class="status-chip" style="background:var(--bg-surface-elevated);">${escapeHtml(f)}</span>`).join('');
        }

        // Seller card
        const seller = car.seller;
        if (seller) {
            document.getElementById('seller-name').innerText = seller.fullName;
            document.getElementById('seller-avatar').src = seller.profilePicture || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80';
            document.getElementById('seller-verified').innerText = seller.isVerified ? '✓ تاجر ومعرض موثّق في منصة KARAJAK' : 'بائع مسجّل';
        }

        // Status line
        const statusLine = document.getElementById('car-status-line');
        const available = car.status === 'Available';
        statusLine.style.color = available ? '#34d399' : '#f59e0b';
        statusLine.innerText = available ? '● متاحة للحجز' : (car.status === 'Pending' ? '● بانتظار مراجعة الإدارة' : `● ${car.status}`);

        // Actions depend on who is looking
        const sellerActions = document.getElementById('seller-actions');
        const booking = document.getElementById('booking-actions');
        sellerActions.innerHTML = '';
        booking.innerHTML = '';

        if (isOwner) {
            booking.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.85rem;">هذه سيارتك. تُدار من <a href="/seller-listings.html" style="color:var(--accent-orange);">سياراتي المعروضة</a>.</div>';
        } else if (!user) {
            sellerActions.innerHTML = '<a href="/auth-portal.html" class="btn btn-secondary btn-sm">سجّل الدخول للمراسلة</a>';
            booking.innerHTML = '<a href="/auth-portal.html" class="btn btn-primary btn-lg">سجّل الدخول للحجز</a>';
        } else if (role === 'admin') {
            booking.innerHTML = '<div style="text-align:center; color:#a78bfa; font-size:0.85rem; font-weight:700;">🛡️ وضع المعاينة الإدارية (الحجز والمراسلة للمشترين والبائعين فقط)</div>';
        } else {
            if (seller) {
                sellerActions.innerHTML = `
                    <a href="/messages.html?to=${seller.id}&carId=${car.id}" class="btn btn-secondary btn-sm">💬 مراسلة البائع</a>
                    <button type="button" class="btn btn-outline btn-sm" style="border-color:#ef4444; color:#ef4444;" onclick="reportTarget('Listing', ${car.id})">🚨 إبلاغ</button>
                `;
            }
            if (role === 'buyer' && available) {
                booking.innerHTML = `<a href="/checkout.html?carId=${car.id}" class="btn btn-primary btn-lg" id="book-now-btn">احجز الآن</a>`;
            } else if (role !== 'buyer') {
                booking.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.85rem;">الحجز متاح لحسابات المشترين فقط.</div>';
            }
        }

        if (state) state.style.display = 'none';
        if (content) content.style.display = '';

    } catch (err) {
        console.error('[loadCarDetails]', err);
        if (state) state.innerText = 'حدث خطأ أثناء تحميل المركبة.';
    }
}

function toggleAssistant() {
    const box = document.getElementById("ai-chatbox");
    if (box) box.classList.toggle("active");
}

async function sendAssistantMsg() {
    const input = document.getElementById("ai-chat-input");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";

    const thread = document.getElementById("ai-chat-thread");
    if (thread) {
        thread.innerHTML += `<div class="chat-bubble sent">${escapeHtml(text)}</div>`;
        thread.scrollTop = thread.scrollHeight;
    }

    try {
        const res = await apiCall("/ai/assistant", "POST", { message: text });
        if (!res || !res.ok) return;
        const data = await res.json();
        if (thread) {
            thread.innerHTML += `<div class="chat-bubble received">${escapeHtml(data.reply)}</div>`;
            thread.scrollTop = thread.scrollHeight;
        }
    } catch (e) {
        console.error(e);
    }
}
