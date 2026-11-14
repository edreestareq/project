/**
 * KARAJAK AI - Frontend Application Controller
 * Web-Based Car Sales Platform Powered by Artificial Intelligence
 * Middle East University - Graduation Project
 */

// Global Application State
const state = {
    currentUser: {
        id: 6,
        fullName: "Ali Hassan",
        email: "ali@gmail.com",
        role: "Buyer",
        isVerified: true
    },
    token: null,
    currentScreen: "screen-home",
    lang: "en",
    theme: "dark",
    cars: [],
    currentCar: null,
    currentBooking: null,
    activeConversationUserId: 4, // Marcus Sterling default
    activeConversationCarId: 1,
    aiRecommendations: []
};

// API Base URL
const API = {
    auth: "/api/auth",
    cars: "/api/cars",
    ai: "/api/ai",
    bookings: "/api/bookings",
    payments: "/api/payments",
    messages: "/api/messages",
    reviews: "/api/reviews",
    notifications: "/api/notifications",
    admin: "/api/admin"
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    initThemeAndLang();
    loadFeaturedAndRecommendations();
    loadMarketplaceCars();
    refreshNotifications();
    setupEventHandlers();
});

// Theme and Language Initializer
function initThemeAndLang() {
    const savedTheme = localStorage.getItem("karajak_theme") || "dark";
    setTheme(savedTheme);

    const savedLang = localStorage.getItem("karajak_lang") || "en";
    setLanguage(savedLang);
}

function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("karajak_theme", theme);
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.innerHTML = theme === "dark" ? "☀️ Light" : "🌙 Dark";
}

function toggleTheme() {
    setTheme(state.theme === "dark" ? "light" : "dark");
}

function setLanguage(lang) {
    state.lang = lang;
    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    localStorage.setItem("karajak_lang", lang);
    const btn = document.getElementById("lang-toggle-btn");
    if (btn) btn.innerText = lang === "ar" ? "English" : "العربية";
    applyLanguageTranslations(lang);
}

function toggleLanguage() {
    setLanguage(state.lang === "en" ? "ar" : "en");
}

// Translations Dictionary
const translations = {
    en: {
        brandSubtitle: "AI-Powered Vehicle Marketplace",
        home: "Home",
        marketplace: "Marketplace",
        aiAssistant: "AI Assistant",
        sellCar: "Sell Your Car",
        myBookings: "My Bookings",
        messages: "Messages",
        adminConsole: "Admin Console",
        login: "Log In",
        register: "Get Started",
        logout: "Log Out",
        heroTitle: "Welcome to KARAJAK",
        heroSubtitle: "The future of automotive commerce. Choose your entry point to manage, sell, or discover your next high-performance vehicle.",
        buyerHubTitle: "Buyer Dashboard",
        buyerHubDesc: "Discover AI-powered car recommendations and manage dream vehicle purchases.",
        sellerHubTitle: "Seller Dashboard",
        sellerHubDesc: "List your vehicles with AI-optimized pricing and track your marketplace performance.",
        adminHubTitle: "Admin Dashboard",
        adminHubDesc: "Maintain ecosystem health, moderate listings, and manage global system configurations.",
        searchPlaceholder: "Try natural language: 'Find me a red SUV with low mileage under $40,000'...",
        askAiBtn: "AI Search",
        enterHub: "Enter Hub →",
        verifiedBadge: "Verified",
        bookNow: "Book Now",
        viewDetails: "View Details",
        carsYouMightLike: "Cars You Might Like",
        makeOffer: "Make Offer",
        messageSeller: "Contact Seller"
    },
    ar: {
        brandSubtitle: "منصة بيع السيارات المدعومة بالذكاء الاصطناعي",
        home: "الرئيسية",
        marketplace: "سوق السيارات",
        aiAssistant: "المساعد الذكي",
        sellCar: "أضف سيارتك",
        myBookings: "حجوزاتي",
        messages: "المحادثات",
        adminConsole: "لوحة الإدارة",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        logout: "تسجيل الخروج",
        heroTitle: "مرحباً بكم في منصة كراجك (KARAJAK)",
        heroSubtitle: "مستقبل تجارة السيارات الفاخرة والحديثة. بوابتك الذكية لشراء، بيع، أو إدارة صفقات السيارات بكل أمان وثقة.",
        buyerHubTitle: "بوابة المشتري",
        buyerHubDesc: "استكشف توصيات السيارات بالذكاء الاصطناعي وقم بحجز وشراء سيارة أحلامك بكل سهولة.",
        sellerHubTitle: "بوابة البائع",
        sellerHubDesc: "أعلن عن سياراتك مع تسعير مدعوم بالذكاء الاصطناعي وتابع المبيعات والأرباح من لوحة تحكم متكاملة.",
        adminHubTitle: "لوحة تحكم الإدارة",
        adminHubDesc: "مراقبة الصفقات، تدقيق واعتماد الإعلانات، إدارة المستخدمين وضبط إعدادات المنصة.",
        searchPlaceholder: "جرّب البحث باللغة الطبيعية: 'ابحث لي عن سيارة كهربائية عائلية بسعر مناسب'...",
        askAiBtn: "بحث ذكي",
        enterHub: "الدخول للوحة ←",
        verifiedBadge: "موثّق",
        bookNow: "احجز الآن",
        viewDetails: "تفاصيل السيارة",
        carsYouMightLike: "سيارات مقترحة لك",
        makeOffer: "تقديم عرض",
        messageSeller: "مراسلة البائع"
    }
};

function applyLanguageTranslations(lang) {
    const t = translations[lang] || translations.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) {
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                el.placeholder = t[key];
            } else {
                el.innerText = t[key];
            }
        }
    });
}

// Screen Routing
function showScreen(screenId) {
    document.querySelectorAll(".view-screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active");
        state.currentScreen = screenId;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Contextual Data Fetching for screens
    if (screenId === "screen-marketplace") {
        loadMarketplaceCars();
    } else if (screenId === "screen-seller-dashboard") {
        loadSellerDashboard();
    } else if (screenId === "screen-seller-listings") {
        loadSellerListingsTable();
    } else if (screenId === "screen-seller-analytics") {
        loadSellerAnalytics();
    } else if (screenId === "screen-seller-requests") {
        loadSellerBookingRequests();
    } else if (screenId === "screen-buyer-bookings") {
        loadBuyerBookings();
    } else if (screenId === "screen-messaging") {
        loadMessagingCenter();
    } else if (screenId === "screen-admin-dashboard") {
        loadAdminDashboard();
    } else if (screenId === "screen-admin-listings") {
        loadAdminListingsModeration();
    } else if (screenId === "screen-admin-users") {
        loadAdminUsers();
    } else if (screenId === "screen-admin-transactions") {
        loadAdminTransactions();
    } else if (screenId === "screen-admin-reports") {
        loadAdminReports();
    } else if (screenId === "screen-admin-settings") {
        loadAdminSettings();
    }
}

// Quick Switch Role (For Evaluation & Demo)
async function quickSwitchRole(role) {
    try {
        const res = await fetch(`${API.auth}/quick-login/${role}`, { method: "POST" });
        const data = await res.json();
        if (data && data.user) {
            state.currentUser = data.user;
            state.token = data.token;
            updateUserNav();
            
            // Highlight role pill
            document.querySelectorAll(".role-pill").forEach(p => p.classList.remove("active"));
            const activePill = document.querySelector(`.role-pill[data-role="${role}"]`);
            if (activePill) activePill.classList.add("active");

            showToast(`Switched active session to: ${data.user.fullName} (${data.user.role})`);

            if (role === "admin") showScreen("screen-admin-dashboard");
            else if (role === "seller") showScreen("screen-seller-dashboard");
            else showScreen("screen-home");
        }
    } catch (err) {
        console.error("Quick switch error:", err);
    }
}

function updateUserNav() {
    const user = state.currentUser;
    const nameEl = document.getElementById("nav-user-name");
    const roleBadge = document.getElementById("nav-user-role");
    const avatar = document.getElementById("nav-user-avatar");

    if (user) {
        if (nameEl) nameEl.innerText = user.fullName;
        if (roleBadge) {
            roleBadge.innerText = user.role;
            roleBadge.className = `status-chip status-${user.role.toLowerCase()}`;
        }
        if (avatar && user.profilePicture) {
            avatar.src = user.profilePicture;
        }

        // Adjust role-based links
        document.querySelectorAll(".role-buyer-only").forEach(el => el.style.display = (user.role === "Buyer" || user.role === "Admin") ? "" : "none");
        document.querySelectorAll(".role-seller-only").forEach(el => el.style.display = (user.role === "Seller" || user.role === "Admin") ? "" : "none");
        document.querySelectorAll(".role-admin-only").forEach(el => el.style.display = (user.role === "Admin") ? "" : "none");
    }
}

// Fetch Featured & AI Recommendations for Home / Marketplace
async function loadFeaturedAndRecommendations() {
    try {
        const res = await fetch(`${API.ai}/recommendations`);
        if (res.ok) {
            state.aiRecommendations = await res.json();
            renderAiMatchCards(state.aiRecommendations);
        }
    } catch (err) {
        console.error("Error loading recommendations:", err);
    }
}

function renderAiMatchCards(items) {
    const container = document.getElementById("ai-match-cards-container");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = "<p class='text-muted'>No AI recommendations generated yet.</p>";
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="ai-car-card" onclick="openCarDetails(${item.car.id})">
            <div class="match-badge">${item.matchPercentage}% AI Match</div>
            <img src="${item.car.images && item.car.images.length > 0 ? item.car.images[0].imageUrl : 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80'}" class="ai-car-thumb" alt="${item.car.brand} ${item.car.model}">
            <div class="ai-car-info">
                <h4>${item.car.year} ${item.car.brand} ${item.car.model}</h4>
                <div class="ai-car-meta">
                    <span>⚡ ${item.car.fuelType}</span>
                    <span>📍 ${item.car.mileage.toLocaleString()} mi</span>
                </div>
                <div class="ai-car-price">$${item.car.price.toLocaleString()}</div>
            </div>
        </div>
    `).join("");
}

// Load Marketplace Cars with Advanced Filters
async function loadMarketplaceCars() {
    const brand = document.getElementById("filter-brand")?.value || "";
    const model = document.getElementById("filter-model")?.value || "";
    const maxPrice = document.getElementById("filter-max-price")?.value || "";
    const fuelType = document.querySelector(".filter-fuel.active")?.getAttribute("data-fuel") || "";
    const transmission = document.getElementById("filter-transmission")?.value || "";
    const sortBy = document.getElementById("filter-sort")?.value || "newest";
    const searchQuery = document.getElementById("marketplace-keyword-input")?.value || "";

    const params = new URLSearchParams();
    if (brand) params.append("brand", brand);
    if (model) params.append("model", model);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (fuelType && fuelType !== "All") params.append("fuelType", fuelType);
    if (transmission && transmission !== "All") params.append("transmission", transmission);
    if (sortBy) params.append("sortBy", sortBy);
    if (searchQuery) params.append("searchQuery", searchQuery);

    const grid = document.getElementById("marketplace-cars-grid");
    if (grid) grid.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 40px;'>Loading luxury inventory...</div>";

    try {
        const res = await fetch(`${API.cars}?${params.toString()}`);
        const result = await res.json();
        state.cars = result.data || [];
        renderCarsGrid(state.cars, "marketplace-cars-grid");
        
        const countEl = document.getElementById("results-count-badge");
        if (countEl) countEl.innerText = `Showing ${state.cars.length} Results`;
    } catch (err) {
        console.error("Error fetching cars:", err);
    }
}

function renderCarsGrid(cars, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!cars || cars.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <h3>No vehicles found</h3>
            <p style="color: var(--text-muted); margin-top: 8px;">Try adjusting your filter preferences or use natural language AI search.</p>
        </div>`;
        return;
    }

    container.innerHTML = cars.map(car => {
        const primaryImage = (car.images && car.images.length > 0) ? car.images[0].imageUrl : "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80";
        return `
            <div class="car-card">
                <div class="car-image-container">
                    <img src="${primaryImage}" class="car-image" alt="${car.brand} ${car.model}">
                    <span class="car-badge ${car.status === 'Available' ? 'badge-certified' : 'badge-reserved'}">
                        ${car.status === 'Available' ? 'CERTIFIED' : car.status.toUpperCase()}
                    </span>
                    <button class="favorite-btn" onclick="toggleFavorite(${car.id}, event)" title="Save Car">♥</button>
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
                        <div class="car-price">$${car.price.toLocaleString()}</div>
                        <button class="btn btn-secondary btn-sm" onclick="openCarDetails(${car.id})">View Details</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// AI-Powered Natural Language Search (Figure 5.40 & FR6)
async function executeAiSearch(queryOverride) {
    const input = document.getElementById("ai-search-input") || document.getElementById("home-ai-search-input");
    const query = queryOverride || (input ? input.value : "");

    if (!query.trim()) {
        showToast("Please enter what kind of car you are looking for.");
        return;
    }

    showScreen("screen-marketplace");
    const banner = document.getElementById("ai-search-results-banner");
    if (banner) {
        banner.style.display = "block";
        banner.innerHTML = `<div>🔍 <strong>Analyzing query with Gemini AI:</strong> "${query}"...</div>`;
    }

    try {
        const res = await fetch(`${API.ai}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();

        if (banner) {
            banner.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="background:var(--accent-orange); color:white; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;">AI SEARCH RESULTS</span>
                        <div style="margin-top:6px; font-size:0.95rem; color:#e0e7ff;">${data.aiAnalysisComment}</div>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="clearAiSearch()">Clear AI Filter</button>
                </div>
            `;
        }

        // Render AI-scored vehicles
        const scoredCars = data.results.map(r => r.car);
        renderCarsGrid(scoredCars, "marketplace-cars-grid");
        showToast(`Gemini AI matched ${scoredCars.length} vehicles!`);
    } catch (err) {
        console.error("AI Search failed:", err);
        showToast("AI search failed, showing standard inventory.");
        loadMarketplaceCars();
    }
}

function clearAiSearch() {
    const banner = document.getElementById("ai-search-results-banner");
    if (banner) banner.style.display = "none";
    loadMarketplaceCars();
}

// Vehicle Details Modal with AI Insights (Figure 5.41)
async function openCarDetails(carId) {
    try {
        const res = await fetch(`${API.cars}/${carId}`);
        if (!res.ok) return;
        const car = await res.json();
        state.currentCar = car;

        // Fetch AI Insights
        let insights = {
            matchPercentage: 96,
            matchReason: "Great value deal based on local inventory and verified condition.",
            estimatedMarketValue: Math.round(car.price * 1.04),
            reliabilityScore: 4.8,
            demandLevel: "High"
        };
        try {
            const aiRes = await fetch(`${API.ai}/insights/${car.id}`);
            if (aiRes.ok) insights = await aiRes.json();
        } catch (e) {
            console.warn("AI insights fallback");
        }

        const modal = document.getElementById("vehicle-details-modal");
        const container = document.getElementById("vehicle-details-container");
        if (!modal || !container) return;

        const primaryImage = (car.images && car.images.length > 0) ? car.images[0].imageUrl : "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1000&q=80";

        container.innerHTML = `
            <div class="vehicle-details-layout">
                <div>
                    <img id="detail-main-img" src="${primaryImage}" class="gallery-main" alt="${car.brand} ${car.model}">
                    <div class="gallery-thumbs">
                        ${(car.images || []).map((img, i) => `
                            <img src="${img.imageUrl}" class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="switchDetailImage('${img.imageUrl}', this)" alt="thumbnail">
                        `).join("")}
                    </div>

                    <!-- AI Insights Panel (Figure 5.41) -->
                    <div class="ai-insights-box">
                        <div class="ai-insights-header">
                            ✨ <strong>AutoMart AI Insights & Market Valuation</strong>
                        </div>
                        <div class="ai-metrics-grid">
                            <div class="ai-metric-item">
                                <div class="ai-metric-label">Estimated Value</div>
                                <div class="ai-metric-val" style="color:#34d399;">$${insights.estimatedMarketValue.toLocaleString()}</div>
                            </div>
                            <div class="ai-metric-item">
                                <div class="ai-metric-label">Reliability Score</div>
                                <div class="ai-metric-val" style="color:#60a5fa;">${insights.reliabilityScore} / 5.0</div>
                            </div>
                            <div class="ai-metric-item">
                                <div class="ai-metric-label">Demand Level</div>
                                <div class="ai-metric-val" style="color:#f59e0b;">${insights.demandLevel}</div>
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 10px; line-height: 1.4;">
                            ${insights.matchReason}
                        </div>
                    </div>

                    <div style="margin-top: 20px;">
                        <h4 style="margin-bottom: 8px;">Specifications</h4>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.85rem; color:var(--text-secondary); background:var(--bg-surface); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                            <div><strong>Engine:</strong> ${car.engineSize || 'N/A'}</div>
                            <div><strong>Transmission:</strong> ${car.transmission}</div>
                            <div><strong>Drivetrain:</strong> ${car.driveTrain || 'AWD'}</div>
                            <div><strong>Fuel Economy:</strong> ${car.fuelConsumption || 'High Efficiency'}</div>
                            <div><strong>Exterior Color:</strong> ${car.color}</div>
                            <div><strong>Mileage:</strong> ${car.mileage.toLocaleString()} miles</div>
                            ${car.batteryCapacity ? `<div><strong>Battery:</strong> ${car.batteryCapacity}</div>` : ''}
                            ${car.rangePerCharge ? `<div><strong>Range:</strong> ${car.rangePerCharge} miles</div>` : ''}
                        </div>
                    </div>
                </div>

                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h2 style="font-size:1.6rem; font-weight:800;">${car.brand} ${car.model}</h2>
                            <div style="color:var(--text-muted); font-size:0.9rem;">${car.year} • Clean Title • 1-Owner Verified</div>
                        </div>
                        <div style="font-size:1.8rem; font-weight:900; color:var(--accent-orange);">$${car.price.toLocaleString()}</div>
                    </div>

                    <p style="color:var(--text-secondary); font-size:0.9rem; margin:16px 0; line-height:1.5;">${car.description}</p>

                    <div style="margin-bottom: 20px;">
                        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Key Features</h4>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            ${(car.keyFeatures || 'Adaptive Cruise Control, Apple CarPlay, Heated Seats, Blind Spot Monitor')
                                .split(',')
                                .map(f => `<span class="status-chip" style="background:rgba(255,255,255,0.06); color:var(--text-secondary); border:1px solid var(--border-color);">${f.trim()}</span>`)
                                .join('')}
                        </div>
                    </div>

                    <!-- Verified Seller Details -->
                    <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:16px; margin-bottom:20px;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                            <img src="${car.seller?.profilePicture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">
                            <div>
                                <div style="font-weight:700;">${car.seller?.fullName || 'Verified Dealer'} ${car.seller?.isVerified ? '✓' : ''}</div>
                                <div style="color:var(--accent-emerald); font-size:0.8rem; font-weight:600;">★ 4.9 (124 Reviews) • Verified Dealer</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-outline btn-sm" style="flex:1;" onclick="startChatWithSeller(${car.sellerId}, ${car.id})">💬 Message</button>
                            <button class="btn btn-outline btn-sm" style="flex:1;" onclick="alert('Calling Seller: ${car.seller?.phoneNumber || '+962 79 123 4567'}')">📞 Call</button>
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <button class="btn btn-primary btn-lg" onclick="openCheckoutModal(${car.id})">⚡ Book Now & Schedule Handover</button>
                        <button class="btn btn-secondary" onclick="alert('Test drive scheduled request sent to ${car.seller?.fullName}')">📅 Schedule Test Drive</button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add("active");
    } catch (err) {
        console.error("Error opening car details:", err);
    }
}

function switchDetailImage(url, thumb) {
    const mainImg = document.getElementById("detail-main-img");
    if (mainImg) mainImg.src = url;
    document.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
    if (thumb) thumb.classList.add("active");
}

function closeVehicleDetailsModal() {
    const modal = document.getElementById("vehicle-details-modal");
    if (modal) modal.classList.remove("active");
}

// Multi-Step Vehicle Booking & Checkout (Figure 5.49, 135, 136)
function openCheckoutModal(carId) {
    closeVehicleDetailsModal();
    const car = state.cars.find(c => c.id === carId) || state.currentCar;
    if (!car) return;

    state.currentCar = car;
    const modal = document.getElementById("checkout-modal");
    if (!modal) return;

    // Reset to step 1
    goToCheckoutStep(1);

    // Populate car summary
    document.getElementById("checkout-car-title").innerText = `${car.year} ${car.brand} ${car.model}`;
    document.getElementById("checkout-car-price").innerText = `$${car.price.toLocaleString()}`;
    document.getElementById("checkout-car-subtotal").innerText = `$${car.price.toLocaleString()}`;
    
    const total = car.price + 450 + Math.round(car.price * 0.06);
    document.getElementById("checkout-car-total").innerText = `$${total.toLocaleString()}`;
    document.getElementById("checkout-car-thumb").src = (car.images && car.images.length > 0) ? car.images[0].imageUrl : "";

    modal.classList.add("active");
}

function closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    if (modal) modal.classList.remove("active");
}

function goToCheckoutStep(step) {
    document.querySelectorAll(".step-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".checkout-step").forEach(el => el.classList.remove("active"));

    const content = document.getElementById(`checkout-step-${step}`);
    const tab = document.getElementById(`step-tab-${step}`);
    if (content) content.style.display = "block";
    if (tab) tab.classList.add("active");
}

async function submitHandoverAndProceedToPayment() {
    const car = state.currentCar;
    if (!car) return;

    const slot = document.querySelector(".time-slot-btn.active")?.innerText || "09:00 AM";
    const dateInput = document.getElementById("handover-date-picker")?.value || new Date(Date.now() + 86400000 * 3).toISOString();

    try {
        const res = await fetch(`${API.bookings}?buyerId=${state.currentUser.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                carId: car.id,
                scheduledHandoverDate: dateInput,
                scheduledTimeSlot: slot,
                deliveryLocation: "KARAJAK Delivery Center - Amman",
                offerAmount: car.price,
                notes: "Vehicle inspection and concierge delivery."
            })
        });
        const data = await res.json();
        if (data.success) {
            state.currentBooking = { id: data.bookingId, car: car, timeSlot: slot, date: dateInput };
            goToCheckoutStep(2);
        } else {
            showToast(data.message || "Unable to proceed with booking.");
        }
    } catch (err) {
        console.error("Booking failed:", err);
        goToCheckoutStep(2);
    }
}

async function processPaymentTransaction() {
    const bookingId = state.currentBooking ? state.currentBooking.id : 1;
    const method = document.querySelector(".payment-tab.active")?.innerText || "Credit Card";

    try {
        const res = await fetch(`${API.payments}/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingId: bookingId,
                paymentMethod: method,
                cardholderName: "Ali Hassan",
                cardNumber: "**** **** **** 4242"
            })
        });
        const data = await res.json();
        if (data.success) {
            // Step 3 Confirmation screen (Figure 136)
            document.getElementById("confirmation-order-id").innerText = `Order Ref: ${data.transactionCode}`;
            document.getElementById("confirmation-car-name").innerText = `${state.currentCar.year} ${state.currentCar.brand} ${state.currentCar.model}`;
            document.getElementById("confirmation-paid-amount").innerText = `$${data.totalAmount.toLocaleString()}`;
            goToCheckoutStep(3);
            showToast("Payment Successful! Confirmation receipt issued.");
            refreshNotifications();
        } else {
            showToast(data.message || "Payment declined.");
        }
    } catch (err) {
        console.error("Payment error:", err);
        goToCheckoutStep(3);
    }
}

// Buyer Booking Management Screen (Figure 5.43 & 5.50)
async function loadBuyerBookings(filterTab = "all") {
    const list = document.getElementById("buyer-bookings-list");
    if (!list) return;

    list.innerHTML = "<div style='text-align:center; padding:30px;'>Loading your active bookings...</div>";

    try {
        const res = await fetch(`${API.bookings}/my?buyerId=${state.currentUser.id}`);
        const bookings = await res.json();

        let filtered = bookings;
        if (filterTab === "reserved") filtered = bookings.filter(b => b.bookingStatus === "Approved" || b.bookingStatus === "Payment Pending" || b.bookingStatus === "Pending");
        if (filterTab === "purchased") filtered = bookings.filter(b => b.bookingStatus === "Completed" || b.bookingStatus === "Paid");

        if (!filtered || filtered.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">
                <h3>No vehicle reservations found</h3>
                <p>Browse our marketplace and reserve your first vehicle.</p>
                <button class="btn btn-primary" style="margin-top:14px;" onclick="showScreen('screen-marketplace')">Browse Cars</button>
            </div>`;
            return;
        }

        list.innerHTML = filtered.map(b => {
            const car = b.car;
            const img = (car && car.images && car.images.length > 0) ? car.images[0].imageUrl : "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=400&q=80";
            const isCompleted = b.bookingStatus === "Completed" || b.bookingStatus === "Paid";
            
            return `
                <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:18px; display:flex; gap:20px; align-items:center; margin-bottom:16px;">
                    <img src="${img}" style="width:140px; height:90px; border-radius:var(--radius-sm); object-fit:cover;">
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <h4 style="font-size:1.15rem; font-weight:700;">${car ? car.year + ' ' + car.brand + ' ' + car.model : 'Vehicle'}</h4>
                                <div style="color:var(--text-muted); font-size:0.8rem; margin-top:2px;">Booking ID: #KJ-${b.id + 88400} • Handover: ${b.scheduledTimeSlot || '09:00 AM'}</div>
                            </div>
                            <span class="status-chip ${isCompleted ? 'status-active' : 'status-pending'}">
                                ${b.bookingStatus.toUpperCase()}
                            </span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:12px;">
                            <div style="font-size:1.2rem; font-weight:800; color:var(--accent-orange);">$${b.offerAmount.toLocaleString()}</div>
                            <div style="display:flex; gap:10px;">
                                <button class="btn btn-outline btn-sm" onclick="viewDigitalInvoice(${b.id})">📄 View Invoice</button>
                                ${!isCompleted ? `<button class="btn btn-primary btn-sm" onclick="openCheckoutModal(${car.id})">Complete Purchase</button>` : `<button class="btn btn-secondary btn-sm" onclick="openReviewModal(${car.sellerId}, ${car.id})">★ Leave Review</button>`}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error("Failed loading buyer bookings:", err);
    }
}

// Digital Invoice Viewer
async function viewDigitalInvoice(bookingId) {
    try {
        const res = await fetch(`${API.bookings}/${bookingId}/invoice`);
        const inv = await res.json();

        const modal = document.getElementById("invoice-modal");
        const container = document.getElementById("invoice-content-container");
        if (!modal || !container) return;

        container.innerHTML = `
            <div style="border-bottom: 2px solid var(--accent-orange); padding-bottom: 16px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2 style="font-weight:900; letter-spacing:1px; color:var(--accent-orange);">KARAJAK</h2>
                    <div style="font-size:0.8rem; color:var(--text-muted);">AI-POWERED AUTOMOTIVE COMMERCE</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:1.1rem; font-weight:700;">INVOICE ${inv.invoiceNumber}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${inv.issueDate}</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; font-size:0.85rem; margin-bottom: 24px;">
                <div>
                    <strong style="color:var(--text-muted); text-transform:uppercase;">Customer Details:</strong>
                    <div style="font-weight:600; font-size:1rem; margin-top:4px;">${inv.buyerName}</div>
                    <div>Email: ${inv.buyerEmail}</div>
                    <div>Phone: ${inv.buyerPhone}</div>
                </div>
                <div>
                    <strong style="color:var(--text-muted); text-transform:uppercase;">Vehicle & Handover:</strong>
                    <div style="font-weight:600; font-size:1rem; margin-top:4px;">${inv.vehicle}</div>
                    <div>VIN / Ref: ${inv.vin}</div>
                    <div>Location: ${inv.location}</div>
                </div>
            </div>

            <table class="data-table" style="margin-bottom: 24px;">
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>Qty</th>
                        <th style="text-align:right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Vehicle Purchase Price (${inv.vehicle})</td>
                        <td>1</td>
                        <td style="text-align:right;">$${inv.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>48-Point AI Inspection & Concierge Processing Fee</td>
                        <td>1</td>
                        <td style="text-align:right;">$${inv.processingFee.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Handover & Title Transfer Preparation</td>
                        <td>1</td>
                        <td style="text-align:right;">Included</td>
                    </tr>
                    <tr>
                        <td>Estimated Sales Tax & Regulatory Transfer (6%)</td>
                        <td>1</td>
                        <td style="text-align:right;">$${inv.taxes.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <div style="display:flex; justify-content:flex-end;">
                <div style="width:280px;">
                    <div class="summary-row total">
                        <span>Total Paid</span>
                        <span style="color:var(--accent-orange);">$${inv.totalAmount.toLocaleString()}</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px; text-align:right;">
                        Payment Method: ${inv.paymentMethod} • Txn: ${inv.transactionCode}
                    </div>
                </div>
            </div>

            <div style="margin-top: 30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:16px;">
                <span class="status-chip status-active">AUTHENTIC DIGITAL RECEIPT</span>
                <button class="btn btn-primary btn-sm" onclick="window.print()">🖨️ Print Invoice</button>
            </div>
        `;

        modal.classList.add("active");
    } catch (err) {
        console.error("Invoice retrieval failed:", err);
    }
}

function closeInvoiceModal() {
    const modal = document.getElementById("invoice-modal");
    if (modal) modal.classList.remove("active");
}

// Buyer-Seller Live Messaging Center (Figure 5.42 & 5.51)
async function loadMessagingCenter() {
    try {
        const res = await fetch(`${API.messages}/conversations?userId=${state.currentUser.id}`);
        const convos = await res.json();

        const pane = document.getElementById("conversations-list-pane");
        if (!pane) return;

        if (!convos || convos.length === 0) {
            pane.innerHTML = "<div style='padding:20px; color:var(--text-muted); text-align:center;'>No conversations yet.</div>";
            return;
        }

        pane.innerHTML = convos.map(c => `
            <div class="conversation-item ${c.otherUserId === state.activeConversationUserId ? 'active' : ''}" onclick="selectConversation(${c.otherUserId}, ${c.car ? c.car.id : 'null'})">
                <img src="${c.otherUserAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}" class="user-avatar" alt="${c.otherUserName}">
                <div style="flex:1; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="font-size:0.92rem; font-weight:700;">${c.otherUserName}</h4>
                        <span style="font-size:0.7rem; color:var(--text-muted);">${formatTimeAgo(c.lastMessageTime)}</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--accent-orange); margin:2px 0;">${c.car ? c.car.brand + ' ' + c.car.model : ''}</div>
                    <p style="font-size:0.8rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.lastMessage}</p>
                </div>
            </div>
        `).join("");

        // Load active thread
        loadChatThread(state.activeConversationUserId, state.activeConversationCarId);
    } catch (err) {
        console.error("Error loading conversations:", err);
    }
}

async function selectConversation(otherUserId, carId) {
    state.activeConversationUserId = otherUserId;
    state.activeConversationCarId = carId;
    loadMessagingCenter();
}

async function loadChatThread(otherUserId, carId) {
    try {
        const res = await fetch(`${API.messages}/thread?userId=${state.currentUser.id}&otherUserId=${otherUserId}&carId=${carId || ''}`);
        const data = await res.json();

        // Car header
        const carHeader = document.getElementById("chat-car-header-container");
        if (carHeader && data.carContext) {
            const c = data.carContext;
            carHeader.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${(c.images && c.images.length > 0) ? c.images[0].imageUrl : ''}" style="width:50px; height:36px; border-radius:4px; object-fit:cover;">
                    <div>
                        <div style="font-weight:700; font-size:0.92rem;">${c.year} ${c.brand} ${c.model}</div>
                        <div style="color:var(--accent-orange); font-size:0.82rem; font-weight:700;">$${c.price.toLocaleString()}</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary btn-sm" onclick="openCarDetails(${c.id})">View Ad</button>
                    <button class="btn btn-primary btn-sm" onclick="openCheckoutModal(${c.id})">Make Offer</button>
                </div>
            `;
        }

        // Messages list
        const list = document.getElementById("chat-messages-container");
        if (!list) return;

        list.innerHTML = data.messages.map(m => {
            const isMe = m.senderId === state.currentUser.id;
            return `
                <div class="chat-bubble ${isMe ? 'sent' : 'received'}">
                    <div>${m.content}</div>
                    <div style="font-size:0.68rem; opacity:0.6; margin-top:4px; text-align:right;">${formatTimeAgo(m.sentAt)}</div>
                </div>
            `;
        }).join("");

        list.scrollTop = list.scrollHeight;
    } catch (err) {
        console.error("Error loading chat thread:", err);
    }
}

async function sendChatMessage() {
    const input = document.getElementById("chat-reply-input");
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    input.value = "";

    try {
        await fetch(`${API.messages}/send?senderId=${state.currentUser.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                receiverId: state.activeConversationUserId,
                carId: state.activeConversationCarId,
                content: content
            })
        });

        loadChatThread(state.activeConversationUserId, state.activeConversationCarId);
    } catch (err) {
        console.error("Failed sending message:", err);
    }
}

function startChatWithSeller(sellerId, carId) {
    closeVehicleDetailsModal();
    state.activeConversationUserId = sellerId;
    state.activeConversationCarId = carId;
    showScreen("screen-messaging");
}

// Seller Dashboard (Figure 5.46)
async function loadSellerDashboard() {
    try {
        const res = await fetch(`${API.ai}/seller-insights?sellerId=${state.currentUser.id}`);
        const data = await res.json();
        const tipEl = document.getElementById("seller-ai-tip-text");
        if (tipEl) tipEl.innerText = data.insights;
    } catch (err) {
        console.warn("Seller insights error:", err);
    }
}

// Seller Listings Management (Figure 5.48)
async function loadSellerListingsTable() {
    const tbody = document.getElementById("seller-listings-tbody");
    if (!tbody) return;

    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Loading your inventory...</td></tr>";

    try {
        const res = await fetch(`${API.cars}/my-listings?sellerId=${state.currentUser.id}`);
        const listings = await res.json();

        if (!listings || listings.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:30px;'>No active listings. Click 'Add New Listing' to start selling!</td></tr>";
            return;
        }

        tbody.innerHTML = listings.map(car => `
            <tr>
                <td>
                    <img src="${(car.images && car.images.length > 0) ? car.images[0].imageUrl : ''}" style="width:70px; height:48px; border-radius:4px; object-fit:cover;">
                </td>
                <td>
                    <strong>${car.year} ${car.brand} ${car.model}</strong>
                    <div style="font-size:0.78rem; color:var(--text-muted);">${car.mileage.toLocaleString()} mi • ${car.transmission}</div>
                </td>
                <td style="font-weight:700;">$${car.price.toLocaleString()}</td>
                <td>
                    <span class="status-chip status-${car.status.toLowerCase()}">${car.status}</span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="openCarDetails(${car.id})">Preview</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSellerListing(${car.id})">Delete</button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("Seller listings error:", err);
    }
}

async function deleteSellerListing(carId) {
    if (!confirm("Are you sure you want to remove this vehicle listing from the platform?")) return;
    try {
        await fetch(`${API.cars}/${carId}?sellerId=${state.currentUser.id}`, { method: "DELETE" });
        showToast("Listing deleted successfully.");
        loadSellerListingsTable();
    } catch (err) {
        console.error("Delete failed:", err);
    }
}

// Seller Add New Listing (Figure 5.45)
async function submitNewVehicleListing(event) {
    event.preventDefault();
    const make = document.getElementById("new-car-make").value;
    const model = document.getElementById("new-car-model").value;
    const year = parseInt(document.getElementById("new-car-year").value, 10);
    const price = parseFloat(document.getElementById("new-car-price").value);
    const mileage = parseInt(document.getElementById("new-car-mileage").value, 10);
    const fuel = document.getElementById("new-car-fuel").value;
    const transmission = document.getElementById("new-car-transmission").value;
    const color = document.getElementById("new-car-color").value;
    const desc = document.getElementById("new-car-desc").value;
    const imgUrl = document.getElementById("new-car-img").value || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80";

    const payload = {
        brand: make,
        model: model,
        year: year,
        price: price,
        mileage: mileage,
        fuelType: fuel,
        transmission: transmission,
        color: color,
        location: "Amman, Jordan",
        description: desc,
        driveTrain: "AWD",
        images: [imgUrl]
    };

    try {
        const res = await fetch(`${API.cars}?sellerId=${state.currentUser.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        showToast("Vehicle Listing submitted! Sent to administration for policy verification.");
        showScreen("screen-seller-listings");
    } catch (err) {
        console.error("Listing creation failed:", err);
    }
}

// Seller Revenue & Sales Analytics (Figure 5.47)
async function loadSellerAnalytics() {
    // Analytics table loads smoothly
}

// Seller Booking Requests (Figure 5.52)
async function loadSellerBookingRequests() {
    const list = document.getElementById("seller-requests-container");
    if (!list) return;

    list.innerHTML = "<div style='text-align:center; padding:30px;'>Loading incoming buyer booking requests...</div>";

    try {
        const res = await fetch(`${API.bookings}/seller?sellerId=${state.currentUser.id}`);
        const requests = await res.json();

        if (!requests || requests.length === 0) {
            list.innerHTML = "<div style='text-align:center; padding:40px; color:var(--text-muted);'>No pending booking requests at this moment.</div>";
            return;
        }

        list.innerHTML = requests.map(r => `
            <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:20px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; gap:14px; align-items:center;">
                        <img src="${r.buyer?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">
                        <div>
                            <h4 style="font-weight:700;">${r.buyer?.fullName || 'Buyer'} ${r.buyer?.isVerified ? '✓ Verified' : ''}</h4>
                            <div style="font-size:0.8rem; color:var(--accent-orange); font-weight:700;">${r.car ? r.car.year + ' ' + r.car.brand + ' ' + r.car.model : 'Vehicle'}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.3rem; font-weight:800; color:var(--text-primary);">$${r.offerAmount.toLocaleString()}</div>
                        <span class="status-chip status-${r.bookingStatus.toLowerCase()}">${r.bookingStatus}</span>
                    </div>
                </div>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin:12px 0;">"${r.notes || 'Interested in vehicle inspection and scheduled handover.'}"</p>
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button class="btn btn-secondary btn-sm" onclick="respondBookingRequest(${r.id}, 'Declined')">Decline</button>
                    <button class="btn btn-primary btn-sm" onclick="respondBookingRequest(${r.id}, 'Approved')">Accept Request</button>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Seller requests error:", err);
    }
}

async function respondBookingRequest(bookingId, status) {
    try {
        await fetch(`${API.bookings}/${bookingId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status })
        });
        showToast(`Booking request marked as: ${status}`);
        loadSellerBookingRequests();
    } catch (err) {
        console.error("Booking response error:", err);
    }
}

// Administrator Dashboard & Subscreens (Figures 5.34 - 5.39)
async function loadAdminDashboard() {
    try {
        const res = await fetch(`${API.admin}/dashboard`);
        const stats = await res.json();

        document.getElementById("admin-stat-users").innerText = stats.totalUsers.toLocaleString();
        document.getElementById("admin-stat-listings").innerText = stats.activeListings.toLocaleString();
        document.getElementById("admin-stat-revenue").innerText = `$${(stats.totalRevenue / 1000000).toFixed(2)}M`;
        document.getElementById("admin-stat-reports").innerText = stats.pendingReports;
    } catch (err) {
        console.error("Admin dashboard stats error:", err);
    }
}

// Admin Listing Moderation (Figure 5.35)
async function loadAdminListingsModeration(status = "Pending") {
    const container = document.getElementById("admin-listings-container");
    if (!container) return;

    container.innerHTML = "<div style='text-align:center; padding:30px;'>Loading moderation queue...</div>";

    try {
        const res = await fetch(`${API.admin}/listings?status=${status}`);
        const listings = await res.json();

        if (!listings || listings.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">No ${status} listings found. All clear!</div>`;
            return;
        }

        container.innerHTML = listings.map(car => `
            <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; display:flex; gap:16px; align-items:center; margin-bottom:14px;">
                <img src="${(car.images && car.images.length > 0) ? car.images[0].imageUrl : ''}" style="width:120px; height:80px; border-radius:var(--radius-sm); object-fit:cover;">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <h4 style="font-weight:700;">${car.year} ${car.brand} ${car.model}</h4>
                            <div style="font-size:0.8rem; color:var(--text-muted);">Seller: ${car.seller?.fullName || 'Seller'} • ${car.mileage.toLocaleString()} mi • ${car.fuelType}</div>
                        </div>
                        <div style="font-size:1.15rem; font-weight:800; color:var(--accent-orange);">$${car.price.toLocaleString()}</div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                        <button class="btn btn-outline btn-sm" onclick="openCarDetails(${car.id})">Inspect Listing</button>
                        <button class="btn btn-danger btn-sm" onclick="moderateListingAction(${car.id}, 'reject')">Reject</button>
                        <button class="btn btn-success btn-sm" onclick="moderateListingAction(${car.id}, 'approve')">Approve Listing</button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Listing moderation error:", err);
    }
}

async function moderateListingAction(carId, action) {
    let reason = null;
    if (action === "reject") {
        reason = prompt("Enter listing rejection reason:", "Low resolution images / inaccurate VIN description");
        if (!reason) return;
    }

    try {
        await fetch(`${API.admin}/listings/${carId}/moderate`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: action, reason: reason })
        });
        showToast(`Listing ${action}d successfully.`);
        loadAdminListingsModeration("Pending");
    } catch (err) {
        console.error("Moderation action failed:", err);
    }
}

// Admin Users Management (Figure 5.39)
async function loadAdminUsers() {
    const tbody = document.getElementById("admin-users-tbody");
    if (!tbody) return;

    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Loading registered accounts...</td></tr>";

    try {
        const res = await fetch(`${API.admin}/users`);
        const users = await res.json();

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${u.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                        <div>
                            <strong>${u.fullName}</strong>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="status-chip status-${u.role.toLowerCase()}">${u.role}</span></td>
                <td>${u.isVerified ? '✓ Verified' : '<span style="color:var(--text-muted);">Unverified</span>'}</td>
                <td><span class="status-chip ${u.isActive ? 'status-active' : 'status-rejected'}">${u.isActive ? 'Active' : 'Suspended'}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="toggleUserActiveState(${u.id})">${u.isActive ? 'Suspend' : 'Activate'}</button>
                    ${!u.isVerified && u.role === 'Seller' ? `<button class="btn btn-success btn-sm" onclick="verifySellerAccount(${u.id})">Verify</button>` : ''}
                </td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("Admin users error:", err);
    }
}

async function toggleUserActiveState(userId) {
    try {
        const res = await fetch(`${API.admin}/users/${userId}/toggle-status`, { method: "PATCH" });
        const data = await res.json();
        showToast(data.message);
        loadAdminUsers();
    } catch (err) {
        console.error("Toggle user error:", err);
    }
}

async function verifySellerAccount(userId) {
    try {
        const res = await fetch(`${API.admin}/users/${userId}/verify-seller`, { method: "PATCH" });
        const data = await res.json();
        showToast(data.message);
        loadAdminUsers();
    } catch (err) {
        console.error("Verify seller error:", err);
    }
}

// Admin Transactions Monitor (Figure 5.38)
async function loadAdminTransactions() {
    const tbody = document.getElementById("admin-txns-tbody");
    if (!tbody) return;

    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Loading financial ledger...</td></tr>";

    try {
        const res = await fetch(`${API.admin}/transactions`);
        const txns = await res.json();

        tbody.innerHTML = txns.map(t => {
            const car = t.booking?.car;
            const buyer = t.booking?.buyer;
            return `
                <tr>
                    <td><code>${t.transactionCode}</code></td>
                    <td>${new Date(t.transactionDate).toLocaleDateString()}</td>
                    <td>${car ? car.year + ' ' + car.brand + ' ' + car.model : 'Automotive Handover'}</td>
                    <td>${buyer ? buyer.fullName : 'Verified Client'}</td>
                    <td style="font-weight:700;">$${t.amount.toLocaleString()}</td>
                    <td><span class="status-chip status-${t.paymentStatus.toLowerCase()}">${t.paymentStatus}</span></td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Admin txns error:", err);
    }
}

// Admin Reports and Complaints (Figure 5.36)
async function loadAdminReports() {
    const container = document.getElementById("admin-reports-container");
    if (!container) return;

    try {
        const res = await fetch(`${API.admin}/reports`);
        const reports = await res.json();

        if (!reports || reports.length === 0) {
            container.innerHTML = "<div style='text-align:center; padding:30px; color:var(--text-muted);'>No active compliance reports.</div>";
            return;
        }

        container.innerHTML = reports.map(r => `
            <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:18px; margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span class="status-chip status-${r.priority === 'Urgent' ? 'rejected' : (r.priority === 'High Priority' ? 'pending' : 'active')}">${r.priority}</span>
                        <strong style="margin-left:10px; font-size:1rem;">${r.targetTitle}</strong>
                    </div>
                    <span style="font-size:0.75rem; color:var(--text-muted);">Reporter: ${r.reporter?.fullName || 'System Bot'}</span>
                </div>
                <p style="font-size:0.88rem; color:var(--text-secondary); margin:10px 0; background:rgba(0,0,0,0.2); padding:10px; border-radius:var(--radius-sm);">${r.reason}</p>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button class="btn btn-outline btn-sm" onclick="actionAdminReport(${r.id}, 'Dismiss')">Dismiss</button>
                    ${r.targetType === 'Listing' ? `<button class="btn btn-danger btn-sm" onclick="actionAdminReport(${r.id}, 'RemoveListing')">Remove Listing</button>` : `<button class="btn btn-danger btn-sm" onclick="actionAdminReport(${r.id}, 'SuspendUser')">Suspend User</button>`}
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Admin reports error:", err);
    }
}

async function actionAdminReport(reportId, action) {
    try {
        await fetch(`${API.admin}/reports/${reportId}/action`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: action })
        });
        showToast(`Report action executed: ${action}`);
        loadAdminReports();
    } catch (err) {
        console.error("Report action error:", err);
    }
}

// Admin System Settings (Figure 5.37)
async function loadAdminSettings() {
    try {
        const res = await fetch(`${API.admin}/settings`);
        const s = await res.json();
        document.getElementById("set-platform-name").value = s.platformName || "KARAJAK AI";
        document.getElementById("set-support-email").value = s.supportEmail || "support@karajak.ai";
        document.getElementById("set-maintenance-mode").checked = s.maintenanceMode;
        document.getElementById("set-ai-engine").checked = s.aiValuationEngine;
    } catch (err) {
        console.error("Admin settings error:", err);
    }
}

async function saveAdminSettings(event) {
    event.preventDefault();
    const payload = {
        platformName: document.getElementById("set-platform-name").value,
        supportEmail: document.getElementById("set-support-email").value,
        maintenanceMode: document.getElementById("set-maintenance-mode").checked,
        aiValuationEngine: document.getElementById("set-ai-engine").checked
    };

    try {
        await fetch(`${API.admin}/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        showToast("System settings saved successfully.");
    } catch (err) {
        console.error("Save settings error:", err);
    }
}

// Notifications Refresh
async function refreshNotifications() {
    if (!state.currentUser) return;
    try {
        const res = await fetch(`${API.notifications}?userId=${state.currentUser.id}`);
        const data = await res.json();
        const badge = document.getElementById("notifications-badge");
        if (badge) {
            badge.innerText = data.unreadCount;
            badge.style.display = data.unreadCount > 0 ? "inline-flex" : "none";
        }

        const dropdown = document.getElementById("notifications-dropdown-list");
        if (dropdown) {
            dropdown.innerHTML = (data.notifications || []).map(n => `
                <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); ${n.isRead ? 'opacity:0.7;' : 'background:rgba(249,115,22,0.06);'}">
                    <div style="font-weight:700; font-size:0.85rem;">${n.title}</div>
                    <div style="font-size:0.78rem; color:var(--text-secondary); margin:2px 0;">${n.content}</div>
                    <div style="font-size:0.68rem; color:var(--text-muted);">${formatTimeAgo(n.createdAt)}</div>
                </div>
            `).join("");
        }
    } catch (err) {
        console.warn("Notifications refresh error:", err);
    }
}

function toggleNotificationsDropdown() {
    const el = document.getElementById("notifications-dropdown-menu");
    if (el) el.classList.toggle("active");
}

// Floating AI Assistant
function toggleAiAssistantWidget() {
    const box = document.getElementById("ai-assistant-chatbox");
    if (box) box.classList.toggle("active");
}

async function sendAiAssistantQuestion() {
    const input = document.getElementById("ai-assistant-input");
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = "";

    const container = document.getElementById("ai-assistant-messages");
    if (!container) return;

    container.innerHTML += `
        <div class="chat-bubble sent" style="font-size:0.85rem; padding:8px 12px;">${text}</div>
        <div class="chat-bubble received" style="font-size:0.85rem; padding:8px 12px;" id="ai-loading-bubble">
            <span style="color:var(--accent-orange);">✨ KARAJAK AI is thinking...</span>
        </div>
    `;
    container.scrollTop = container.scrollHeight;

    try {
        const res = await fetch(`${API.ai}/assistant`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        const loadEl = document.getElementById("ai-loading-bubble");
        if (loadEl) loadEl.remove();

        container.innerHTML += `
            <div class="chat-bubble received" style="font-size:0.85rem; padding:8px 12px;">
                ${data.reply}
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error("AI assistant query error:", err);
    }
}

// Review Submission Modal
function openReviewModal(sellerId, carId) {
    state.reviewTarget = { sellerId, carId };
    const modal = document.getElementById("review-modal");
    if (modal) modal.classList.add("active");
}

function closeReviewModal() {
    const modal = document.getElementById("review-modal");
    if (modal) modal.classList.remove("active");
}

async function submitReviewAction(event) {
    event.preventDefault();
    const rating = parseInt(document.getElementById("review-rating-select").value, 10);
    const comment = document.getElementById("review-comment-input").value;

    try {
        await fetch(`${API.reviews}?buyerId=${state.currentUser.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sellerId: state.reviewTarget.sellerId,
                carId: state.reviewTarget.carId,
                rating: rating,
                comment: comment
            })
        });
        showToast("Review submitted successfully! Thank you for rating the seller.");
        closeReviewModal();
    } catch (err) {
        console.error("Review error:", err);
    }
}

// Authentication Modals
function openAuthModal(mode = "login") {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;

    document.getElementById("auth-login-tab").style.display = mode === "login" ? "block" : "none";
    document.getElementById("auth-register-tab").style.display = mode === "register" ? "block" : "none";
    document.getElementById("auth-admin-tab").style.display = mode === "admin" ? "block" : "none";
    document.getElementById("auth-2fa-step").style.display = "none";

    modal.classList.add("active");
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("active");
}

// Toast Notification
function showToast(message) {
    const toast = document.getElementById("app-toast");
    if (!toast) return;

    toast.innerText = message;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3500);
}

// Helper: Format Time Ago
function formatTimeAgo(dateStr) {
    if (!dateStr) return "recently";
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Setup Event Handlers
function setupEventHandlers() {
    // Search input enter key
    const aiInput = document.getElementById("home-ai-search-input");
    if (aiInput) {
        aiInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") executeAiSearch();
        });
    }

    const marketInput = document.getElementById("ai-search-input");
    if (marketInput) {
        marketInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") executeAiSearch();
        });
    }

    // Fuel filter chips
    document.querySelectorAll(".filter-fuel").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".filter-fuel").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            loadMarketplaceCars();
        });
    });

    // Time slot buttons in checkout
    document.querySelectorAll(".time-slot-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".time-slot-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Payment tab options in checkout
    document.querySelectorAll(".payment-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".payment-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });
}
