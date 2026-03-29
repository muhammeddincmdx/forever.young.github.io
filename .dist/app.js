const grid = document.getElementById("chart-grid");
const lastUpdatedEl = document.getElementById("last-updated");
const LOCAL_DATA_URL = "./data/charts.json";
const REFRESH_MS = 5 * 60 * 1000;

let isLoading = false;
let hasRenderedOnce = false;
let lastRenderedVersion = "";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStatus(message, isError = false) {
  grid.innerHTML = `
    <article class="card card--status${isError ? " card--error" : ""}">
      <p class="card__title">${escapeHtml(message)}</p>
    </article>
  `;
}

function formatDate(iso) {
  if (!iso) return "bilinmiyor";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "bilinmiyor";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function youtubeSearchUrl(entry) {
  const query = `${entry.artist || ""} ${entry.title || ""}`.trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function createEntryMarkup(entry) {
  const youtubeUrl = youtubeSearchUrl(entry);

  return `
    <li class="entry">
      <a class="entry__link" href="${escapeHtml(youtubeUrl)}" target="_blank" rel="noopener noreferrer" title="YouTube'da ac">
        <span class="entry__rank">${escapeHtml(entry.rank)}</span>
        <div class="entry__text">
          <p class="entry__title">${escapeHtml(entry.title)}</p>
          <p class="entry__artist">${escapeHtml(entry.artist)}</p>
        </div>
      </a>
    </li>
  `;
}

function createChartMarkup(chart) {
  const entries = Array.isArray(chart.entries) ? chart.entries : [];
  const platform = chart.platform ? `${chart.platform} - ` : "";

  return `
    <article class="card">
      <div class="card__top">
        <span class="pill">${escapeHtml(platform + (chart.name || "Chart"))}</span>
      </div>
      <ol class="entries">
        ${entries.map(createEntryMarkup).join("")}
      </ol>
    </article>
  `;
}

function validatePayload(payload) {
  if (!payload || !Array.isArray(payload.charts) || payload.charts.length === 0) {
    throw new Error("Gecerli chart verisi bulunamadi");
  }

  const allEntries = payload.charts.flatMap((chart) => chart.entries || []);
  if (allEntries.length === 0) {
    throw new Error("Chart icinde sarki bulunamadi");
  }
}

function payloadVersion(payload) {
  return `${payload.generatedAt || "na"}:${payload.charts?.length || 0}`;
}

function renderCharts(payload) {
  validatePayload(payload);

  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Veri guncelleme tarihi: ${formatDate(payload.generatedAt)}`;
  }

  grid.innerHTML = payload.charts.map(createChartMarkup).join("");
}

async function fetchJson(url) {
  const cacheBustUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
  const response = await fetch(cacheBustUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${url}`);
  }

  return response.json();
}

async function loadCharts({ silent = false } = {}) {
  if (isLoading) return;
  isLoading = true;

  if (!silent && !hasRenderedOnce) {
    renderStatus("Listeler yukleniyor...");
  }

  try {
    const localPayload = await fetchJson(LOCAL_DATA_URL);
    const nextVersion = payloadVersion(localPayload);

    if (!hasRenderedOnce || nextVersion !== lastRenderedVersion) {
      renderCharts(localPayload);
      lastRenderedVersion = nextVersion;
      hasRenderedOnce = true;
    }
  } catch (error) {
    console.error("Yerel veri alinamadi:", error);
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = "Veri guncelleme tarihi: hata";
    }

    if (!hasRenderedOnce) {
      renderStatus("Veri dosyasi yuklenemedi. data/charts.json dosyasini ve deploy yolunu kontrol et.", true);
    }
  } finally {
    isLoading = false;
  }
}

function startAutoRefresh() {
  setInterval(() => {
    loadCharts({ silent: true });
  }, REFRESH_MS);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadCharts({ silent: true });
    }
  });

  window.addEventListener("focus", () => {
    loadCharts({ silent: true });
  });
}

loadCharts();
startAutoRefresh();
