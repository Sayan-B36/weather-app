/**
 * Atmosfera — UI Enhancements
 * Adds non-invasive 3D mouse tilt, pointer-tracked spotlights,
 * parallax for the cinematic background, and a scroll progress bar.
 *
 * Reads:  body[data-motion]  (set by MotionController to "reduced" or "full")
 * Writes: CSS vars on :root and on individual cards.
 */

const TILT_SELECTOR = [
    ".detail-card",
    ".forecast-card",
    ".watchlist-card",
    ".hourly-card",
    ".mini-panel"
].join(",");

const SPOTLIGHT_SELECTOR = [
    ".panel",
    ".section",
    ".detail-card",
    ".forecast-card",
    ".watchlist-card",
    ".hourly-card"
].join(",");

const TILT_MAX = 8;       // degrees
const TILT_LIFT = -6;     // px

let rafId = 0;
let pendingPointer = null;
let pendingScroll = false;

function isReduced() {
    return document.body?.dataset.motion === "reduced"
        || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function isCoarsePointer() {
    return window.matchMedia?.("(pointer: coarse)").matches;
}

// ── 3D TILT ──────────────────────────────────────────────────────────────────

function attachTilt(card) {
    if (card.dataset.tiltBound === "true") return;
    card.dataset.tiltBound = "true";
    card.setAttribute("data-tilt", "");

    const onMove = (e) => {
        if (isReduced() || isCoarsePointer()) return;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        // Range: -1..1
        const nx = Math.max(-1, Math.min(1, px * 2 - 1));
        const ny = Math.max(-1, Math.min(1, py * 2 - 1));
        card.style.setProperty("--tilt-y", `${nx * TILT_MAX}deg`);
        card.style.setProperty("--tilt-x", `${-ny * TILT_MAX}deg`);
        card.style.setProperty("--tilt-lift", `${TILT_LIFT}px`);
        card.style.setProperty("--pointer-x", `${px * 100}%`);
        card.style.setProperty("--pointer-y", `${py * 100}%`);
    };

    const onLeave = () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.style.setProperty("--tilt-lift", "0px");
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });
}

function attachSpotlight(panel) {
    if (panel.dataset.spotlightBound === "true") return;
    panel.dataset.spotlightBound = "true";

    panel.addEventListener("pointermove", (e) => {
        const rect = panel.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        panel.style.setProperty("--pointer-x", `${px}%`);
        panel.style.setProperty("--pointer-y", `${py}%`);
    }, { passive: true });
}

function bindAll(scope = document) {
    scope.querySelectorAll(TILT_SELECTOR).forEach(attachTilt);
    scope.querySelectorAll(SPOTLIGHT_SELECTOR).forEach(attachSpotlight);
}

// Re-bind whenever new cards get rendered
function observeMutations() {
    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof Element)) continue;
                if (node.matches?.(TILT_SELECTOR)) attachTilt(node);
                if (node.matches?.(SPOTLIGHT_SELECTOR)) attachSpotlight(node);
                bindAll(node);
            }
        }
    });
    mo.observe(document.body, { childList: true, subtree: true });
}

// ── GLOBAL POINTER PARALLAX (background) ────────────────────────────────────

function flushPointer() {
    rafId = 0;
    if (!pendingPointer) return;
    const { x, y } = pendingPointer;
    pendingPointer = null;
    document.documentElement.style.setProperty("--parallax-mx", x.toFixed(3));
    document.documentElement.style.setProperty("--parallax-my", y.toFixed(3));
}

function onGlobalPointer(e) {
    if (isReduced() || isCoarsePointer()) return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;   // -1..1
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    pendingPointer = { x, y };
    if (!rafId) rafId = requestAnimationFrame(flushPointer);
}

// ── SCROLL PROGRESS ─────────────────────────────────────────────────────────

function ensureScrollBar() {
    let bar = document.querySelector(".scroll-progress");
    if (!bar) {
        bar = document.createElement("div");
        bar.className = "scroll-progress";
        bar.setAttribute("aria-hidden", "true");
        document.body.appendChild(bar);
    }
    return bar;
}

function updateScroll() {
    pendingScroll = false;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const pct = Math.max(0, Math.min(1, doc.scrollTop / max));
    document.documentElement.style.setProperty("--scroll-progress", `${(pct * 100).toFixed(2)}%`);
}

function onScroll() {
    if (pendingScroll) return;
    pendingScroll = true;
    requestAnimationFrame(updateScroll);
}

// ── INIT ────────────────────────────────────────────────────────────────────

function init() {
    ensureScrollBar();
    bindAll(document);
    observeMutations();

    window.addEventListener("pointermove", onGlobalPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    updateScroll();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
