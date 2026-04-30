/**
 * Atmosfera — UI Enhancements (v2, performance-tuned)
 *
 * Goals:
 *  - 3D tilt on a curated set of cards (no per-element listeners)
 *  - All updates batched into a SINGLE requestAnimationFrame loop
 *  - Skipped automatically when reduced-motion / coarse-pointer / mobile
 *  - No CSS-variable writes on `body` or `:root` during pointer move
 *    (those would force full-viewport repaints)
 */

const TILT_SELECTOR = [
    ".detail-card",
    ".forecast-card",
    ".watchlist-card",
    ".hourly-card"
].join(",");

const TILT_MAX = 5;          // degrees
const TILT_LIFT = -4;        // px
const TILT_SMOOTHING = 0.18; // 0..1, higher = snappier

const state = {
    enabled: true,
    pointer: { x: 0, y: 0, active: false },
    cards: new Map(),        // element -> { rect, target, current }
    hoveredCard: null,
    rafScheduled: false,
    lastRectSync: 0
};

function isReduced() {
    return document.body?.dataset.motion === "reduced"
        || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function isCoarsePointer() {
    return window.matchMedia?.("(pointer: coarse)").matches;
}

function isMobile() {
    return window.matchMedia?.("(max-width: 760px)").matches;
}

function shouldSkip() {
    return !state.enabled || isReduced() || isCoarsePointer() || isMobile();
}

// ── CARD REGISTRY ────────────────────────────────────────────────────────────

function registerCard(el) {
    if (state.cards.has(el)) return;
    el.setAttribute("data-tilt", "");
    state.cards.set(el, {
        rect: null,
        target: { rx: 0, ry: 0, lift: 0 },
        current: { rx: 0, ry: 0, lift: 0 }
    });

    el.addEventListener("pointerenter", () => {
        if (shouldSkip()) return;
        state.hoveredCard = el;
        const data = state.cards.get(el);
        if (data) data.rect = el.getBoundingClientRect();
        scheduleFrame();
    }, { passive: true });

    el.addEventListener("pointerleave", () => {
        if (state.hoveredCard === el) state.hoveredCard = null;
        const data = state.cards.get(el);
        if (data) data.target = { rx: 0, ry: 0, lift: 0 };
        scheduleFrame();
    }, { passive: true });
}

function bindAll(scope = document) {
    scope.querySelectorAll(TILT_SELECTOR).forEach(registerCard);
}

function observeMutations() {
    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof Element)) continue;
                if (node.matches?.(TILT_SELECTOR)) registerCard(node);
                node.querySelectorAll?.(TILT_SELECTOR).forEach(registerCard);
            }
            for (const node of m.removedNodes) {
                if (!(node instanceof Element)) continue;
                state.cards.delete(node);
            }
        }
    });
    mo.observe(document.body, { childList: true, subtree: true });
}

// ── POINTER TRACKING ────────────────────────────────────────────────────────

function onPointerMove(e) {
    if (shouldSkip()) return;
    state.pointer.x = e.clientX;
    state.pointer.y = e.clientY;
    state.pointer.active = true;
    scheduleFrame();
}

function onPointerLeave() {
    state.pointer.active = false;
    state.hoveredCard = null;
    state.cards.forEach((data) => { data.target = { rx: 0, ry: 0, lift: 0 }; });
    scheduleFrame();
}

// ── ANIMATION LOOP ──────────────────────────────────────────────────────────

function tick() {
    state.rafScheduled = false;

    let needsAnotherFrame = false;
    const hovered = state.hoveredCard;

    if (hovered && state.pointer.active && !shouldSkip()) {
        const data = state.cards.get(hovered);
        if (data) {
            // Re-cache rect occasionally (cheap; only the hovered one)
            if (!data.rect) data.rect = hovered.getBoundingClientRect();
            const { rect } = data;
            const px = (state.pointer.x - rect.left) / rect.width;
            const py = (state.pointer.y - rect.top) / rect.height;
            const nx = Math.max(-1, Math.min(1, px * 2 - 1));
            const ny = Math.max(-1, Math.min(1, py * 2 - 1));
            data.target = {
                rx: -ny * TILT_MAX,
                ry: nx * TILT_MAX,
                lift: TILT_LIFT
            };
        }
    }

    // Smoothly interpolate every active card toward its target,
    // then write CSS vars (only when value changed meaningfully).
    state.cards.forEach((data, el) => {
        const { current, target } = data;
        const dx = target.rx - current.rx;
        const dy = target.ry - current.ry;
        const dl = target.lift - current.lift;

        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dl) < 0.1) {
            if (current.rx !== 0 || current.ry !== 0 || current.lift !== 0) {
                if (target.rx === 0 && target.ry === 0 && target.lift === 0) {
                    current.rx = current.ry = current.lift = 0;
                    el.style.removeProperty("--tilt-x");
                    el.style.removeProperty("--tilt-y");
                    el.style.removeProperty("--tilt-lift");
                }
            }
            return;
        }

        current.rx += dx * TILT_SMOOTHING;
        current.ry += dy * TILT_SMOOTHING;
        current.lift += dl * TILT_SMOOTHING;

        el.style.setProperty("--tilt-x", `${current.rx.toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${current.ry.toFixed(2)}deg`);
        el.style.setProperty("--tilt-lift", `${current.lift.toFixed(2)}px`);

        needsAnotherFrame = true;
    });

    if (needsAnotherFrame) scheduleFrame();
}

function scheduleFrame() {
    if (state.rafScheduled) return;
    state.rafScheduled = true;
    requestAnimationFrame(tick);
}

// ── SCROLL PROGRESS ─────────────────────────────────────────────────────────

let scrollScheduled = false;
let scrollBar = null;

function ensureScrollBar() {
    scrollBar = document.querySelector(".scroll-progress");
    if (!scrollBar) {
        scrollBar = document.createElement("div");
        scrollBar.className = "scroll-progress";
        scrollBar.setAttribute("aria-hidden", "true");
        document.body.appendChild(scrollBar);
    }
}

function updateScroll() {
    scrollScheduled = false;
    if (!scrollBar) return;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const pct = Math.max(0, Math.min(1, doc.scrollTop / max));
    scrollBar.style.width = `${(pct * 100).toFixed(2)}%`;
}

function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateScroll);
}

// ── INIT ────────────────────────────────────────────────────────────────────

function init() {
    ensureScrollBar();
    bindAll(document);
    observeMutations();

    // Single passive global listener
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("blur", onPointerLeave);

    // Invalidate cached rects on scroll/resize so tilt stays accurate
    window.addEventListener("scroll", () => {
        state.cards.forEach((data) => { data.rect = null; });
    }, { passive: true });
    window.addEventListener("resize", () => {
        state.cards.forEach((data) => { data.rect = null; });
        updateScroll();
    }, { passive: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    updateScroll();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
