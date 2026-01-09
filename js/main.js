// Lightweight data simulator for demo visuals only (no secrets exposed).
const sample = {
  points: [],
  quick: [
    { label: "Auto mode", value: "Enabled" },
    { label: "Safety", value: "Active" },
    { label: "Data latency", value: "< 1.2s" },
    { label: "Uptime (30d)", value: "99.97%" }
  ]
};

function initSampleData() {
  const now = Date.now();
  for (let i = 0; i < 40; i++) {
    sample.points.push({
      t: now - (40 - i) * 2000,
      inverter: 2.4 + Math.sin(i / 3) * 0.6 + Math.random() * 0.1,
      grid: -0.6 + Math.cos(i / 4) * 0.2 + Math.random() * 0.05,
      load: 1.8 + Math.sin(i / 5) * 0.4 + Math.random() * 0.1,
      breakerClosed: Math.random() > 0.08
    });
  }
}

function animateLive() {
  const canvas = document.getElementById("sparkline");
  const ctx = canvas.getContext("2d");

  function render() {
    const p = sample.points.slice(-40);
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const values = p.flatMap(x => [x.inverter, x.grid, x.load]);
    const min = Math.min(...values) - 0.2;
    const max = Math.max(...values) + 0.2;
    const scaleY = v => height - ((v - min) / (max - min)) * (height - 20) - 10;
    const scaleX = idx => (idx / Math.max(1, p.length - 1)) * (width - 20) + 10;

    const series = [
      { key: "inverter", color: "#4fe1c1" },
      { key: "load", color: "#7aa0ff" },
      { key: "grid", color: "#f4bf4f" }
    ];

    series.forEach(({ key, color }) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      p.forEach((pt, i) => {
        const x = scaleX(i);
        const y = scaleY(pt[key]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }

  function tick() {
    const last = sample.points[sample.points.length - 1];
    const next = {
      t: Date.now(),
      inverter: last.inverter + (Math.random() - 0.5) * 0.2,
      grid: last.grid + (Math.random() - 0.5) * 0.1,
      load: last.load + (Math.random() - 0.5) * 0.15,
      breakerClosed: Math.random() > 0.05
    };
    sample.points.push(next);
    if (sample.points.length > 100) sample.points.shift();
    updateTiles(next);
    render();
  }

  updateTiles(sample.points[sample.points.length - 1]);
  render();
  setInterval(tick, 2000);
}

function updateTiles(latest) {
  const fmt = v => `${v.toFixed(2)} kW`;
  animateNumber(document.getElementById("stat-inverter"), latest.inverter, " kW");
  animateNumber(document.getElementById("stat-grid"), Math.abs(latest.grid), " kW");
  animateNumber(document.getElementById("stat-load"), latest.load, " kW");

  animateNumber(document.getElementById("tile-inverter"), latest.inverter, " kW");
  animateNumber(document.getElementById("tile-grid"), Math.abs(latest.grid), " kW");
  document.getElementById("tile-load-note")?.remove(); // not used; kept for layout fallback
  document.getElementById("tile-breaker").textContent = latest.breakerClosed ? "Closed" : "Open";
  document.getElementById("tile-breaker-note").textContent = latest.breakerClosed ? "Normal operation" : "Awaiting close";
  document.getElementById("tile-mode").textContent = "Auto";
  document.getElementById("tile-mode-note").textContent = "AI adjusting within safe band";
  document.getElementById("tile-inverter-note").textContent = "Updated just now";
  document.getElementById("tile-grid-note").textContent = "Within target band";
}

function renderQuickStats() {
  const list = document.getElementById("quick-stats");
  list.innerHTML = "";
  sample.quick.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.label}: ${item.value}`;
    list.appendChild(li);
  });
}

function animateNumber(el, target, suffix = "", duration = 600) {
  if (!el) return;
  const start = parseFloat(el.dataset.prev || "0");
  const diff = target - start;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
    const val = start + diff * eased;
    el.textContent = `${val.toFixed(2)}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
    else {
      el.dataset.prev = target.toFixed(2);
      el.classList.add("glow");
      setTimeout(() => el.classList.remove("glow"), 400);
    }
  }
  requestAnimationFrame(step);
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  items.forEach(el => obs.observe(el));
}

function initProgramSlider() {
  const slider = document.getElementById("program-slider");
  const dotsWrap = document.getElementById("program-dots");
  if (!slider || !dotsWrap) return;

  const track = slider.querySelector(".slider-track");
  const slides = Array.from(track.children);
  const prev = slider.querySelector(".slider-btn.prev");
  const next = slider.querySelector(".slider-btn.next");
  let idx = 0;
  let autoTimer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function goTo(n) {
    idx = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dotsWrap.querySelectorAll("button").forEach((btn, i) => btn.classList.toggle("active", i === idx));
  }
  goTo(0);

  prev.addEventListener("click", () => goTo(idx - 1));
  next.addEventListener("click", () => goTo(idx + 1));

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => goTo(idx + 1), 4000);
  }
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }
  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);
  startAuto();

  // lightbox on click
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxBackdrop = document.getElementById("lightbox-backdrop");
  const lightboxClose = document.querySelector(".lightbox-close");
  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Program detail";
    lightbox.classList.add("show");
  }
  function closeLightbox() {
    if (lightbox) lightbox.classList.remove("show");
  }
  slides.forEach(slide => {
    const img = slide.querySelector("img");
    img.addEventListener("click", () => openLightbox(img.src, img.alt));
    img.dataset.lightbox = "program";
  });
  if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeLightbox);
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
}

function initProductLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxBackdrop = document.getElementById("lightbox-backdrop");
  const lightboxClose = document.querySelector(".lightbox-close");
  if (!lightbox || !lightboxImg) return;
  const open = img => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || "View";
    lightbox.classList.add("show");
  };
  document.querySelectorAll("[data-lightbox]").forEach(img => {
    img.addEventListener("click", () => open(img));
  });
  const closeFn = () => lightbox.classList.remove("show");
  if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeFn);
  if (lightboxClose) lightboxClose.addEventListener("click", closeFn);
}

function initI18n() {
  const toggle = document.getElementById("lang-toggle");
  if (!toggle) return;
  const dict = {
    en: {
      "brand-sub": "Energy Monitoring & Control",
      "nav-overview": "Overview",
      "nav-product": "Product",
      "nav-programs": "Programs",
      "nav-live": "Live View",
      "nav-features": "Features",
      "nav-demo": "Demo",
      "nav-contact": "Contact",
      "cta-book-demo": "Book a Demo",
      "hero-eyebrow": "Your Site’s Intelligent Energy Brain",
      "hero-title": "AI that keeps your power stable, efficient, and future-ready.",
      "hero-lede": "Real-time visibility, AI-driven automation, and adaptive decisions that keep your energy system steady without manual tuning.",
      "btn-view-demo": "View Live Demo",
      "btn-see-capabilities": "See Capabilities",
      "btn-talk-sales": "Talk to sales",
      "product-label": "VoltMind AI 5000",
      "product-title": "Purpose-built for resilient energy sites",
      "product-subtext-1": "A compact AI controller that ships with live monitoring, self-learning automation, and zero-setup dashboards. Your site’s intelligent energy brain — always learning, always optimizing, always safe.",
      "product-subtext-2": "Simple web configure: plug a network cable into VoltMind AI 5000, open your assigned IP in a browser, and finish the guided setup in minutes.",
      "product-subtext-3": "Not seeing your device? We support custom integration. VoltMind AI works with most industrial devices via RS485 — including Schneider Electric, ABB, Siemens, Eaton, Delta, Fronius, GoodWe, Solis, Ginlong, Huawei, Growatt, Deye, SMA, Kaco, Sungrow, and more. Share your RS485 protocol guide — we’ll configure it for you.",
      "programs-label": "AI-Powered Control Programs",
      "programs-title": "AI-Powered Control Programs (8 presets)",
      "programs-subtext": "AI-driven charge/discharge presets with built-in safety guardrails. Each program adapts to real-time price, weather, and load — no manual intervention needed.",
      "programs-discharge": "⚡ DISCHARGE (5 MODES) — Optimize Energy Use & Reduce Costs",
      "programs-charge": "🔋 CHARGE (3 MODES) — Replenish Battery Smartly",
      "programs-microcopy": "Each AI preset respects inverter limits, export rules, and time windows — while continuously learning to optimize cost and efficiency.",
      "live-label": "Live View",
      "live-title": "Operational status at a glance",
      "live-subtext": "A live snapshot keeps your team aligned on what the system is doing right now.",
      "features-label": "Capabilities",
      "features-title": "Built for reliable, safe energy control",
      "feat-1-title": "AI Decision Engine",
      "feat-1-body": "Learns from historical data and real-time signals to make optimal charge/discharge decisions — no human intervention required.",
      "feat-2-title": "Live dashboards",
      "feat-2-body": "Curated panels for power, energy, and device health with no manual setup.",
      "feat-3-title": "Auto control with safety",
      "feat-3-body": "Adjusts power automatically while respecting export limits and device constraints.",
      "feat-4-title": "Alerts & logging",
      "feat-4-body": "AI log stream plus guardrail alerts for fast incident response.",
      "feat-5-title": "Map & multi-device",
      "feat-5-body": "Site-aware views with flexible device groups and persistent map settings.",
      "feat-6-title": "Fast rollout",
      "feat-6-body": "Provisioning scripts that ship dashboards, datasources, and runtime config.",
      "feat-7-title": "Secure by design",
      "feat-7-body": "Least-privilege tokens for data, no control exposed on public pages.",
      "demo-label": "Live Demo",
      "demo-title": "See it in action",
      "demo-subtext": "Watch a live walk-through of the dashboards, automation flows, and safety controls.",
      "cta-label": "Get started",
      "cta-title": "Ready to explore VoltMind?",
      "cta-subtext": "Book a live session and we’ll tailor a walkthrough for your site.",
      "cta-btn-session": "Book a Session",
      "cta-btn-schedule": "Schedule online",
      "footer-body": "Reliable energy automation for modern sites.",
      "footer-note": "Demo view is read-only. Control actions are disabled in this experience."
    },
    zh: {
      "brand-sub": "能源監測與控制",
      "nav-overview": "總覽",
      "nav-product": "產品",
      "nav-programs": "控制方案",
      "nav-live": "即時視圖",
      "nav-features": "功能",
      "nav-demo": "示範",
      "nav-contact": "聯絡",
      "cta-book-demo": "預約示範",
      "hero-eyebrow": "您的場站智能能源大腦",
      "hero-title": "AI 讓功率更穩、更省、更前瞻。",
      "hero-lede": "即時可視化、AI 自動化與自適應決策，穩住系統，不用人工微調。",
      "btn-view-demo": "觀看示範",
      "btn-see-capabilities": "查看功能",
      "btn-talk-sales": "聯絡銷售",
      "product-label": "VoltMind AI 5000",
      "product-title": "為韌性場站而生",
      "product-subtext-1": "內建監控、自學自動化與免設定儀表板。您的智能能源大腦，持續學習、優化且保持安全。",
      "product-subtext-2": "簡易 Web 設定：插上網線，打開瀏覽器進入指派 IP，跟著引導幾分鐘完成設定。",
      "product-subtext-3": "找不到您的設備？我們支持 RS485 自訂整合：Schneider、ABB、Siemens、Eaton、Delta、Fronius、GoodWe、Solis、Ginlong、Huawei、Growatt、Deye、SMA、Kaco、Sungrow 等。提供協議手冊，我們替您配置。",
      "programs-label": "AI 控制方案",
      "programs-title": "AI 控制方案（8 組預設）",
      "programs-subtext": "AI 驅動的充放電預設，內建安全護欄。依即時電價、天氣與負載自動調整，無需人工介入。",
      "programs-discharge": "⚡ 放電（5 模式）— 最佳化用電並降低成本",
      "programs-charge": "🔋 充電（3 模式）— 聰明補能",
      "programs-microcopy": "每個 AI 模式都遵守逆變器限制、出口規則與時間窗，並持續學習以優化成本與效率。",
      "live-label": "即時視圖",
      "live-title": "一眼掌握營運狀態",
      "live-subtext": "即時快照，讓團隊同步了解系統狀態。",
      "features-label": "功能",
      "features-title": "為可靠、安全的能源控制而設計",
      "feat-1-title": "AI 決策引擎",
      "feat-1-body": "從歷史與即時訊號學習，做出最佳充放電決策 — 無需人工介入。",
      "feat-2-title": "即時儀表板",
      "feat-2-body": "電力、能源、設備健康面板，零手動配置。",
      "feat-3-title": "安全的自動控制",
      "feat-3-body": "自動調節功率，同時遵守出口與設備限制。",
      "feat-4-title": "告警與日誌",
      "feat-4-body": "AI 日誌串流與護欄告警，快速回應事件。",
      "feat-5-title": "地圖與多設備",
      "feat-5-body": "場址視圖、裝置分組與持久化地圖設定。",
      "feat-6-title": "快速部署",
      "feat-6-body": "安裝腳本自動配置儀表板、資料源與運行設定。",
      "feat-7-title": "安全設計",
      "feat-7-body": "最小權限資料存取，公開頁面不提供控制。",
      "demo-label": "示範",
      "demo-title": "實際體驗",
      "demo-subtext": "觀看儀表板、自動化與安全流程的現場演示。",
      "cta-label": "立即開始",
      "cta-title": "準備好體驗 VoltMind 嗎？",
      "cta-subtext": "預約專場，我們依您的場站客製導覽。",
      "cta-btn-session": "預約會談",
      "cta-btn-schedule": "線上排程",
      "footer-body": "為現代場站提供可靠的能源自動化。",
      "footer-note": "示範僅供查看，控制功能已停用。"
    }
  };

  function setLang(lang) {
    const map = dict[lang];
    if (!map) return;
    document.querySelectorAll("[data-i18n]").forEach(node => {
      const key = node.getAttribute("data-i18n");
      if (map[key]) node.textContent = map[key];
    });
    toggle.textContent = lang === "en" ? "中文" : "EN";
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "zh-Hant");
  }

  let current = "en";
  setLang(current);
  toggle.addEventListener("click", () => {
    current = current === "en" ? "zh" : "en";
    setLang(current);
  });
}

function initModeModal() {
  const modal = document.getElementById("mode-modal");
  const backdrop = document.getElementById("mode-modal-backdrop");
  const closeBtn = document.querySelector(".modal-close");
  const titleEl = document.getElementById("mode-modal-title");
  const bodyEl = document.getElementById("mode-modal-body");
  if (!modal || !titleEl || !bodyEl) return;

  const info = {
    "auto-percent": {
      title: "AUTO: Percentage mode (%)",
      body: "Automatically discharges a fixed percentage of battery capacity during peak hours — ideal for predictable load patterns. Set your target % and AI handles the rest."
    },
    "target-grid": {
      title: "Auto: Target grid power (W)",
      body: "Discharges to maintain a specific grid import level. Perfect when you want to cap utility draw; AI adjusts output dynamically as load changes."
    },
    "manual": {
      title: "MANUAL: Manual output (W)",
      body: "Set a fixed discharge power (e.g., 50kW) for full control. Ideal for testing, maintenance, or events where you need precise output."
    },
    "ai-dynamic": {
      title: "🤖 AI: Dynamic (price/solar)",
      body: "The smartest mode — AI analyzes real-time electricity price and solar forecast to decide when to discharge, aiming for the best cost savings."
    },
    "off-discharge": {
      title: "OFF: No Discharge",
      body: "Safely disables all discharge. Useful for maintenance or preserving battery; safety rules stay active to prevent over-discharge."
    },
    "ai-charge": {
      title: "🤖 AI: Dynamic (price/solar) – charge",
      body: "Charges when electricity is cheapest and/or solar is highest. AI learns your site and backs off when load rises to avoid spikes."
    },
    "time-charge": {
      title: "TIME: Time-based charge",
      body: "Schedule charging in off-peak windows (e.g., 00:00–06:00). Simple and reliable for fixed tariffs or TOU pricing."
    },
    "off-charge": {
      title: "OFF: No charge",
      body: "Disables charging; battery stays as-is until you re-enable. Useful for maintenance or avoiding grid draw."
    }
  };

  function open(key) {
    const item = info[key] || {};
    const customTitle = this && this.dataset ? this.dataset.title : null;
    const customDesc = this && this.dataset ? this.dataset.desc : null;
    const title = customTitle || item.title || key;
    const body = customDesc || item.body || "";
    titleEl.textContent = title;
    bodyEl.textContent = body;
    modal.classList.add("show");
  }
  function close() {
    modal.classList.remove("show");
  }

  // direct binding
  document.querySelectorAll(".mode-link").forEach(btn => {
    btn.addEventListener("click", function () { open.call(this, btn.dataset.mode); });
  });
  // delegated fallback (handles future DOM updates)
  document.addEventListener("click", e => {
    const target = e.target.closest(".mode-link");
    if (target && target.dataset.mode) {
      e.preventDefault();
      open.call(target, target.dataset.mode);
    }
  });

  if (backdrop) backdrop.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);
}

window.addEventListener("DOMContentLoaded", () => {
  initSampleData();
  renderQuickStats();
  animateLive();
  setupReveal();
  initProgramSlider();
  initProductLightbox();
  initI18n();
  initModeModal();
  initLiveVideos();
});

// Fallback: rerun init after load in case DOMContentLoaded was late
window.addEventListener("load", () => {
  initProgramSlider();
  initProductLightbox();
  initModeModal();
});

function initLiveVideos() {
  document.querySelectorAll(".live-videos video").forEach(v => {
    v.playbackRate = 2.0;
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    // restart if paused by browser policy
    const ensurePlay = () => v.paused && v.play().catch(() => {});
    v.addEventListener("pause", ensurePlay);
    ensurePlay();
  });
}
