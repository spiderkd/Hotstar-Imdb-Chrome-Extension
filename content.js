// Replace with your own OMDb API key
const API_KEY = "f0304025";
// ===== CONFIG =====

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const IMAGE_SELECTOR = 'img[data-testid="image-element"][alt]'; // Hotstar example selector
// ===================

// In-memory maps
const ratingCache = new Map(); // title -> { imdb, rt, ts }
const pendingRequests = new Map(); // title -> Promise

// Load cache from localStorage
try {
  const raw = localStorage.getItem("hotstar_imdb_cache_v1");
  if (raw) {
    const obj = JSON.parse(raw);
    Object.entries(obj).forEach(([title, val]) => {
      // keep only not-expired entries
      if (Date.now() - val.ts < CACHE_TTL_MS) ratingCache.set(title, val);
    });
  }
} catch (e) {
  console.warn("Cache load failed:", e);
}

// Save cache periodically + on page unload
function saveCacheToStorage() {
  try {
    const obj = {};
    ratingCache.forEach((v, k) => (obj[k] = v));
    localStorage.setItem("hotstar_imdb_cache_v1", JSON.stringify(obj));
  } catch (e) {
    console.warn("Cache save failed:", e);
  }
}
window.addEventListener("beforeunload", saveCacheToStorage);
setInterval(saveCacheToStorage, 1000 * 30); // every 30s

// Fetching (with pending dedupe)
async function fetchRating(title) {
  if (!title) return null;
  // cached?
  const cached = ratingCache.get(title);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached;

  if (pendingRequests.has(title)) return pendingRequests.get(title);

  const p = (async () => {
    try {
      const url = `https://www.omdbapi.com/?t=${encodeURIComponent(
        title
      )}&apikey=${API_KEY}&tomatoes=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.Response === "True") {
        const imdb =
          data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : null;
        const rtObj = (data.Ratings || []).find(
          (r) => r.Source === "Rotten Tomatoes"
        );
        const rt = rtObj ? rtObj.Value : null;
        const obj = { imdb, rt, ts: Date.now() };
        ratingCache.set(title, obj);
        return obj;
      } else {
        const obj = { imdb: null, rt: null, ts: Date.now() }; // cache negative result briefly
        ratingCache.set(title, obj);
        return obj;
      }
    } catch (err) {
      console.error("OMDb fetch error for", title, err);
      throw err;
    } finally {
      pendingRequests.delete(title);
    }
  })();

  pendingRequests.set(title, p);
  return p;
}

// Badge creation / update
function createOrUpdateBadge(targetEl, ratingObj, title) {
  if (!targetEl) return;
  // Remove any badges attached to other elements for the same target if needed
  const container = targetEl.parentElement || targetEl;
  // ensure container is positioned
  const style = getComputedStyle(container);
  if (style.position === "static") container.style.position = "relative";

  // Find existing badge attached to this container
  let badge = container.querySelector(".imdb-rating-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "imdb-rating-badge";
    // Prevent badge from catching mouse events (so it doesn't interfere with hover/click)
    badge.style.pointerEvents = "none";
    container.appendChild(badge);
  }

  // content
  if (!ratingObj) {
    badge.innerHTML = `⭐ IMDb: ...`;
  } else {
    const imdbText = ratingObj.imdb ? ratingObj.imdb : "N/A";
    const rtText = ratingObj.rt
      ? ` <span class="rt">🍅 ${ratingObj.rt}</span>`
      : "";
    badge.innerHTML = `⭐ IMDb: ${imdbText}${rtText}`;
  }

  // store meta so we know which title this badge corresponds to
  badge.dataset.imdbFor = title;
}

// Main handler for an image element
async function handleImageElement(imgEl) {
  if (!imgEl || !imgEl.alt) return;
  const title = imgEl.alt.trim();
  if (!title) return;

  // if element already processed for same title -> nothing to do
  if (imgEl.dataset.imdbTitle === title) return;
  // mark it now (prevents races when many events fire)
  imgEl.dataset.imdbTitle = title;

  // show a tiny loader badge immediately (optional)
  createOrUpdateBadge(imgEl, null, title);

  try {
    const rating = await fetchRating(title);
    createOrUpdateBadge(imgEl, rating, title);
  } catch (err) {
    // keep loader removed or show N/A
    createOrUpdateBadge(imgEl, { imdb: "N/A", rt: null }, title);
  }
}

// delegated mouseover (fast response when user hovers)
document.addEventListener(
  "mouseover",
  (e) => {
    const img = e.target.closest && e.target.closest(IMAGE_SELECTOR);
    if (img) handleImageElement(img);
  },
  { capture: true }
);

// IntersectionObserver to load when element is visible on screen
const io = new IntersectionObserver(
  (entries) => {
    for (const ent of entries) {
      if (ent.isIntersecting) {
        const img = ent.target;
        handleImageElement(img);
      }
    }
  },
  { root: null, threshold: 0.5 } // adjust threshold as desired
);

// Scan for images and observe them
function scanAndObserve() {
  const imgs = document.querySelectorAll(IMAGE_SELECTOR);
  imgs.forEach((img) => {
    if (!img.dataset.imdbObserved) {
      img.dataset.imdbObserved = "1";
      try {
        io.observe(img);
      } catch (e) {
        // ignore
      }
    }
  });
}

// Watch for DOM changes and scan newly added images
const mo = new MutationObserver((mutations) => {
  // simple scan on any mutation (cheap enough)
  scanAndObserve();
});
mo.observe(document.body, { childList: true, subtree: true });

// initial scan (page load)
scanAndObserve();

// utility: optional manual refresh (for debugging)
window.__hotstar_imdb_refresh = () => {
  scanAndObserve();
  console.log("hotstar imdb: rescanned for poster images");
};
