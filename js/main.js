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
  document.getElementById("stat-inverter").textContent = fmt(latest.inverter);
  document.getElementById("stat-grid").textContent = fmt(Math.abs(latest.grid));
  document.getElementById("stat-load").textContent = fmt(latest.load);

  document.getElementById("tile-inverter").textContent = fmt(latest.inverter);
  document.getElementById("tile-grid").textContent = fmt(Math.abs(latest.grid));
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

window.addEventListener("DOMContentLoaded", () => {
  initSampleData();
  renderQuickStats();
  animateLive();
});
