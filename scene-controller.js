/**
 * SceneController — Full 3D-style canvas weather animation engine
 * Supports: clear-day, clear-night, cloud-day, cloud-night,
 *           rain-day, rain-night, storm, snow, mist, wind
 * All scenes include: background gradient + particles + atmospheric effects
 */

export class SceneController {
    constructor(canvas) {
        this.canvas       = canvas;
        this.context      = canvas?.getContext("2d");
        this.frameId      = 0;
        this.particles    = [];
        this.themeKey     = "clear-day";
        this.reduceMotion = false;
        this.flashOpacity = 0;
        this.windOffset   = 0;
        this.time         = 0;
        this.sunAngle     = 0;
        this.isMobile     = window.matchMedia("(max-width: 760px)").matches;
        this.resize       = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
    }

    play(themeKey, reduceMotion = false) {
        if (!this.context) return;
        this.stop();
        this.themeKey     = themeKey;
        this.reduceMotion = Boolean(reduceMotion);
        this.time         = 0;
        this.seedParticles(themeKey);
        this.resize();
        if (this.reduceMotion) { this.drawFrame(performance.now(), true); return; }
        this.loop();
    }

    stop() {
        cancelAnimationFrame(this.frameId);
        this.frameId      = 0;
        this.particles    = [];
        this.flashOpacity = 0;
        this.windOffset   = 0;
        this.time         = 0;
        this.clear();
    }

    resize() {
        if (!this.canvas || !this.context) return;
        this.isMobile = window.matchMedia("(max-width: 760px)").matches;
        const dpr = 1; // Cap at 1 for performance — retina doesn't matter for a background canvas
        this.canvas.width  = Math.floor(window.innerWidth * dpr);
        this.canvas.height = Math.floor(window.innerHeight * dpr);
        this.canvas.style.width  = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    clear() {
        if (!this.context) return;
        this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    loop() {
        const TARGET_FPS = 30;
        const FRAME_MS   = 1000 / TARGET_FPS;
        let lastFrame    = 0;

        const tick = (now) => {
            this.frameId = requestAnimationFrame(tick);
            if (now - lastFrame < FRAME_MS) return; // skip frame
            lastFrame = now;
            this.drawFrame(now, false);
        };

        this.frameId = requestAnimationFrame(tick);
    }

    drawFrame(now, isStatic) {
        const W = window.innerWidth, H = window.innerHeight;
        this.time = isStatic ? 0 : now / 1000;
        this.clear();

        this._drawBackground(W, H);
        this._drawAtmosphere(W, H);
        this._drawSceneExtras(W, H, isStatic);

        this.particles.forEach((p) => {
            if (!isStatic) updateParticle(p, W, H, this.time);
            drawParticle(this.context, p, this.themeKey, this.time);
        });

        // Lightning flash
        if (this.themeKey === "storm" && !isStatic && Math.random() < 0.006) {
            this.flashOpacity = 0.32;
        }
        if (this.flashOpacity > 0.005) {
            this.context.fillStyle = `rgba(230, 240, 255, ${this.flashOpacity})`;
            this.context.fillRect(0, 0, W, H);
            this.flashOpacity *= 0.82;
            // Draw lightning bolt
            if (this.flashOpacity > 0.15) this._drawLightning(W, H);
        }
    }

    // ── BACKGROUND ────────────────────────────────────────────────────────────

    _drawBackground(W, H) {
        const ctx = this.context;
        const t   = this.time;
        let grad;

        switch (this.themeKey) {
            case "clear-day":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#0d2b6e");
                grad.addColorStop(0.35, "#1565c0");
                grad.addColorStop(0.7,  "#42a5f5");
                grad.addColorStop(1,    `hsl(${36 + Math.sin(t * 0.05) * 4}, 90%, 72%)`);
                break;
            case "clear-night":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#010614");
                grad.addColorStop(0.5,  "#050e2e");
                grad.addColorStop(1,    "#0d1b3e");
                break;
            case "cloud-day":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#2c3e6b");
                grad.addColorStop(0.5,  "#607d8b");
                grad.addColorStop(1,    "#b0bec5");
                break;
            case "cloud-night":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#080f1a");
                grad.addColorStop(0.6,  "#1a2438");
                grad.addColorStop(1,    "#2d3a52");
                break;
            case "rain-day":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#0d1f35");
                grad.addColorStop(0.5,  "#1b3a5c");
                grad.addColorStop(1,    "#34607e");
                break;
            case "rain-night":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#020810");
                grad.addColorStop(0.5,  "#0a1628");
                grad.addColorStop(1,    "#14253d");
                break;
            case "storm":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#030810");
                grad.addColorStop(0.4,  "#0e1b30");
                grad.addColorStop(1,    "#1c2e48");
                break;
            case "snow":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#1a2f4a");
                grad.addColorStop(0.5,  "#4a6fa5");
                grad.addColorStop(1,    "#c8daea");
                break;
            case "mist":
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0,    "#1e2c38");
                grad.addColorStop(0.5,  "#4a5a66");
                grad.addColorStop(1,    "#8a9ba8");
                break;
            default:
                grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0, "#07152c");
                grad.addColorStop(1, "#204c86");
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // ── ATMOSPHERE (sun, moon, clouds, fog layers) ────────────────────────────

    _drawAtmosphere(W, H) {
        const ctx = this.context;
        const t   = this.time;

        if (this.themeKey === "clear-day") {
            // Sun with animated corona
            const sunX = W * 0.75, sunY = H * 0.18;
            const rays  = 12;
            for (let i = 0; i < rays; i++) {
                const angle = (i / rays) * Math.PI * 2 + t * 0.08;
                const len   = 60 + Math.sin(t * 0.4 + i) * 14;
                ctx.strokeStyle = `rgba(255, 220, 100, ${0.08 + Math.sin(t * 0.3 + i) * 0.03})`;
                ctx.lineWidth   = 2;
                ctx.beginPath();
                ctx.moveTo(sunX + Math.cos(angle) * 50, sunY + Math.sin(angle) * 50);
                ctx.lineTo(sunX + Math.cos(angle) * (50 + len), sunY + Math.sin(angle) * (50 + len));
                ctx.stroke();
            }
            // Sun core
            const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 52);
            sg.addColorStop(0,   "rgba(255, 248, 200, 1)");
            sg.addColorStop(0.4, "rgba(255, 210, 80, 0.95)");
            sg.addColorStop(1,   "rgba(255, 160, 30, 0)");
            ctx.fillStyle = sg;
            ctx.beginPath(); ctx.arc(sunX, sunY, 52, 0, Math.PI * 2); ctx.fill();

            // Horizon glow
            const hg = ctx.createLinearGradient(0, H * 0.6, 0, H);
            hg.addColorStop(0, "rgba(255, 160, 60, 0)");
            hg.addColorStop(1, "rgba(255, 120, 30, 0.22)");
            ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
        }

        if (this.themeKey === "clear-night") {
            // Moon
            const mx = W * 0.78, my = H * 0.14;
            const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 36);
            mg.addColorStop(0,   "rgba(255, 252, 230, 1)");
            mg.addColorStop(0.7, "rgba(230, 240, 255, 0.9)");
            mg.addColorStop(1,   "rgba(200, 220, 255, 0)");
            ctx.fillStyle = mg;
            ctx.beginPath(); ctx.arc(mx, my, 36, 0, Math.PI * 2); ctx.fill();
            // Moon craters
            ctx.fillStyle = "rgba(180, 200, 240, 0.18)";
            [[mx+10,my-8,7],[mx-8,my+12,5],[mx+16,my+10,4]].forEach(([x,y,r]) => {
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
            });
        }

        if (this.themeKey.includes("cloud") || this.themeKey.includes("rain") || this.themeKey === "storm") {
            this._drawClouds(W, H, t);
        }

        if (this.themeKey === "mist") {
            this._drawFogLayers(W, H, t);
        }

        if (this.themeKey === "snow") {
            this._drawClouds(W, H, t, true);
        }
    }

    _drawClouds(W, H, t, isSnow = false) {
        const ctx    = this.context;
        const isStorm = this.themeKey === "storm";
        const isRain  = this.themeKey.includes("rain");
        const count   = this.isMobile ? 4 : 7;
        const alpha   = isStorm ? 0.72 : isRain ? 0.58 : isSnow ? 0.44 : 0.36;
        const color   = isStorm ? "50,55,72" : isSnow ? "180,200,220" : "100,120,140";

        for (let i = 0; i < count; i++) {
            const speed  = 0.004 + i * 0.0014;
            const x      = ((W * 0.15 + (W / count) * i + t * speed * W * 0.08) % (W + 300)) - 150;
            const y      = H * (0.05 + i * 0.06);
            const scale  = 0.8 + (i % 3) * 0.4;
            this._drawCloud(ctx, x, y, scale, alpha, color);
        }
    }

    _drawCloud(ctx, x, y, scale, alpha, color) {
        const puffs = [
            [0, 0, 55 * scale],
            [-60 * scale, 14 * scale, 42 * scale],
            [60 * scale, 14 * scale, 42 * scale],
            [-28 * scale, -12 * scale, 38 * scale],
            [28 * scale, -12 * scale, 38 * scale],
        ];
        puffs.forEach(([dx, dy, r]) => {
            const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
            g.addColorStop(0, `rgba(${color}, ${alpha})`);
            g.addColorStop(1, `rgba(${color}, 0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
        });
    }

    _drawFogLayers(W, H, t) {
        const ctx = this.context;
        for (let layer = 0; layer < 4; layer++) {
            const speed = 0.006 + layer * 0.003;
            const y     = H * (0.3 + layer * 0.18);
            const alpha = 0.06 + layer * 0.04;
            const offset = (t * speed * W * 0.1) % W;
            const g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
            g.addColorStop(0, "rgba(200, 210, 220, 0)");
            g.addColorStop(0.5, `rgba(200, 210, 220, ${alpha})`);
            g.addColorStop(1, "rgba(200, 210, 220, 0)");
            ctx.fillStyle = g;
            ctx.fillRect(-offset, y - 60, W * 2, 120);
        }
    }

    // ── SCENE EXTRAS ──────────────────────────────────────────────────────────

    _drawSceneExtras(W, H, isStatic) {
        const ctx = this.context;
        const t   = this.time;

        // Atmospheric glow overlay
        const glowX = W * (0.2 + Math.sin(t * 0.07) * 0.08);
        const glowY = H * (0.18 + Math.cos(t * 0.09) * 0.05);
        const glow  = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, W * 0.55);
        let glowColor;
        if (this.themeKey.includes("rain") || this.themeKey === "storm") {
            glowColor = "rgba(100, 160, 220, 0.10)";
        } else if (this.themeKey.includes("night")) {
            glowColor = "rgba(80, 100, 200, 0.10)";
        } else if (this.themeKey === "snow") {
            glowColor = "rgba(200, 225, 255, 0.12)";
        } else {
            glowColor = "rgba(255, 200, 100, 0.10)";
        }
        glow.addColorStop(0, glowColor);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
    }

    _drawLightning(W, H) {
        const ctx = this.context;
        ctx.strokeStyle = "rgba(255, 255, 240, 0.9)";
        ctx.lineWidth   = 2;
        ctx.shadowColor = "rgba(200, 220, 255, 0.8)";
        ctx.shadowBlur  = 18;
        ctx.beginPath();
        let lx = W * (0.3 + Math.random() * 0.4), ly = 0;
        ctx.moveTo(lx, ly);
        while (ly < H * 0.65) {
            lx += (Math.random() - 0.5) * 80;
            ly += 40 + Math.random() * 40;
            ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // ── PARTICLES ─────────────────────────────────────────────────────────────

    seedParticles(themeKey) {
        const W = window.innerWidth, H = window.innerHeight;
        const type = themeKey === "storm" ? "storm"
            : themeKey.includes("rain")  ? "rain"
            : themeKey === "snow"        ? "snow"
            : themeKey.includes("mist")  ? "mist"
            : themeKey.includes("cloud") ? "cloud"
            : themeKey.includes("night") ? "night"
            : "clear";

        const counts = { clear: 12, night: 40, cloud: 8, mist: 12, rain: 55, storm: 70, snow: 35 };
        const mul    = this.isMobile ? 0.55 : 1;
        const count  = Math.max(8, Math.round((counts[type] || 20) * mul));
        this.particles = Array.from({ length: count }, () => createParticle(type, W, H, this.isMobile));
    }
}

// ── PARTICLE FACTORY ──────────────────────────────────────────────────────────

function createParticle(type, W, H, isMobile) {
    switch (type) {
        case "rain": case "storm":
            return {
                type,
                x:      Math.random() * W,
                y:      Math.random() * H,
                length: (isMobile ? 10 : 16) + Math.random() * (isMobile ? 12 : 20),
                speedX: -1.8 - Math.random() * 1.2,
                speedY: (isMobile ? 8 : 12) + Math.random() * (isMobile ? 6 : 9),
                opacity: 0.12 + Math.random() * 0.18,
                width:  type === "storm" ? 1.2 : 0.8
            };
        case "snow":
            return {
                type,
                x:       Math.random() * W,
                y:       Math.random() * H,
                radius:  1.2 + Math.random() * (isMobile ? 2.2 : 3.2),
                speedX:  -0.4 + Math.random() * 0.8,
                speedY:  0.4 + Math.random() * 1.2,
                opacity: 0.3 + Math.random() * 0.5,
                drift:   Math.random() * Math.PI * 2,
                driftSpeed: 0.01 + Math.random() * 0.02
            };
        case "mist":
            return {
                type,
                x:       Math.random() * W,
                y:       H * 0.2 + Math.random() * H * 0.7,
                radius:  (isMobile ? 50 : 80) + Math.random() * (isMobile ? 90 : 140),
                speedX:  0.06 + Math.random() * 0.12,
                speedY:  -0.02 + Math.random() * 0.04,
                opacity: 0.022 + Math.random() * 0.04,
                phase:   Math.random() * Math.PI * 2
            };
        case "cloud":
            return {
                type,
                x:       Math.random() * W,
                y:       Math.random() * H * 0.5,
                radius:  (isMobile ? 60 : 90) + Math.random() * (isMobile ? 80 : 130),
                speedX:  0.04 + Math.random() * 0.10,
                speedY:  0,
                opacity: 0.018 + Math.random() * 0.030
            };
        case "night":
            return {
                type,
                x:       Math.random() * W,
                y:       Math.random() * H * 0.75,
                radius:  0.6 + Math.random() * 1.6,
                speedX:  0.005 + Math.random() * 0.02,
                speedY:  0,
                opacity: 0.3 + Math.random() * 0.55,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.4 + Math.random() * 1.2
            };
        default: // clear
            return {
                type: "clear",
                x:       Math.random() * W,
                y:       Math.random() * H,
                radius:  2 + Math.random() * 5,
                speedX:  -0.05 + Math.random() * 0.10,
                speedY:  -0.05 + Math.random() * 0.10,
                opacity: 0.04 + Math.random() * 0.07
            };
    }
}

// ── PARTICLE UPDATE ───────────────────────────────────────────────────────────

function updateParticle(p, W, H, t) {
    if (p.type === "rain" || p.type === "storm") {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y > H + p.length || p.x < -60) {
            p.x = Math.random() * W + 60;
            p.y = -p.length;
        }
        return;
    }
    if (p.type === "snow") {
        p.drift += p.driftSpeed;
        p.x += p.speedX + Math.sin(p.drift) * 0.4;
        p.y += p.speedY;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        if (p.x < -20)     p.x = W + 12;
        if (p.x > W + 20)  p.x = -12;
        return;
    }
    if (p.type === "mist") {
        p.phase += 0.003;
        p.x     += p.speedX + Math.sin(p.phase) * 0.2;
        p.y     += p.speedY;
        if (p.x - p.radius > W + 100) p.x = -p.radius;
        return;
    }
    if (p.type === "cloud") {
        p.x += p.speedX;
        if (p.x - p.radius > W + 100) p.x = -p.radius;
        return;
    }
    if (p.type === "night") {
        p.twinkle += p.twinkleSpeed * 0.016;
        p.x += p.speedX;
        if (p.x > W + 10) p.x = -10;
        return;
    }
    // clear dust
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x < -20 || p.x > W + 20) p.speedX *= -1;
    if (p.y < -20 || p.y > H + 20) p.speedY *= -1;
}

// ── PARTICLE DRAW ─────────────────────────────────────────────────────────────

function drawParticle(ctx, p, themeKey, t) {
    if (p.type === "rain" || p.type === "storm") {
        ctx.strokeStyle = `rgba(190, 225, 255, ${p.opacity})`;
        ctx.lineWidth   = p.width || 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * 2.2, p.y + p.length);
        ctx.stroke();
        return;
    }
    if (p.type === "snow") {
        // Draw snowflake shape
        ctx.strokeStyle = `rgba(240, 248, 255, ${p.opacity})`;
        ctx.lineWidth   = 0.8;
        const arms = 6;
        for (let i = 0; i < arms; i++) {
            const angle = (i / arms) * Math.PI * 2 + (t * 0.02);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.cos(angle) * p.radius * 2.2, p.y + Math.sin(angle) * p.radius * 2.2);
            ctx.stroke();
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        return;
    }
    if (p.type === "mist" || p.type === "cloud") {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        g.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
        g.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        return;
    }
    if (p.type === "night") {
        const twinkle = 0.5 + 0.5 * Math.sin(p.twinkle);
        const alpha   = p.opacity * twinkle;
        ctx.fillStyle = `rgba(255, 248, 220, ${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        // Star cross
        if (p.radius > 1.2) {
            ctx.strokeStyle = `rgba(255, 248, 220, ${alpha * 0.5})`;
            ctx.lineWidth   = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x - p.radius * 2.5, p.y);
            ctx.lineTo(p.x + p.radius * 2.5, p.y);
            ctx.moveTo(p.x, p.y - p.radius * 2.5);
            ctx.lineTo(p.x, p.y + p.radius * 2.5);
            ctx.stroke();
        }
        return;
    }
    // Clear — soft glow dust
    const isNight = themeKey.includes("night");
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 5);
    g.addColorStop(0, isNight ? `rgba(160, 190, 255, ${p.opacity})` : `rgba(255, 240, 180, ${p.opacity})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(p.x - p.radius * 5, p.y - p.radius * 5, p.radius * 10, p.radius * 10);
}