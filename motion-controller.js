const INTERACTIVE_SELECTOR = "button, a, [data-sound-hover='true']";

export class MotionController {
    constructor(root = document) {
        this.root = root;
        this.gsap = window.gsap || null;
        this.ScrollTrigger = window.ScrollTrigger || null;
        this.reduceMotion = false;
        this.revealObserver = null;
        this.boundInteractiveAudio = false;
        this.hoverCooldownUntil = 0;
        this.lastHoverTarget = null;
        this.scrollAnimations = [];
        this.onUiClick = () => {};
        this.onUiHover = () => {};
    }

    init({ reduceMotion = false, onUiClick = () => {}, onUiHover = () => {} } = {}) {
        this.onUiClick = onUiClick;
        this.onUiHover = onUiHover;
        this.bindInteractiveAudio();
        this.setReducedMotion(reduceMotion);
    }

    setReducedMotion(reduceMotion) {
        this.reduceMotion = Boolean(reduceMotion);
        if (document.body) {
            document.body.dataset.motion = this.reduceMotion ? "reduced" : "full";
        }

        if (this.reduceMotion) {
            this.clearScrollAnimations();
            this.revealImmediately();
            return;
        }

        this.setupParallax();
        this.observeReveals(this.root);
    }

    refresh(scope = this.root) {
        this.observeReveals(scope);
        if (!this.reduceMotion && this.ScrollTrigger) {
            this.ScrollTrigger.refresh();
        }
    }

    animateWeatherRefresh(scope = this.root) {
        const nodes = scope.querySelectorAll(
            ".hero-reading > *, .hero-side .mini-panel, .detail-card, .hourly-card, .forecast-card, .watchlist-card, .facts-list > div"
        );
        if (!nodes.length) return;

        if (this.reduceMotion) {
            nodes.forEach((n) => { n.style.opacity = "1"; n.style.transform = "none"; });
            return;
        }

        if (this.gsap) {
            this.gsap.killTweensOf(nodes);
            this.gsap.fromTo(
                nodes,
                { y: 24, autoAlpha: 0, scale: 0.97 },
                {
                    y: 0, autoAlpha: 1, scale: 1,
                    duration: 0.9,
                    stagger: { each: 0.042, ease: "power1.in" },
                    ease: "power3.out",
                    clearProps: "transform,opacity,visibility"
                }
            );
            return;
        }

        // CSS Web Animations fallback
        nodes.forEach((node, i) => {
            if (!node.animate) return;
            node.animate(
                [
                    { opacity: 0, transform: "translate3d(0, 22px, 0) scale(0.97)" },
                    { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
                ],
                { duration: 780, delay: i * 44, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" }
            );
        });
    }

    bindInteractiveAudio() {
        if (this.boundInteractiveAudio) return;
        this.boundInteractiveAudio = true;

        document.addEventListener("click", (e) => {
            if (!e.target.closest(INTERACTIVE_SELECTOR)) return;
            this.onUiClick();
        });

        document.addEventListener("mouseover", (e) => {
            const target = e.target.closest("[data-sound-hover='true'], button, .inline-link");
            if (!target || target === this.lastHoverTarget) return;
            const now = Date.now();
            if (now < this.hoverCooldownUntil) return;
            this.hoverCooldownUntil = now + 95;
            this.lastHoverTarget = target;
            this.onUiHover();
        }, { passive: true });
    }

    observeReveals(scope = this.root) {
        const revealables = scope.querySelectorAll("[data-reveal]");

        if (this.reduceMotion || !("IntersectionObserver" in window)) {
            revealables.forEach((el) => this.markVisible(el));
            return;
        }

        if (!this.revealObserver) {
            this.revealObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        this.reveal(entry.target);
                        this.revealObserver.unobserve(entry.target);
                    });
                },
                { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
            );
        }

        revealables.forEach((el) => {
            if (el.dataset.revealBound === "true") return;
            el.dataset.revealBound = "true";
            this.revealObserver.observe(el);
        });
    }

    reveal(element) {
        if (element.dataset.revealed === "true") return;
        this.markVisible(element);
        if (this.reduceMotion || !element.animate) return;

        const variant = element.dataset.reveal || "fade";
        const isHero  = variant === "hero";

        element.animate(
            isHero
                ? [
                    { opacity: 0, transform: "translate3d(0, 30px, 0) scale(0.982)" },
                    { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
                  ]
                : [
                    { opacity: 0, transform: "translate3d(0, 22px, 0)" },
                    { opacity: 1, transform: "translate3d(0, 0, 0)" }
                  ],
            { duration: isHero ? 980 : 780, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" }
        );
    }

    markVisible(element) {
        element.dataset.revealed = "true";
        element.classList.add("is-visible");
    }

    revealImmediately() {
        document.querySelectorAll("[data-reveal]").forEach((el) => this.markVisible(el));
    }

    setupParallax() {
        if (!this.gsap || !this.ScrollTrigger || this.reduceMotion) return;
        this.clearScrollAnimations();
        this.gsap.registerPlugin(this.ScrollTrigger);

        const depthMap = { far: -8, mid: -14, near: -22, slow: -6, float: -10 };

        this.gsap.utils.toArray("[data-depth]").forEach((node) => {
            const yPercent = depthMap[node.dataset.depth] ?? -10;
            const tween = this.gsap.to(node, {
                yPercent,
                ease: "none",
                scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1.4 }
            });
            this.scrollAnimations.push(tween);
        });
    }

    clearScrollAnimations() {
        this.scrollAnimations.forEach((anim) => {
            anim.scrollTrigger?.kill();
            anim.kill();
        });
        this.scrollAnimations = [];
    }
}