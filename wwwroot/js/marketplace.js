/**
 * KARAJAK AI - Marketplace & Vehicle Discovery Module
 * Handles: Advanced Multi-parameter Car Filtering, Vehicle Deep Details, AI Search (Gemini API), AI Recommendations.
 */

let selectedFuel = 'All';

// ─── INITIALIZER ───────────────────────────────────────────────────────────────
function initMarketplace() {
    renderHeader('marketplace');
    loadAiRecommendations();
    fetchMarketplaceCars();
}

async function loadAiRecommendations() {
    try {
        const res = await apiCall('/ai/recommendations');
        if (!res || !res.ok) return;

        const items = await res.json();
        const container = document.getElementById('ai-recommendations-row');
        if (!container) return;

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
        console.error(e);
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
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:60px 20px; color:var(--text-muted); font-size:1.1rem;">لا توجد سيارات مطابقة لمعايير البحث الحالية.</div>';
        return;
    }

    grid.innerHTML = cars.map(car => {
        const img = (car.images && car.images.length > 0) ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80';

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

// ─── VEHICLE DEEP DETAILS (Figure 5.41) ────────────────────────────────────────
async function loadCarDetails(carId) {
    try {
        const res = await apiCall(`/cars/${carId}`);
        if (!res || !res.ok) return;

        const car = await res.json();

        // Update titles & breadcrumbs
        const titleEl = document.getElementById('car-title');
        const breadcrumbEl = document.getElementById('breadcrumb-title');
        const subtitleEl = document.getElementById('car-subtitle');
        const priceEl = document.getElementById('checkout-price');
        const mainImgEl = document.getElementById('main-gallery-img');

        if (titleEl) titleEl.innerText = `${car.brand} ${car.model}`;
        if (breadcrumbEl) breadcrumbEl.innerText = `${car.brand} ${car.model}`;
        if (subtitleEl) subtitleEl.innerText = `${car.year} • ${car.mileage.toLocaleString()} miles • ${car.transmission} • ${car.fuelType}`;
        if (priceEl) priceEl.innerText = formatCurrency(car.price);

        const img = (car.images && car.images.length > 0) ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80';
        if (mainImgEl) mainImgEl.src = img;

        // Thumbnails
        const thumbs = document.getElementById('thumbs-container');
        if (thumbs && car.images && car.images.length > 0) {
            thumbs.innerHTML = car.images.map(im => `
                <img src="${im.imageUrl}" class="gallery-thumb" onclick="document.getElementById('main-gallery-img').src='${im.imageUrl}'">
            `).join('');
        }

        // Specs
        const specEngine = document.getElementById('spec-engine');
        const specTrans = document.getElementById('spec-transmission');
        const specDrive = document.getElementById('spec-drivetrain');
        const specFuel = document.getElementById('spec-fuel');
        const specExt = document.getElementById('spec-exterior');

        if (specEngine) specEngine.innerText = car.engineSize || '3.0L Twin-Turbo';
        if (specTrans) specTrans.innerText = car.transmission || 'Automatic';
        if (specDrive) specDrive.innerText = car.driveTrain || 'AWD';
        if (specFuel) specFuel.innerText = car.fuelConsumption || '24 MPG Combined';
        if (specExt) specExt.innerText = car.color || 'Obsidian Black';

        // Seller
        const sellerName = document.getElementById('seller-name');
        if (sellerName && car.seller) {
            sellerName.innerText = car.seller.fullName;
        }

    } catch (err) {
        console.error('[loadCarDetails]', err);
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
        thread.innerHTML += `<div class="chat-bubble sent">${text}</div>`;
        thread.scrollTop = thread.scrollHeight;
    }

    try {
        const res = await apiCall("/ai/assistant", "POST", { message: text });
        if (!res || !res.ok) return;
        const data = await res.json();
        if (thread) {
            thread.innerHTML += `<div class="chat-bubble received">${data.reply}</div>`;
            thread.scrollTop = thread.scrollHeight;
        }
    } catch (e) {
        console.error(e);
    }
}
