/**
 * AmbientAudio — Peaceful anime-style soundscape
 * Inspired by: Studio Ghibli, Zelda: BotW ambient music, lo-fi nature sounds
 *
 * Volume is intentionally set HIGH — users can lower via OS/browser controls.
 * Every sound uses convolution reverb for that warm, cinematic quality.
 *
 * Pentatonic scale (C major): C D E G A — always sounds peaceful, never harsh.
 */

const UNLOCK_EVENTS = ["pointerdown", "touchstart", "keydown", "click"];

// C major pentatonic — every combination sounds good
const P = {
    C2:65.41, G2:98.00,
    C3:130.81, D3:146.83, E3:164.81, G3:196.00, A3:220.00,
    C4:261.63, D4:293.66, E4:329.63, G4:392.00, A4:440.00,
    C5:523.25, D5:587.33, E5:659.25, G5:783.99, A5:880.00,
    C6:1046.5
};

export class AmbientAudio {
    constructor({ onStateChange = () => {} } = {}) {
        this.onStateChange      = onStateChange;
        this.context            = null;
        this.masterGain         = null;
        this.reverb             = null;
        this.reverbGain         = null;
        this.dryBus             = null;
        this.sfxBus             = null;
        this.ambientEnabled     = false;
        this.unlocked           = false;
        this.reducedEffects     = false;
        this.activeNodes        = [];   // {node, gain} pairs to stop cleanly
        this.timers             = [];   // setTimeout IDs to clear on stop
        this.unlockBound        = false;
        this._unlockPromise     = null;
        this.handleUnlockAttempt = this.handleUnlockAttempt.bind(this);
        this.bindUnlockListeners();
    }

    // ── UNLOCK ───────────────────────────────────────────────────────────────

    bindUnlockListeners() {
        if (this.unlockBound) return;
        this.unlockBound = true;
        UNLOCK_EVENTS.forEach(e => window.addEventListener(e, this.handleUnlockAttempt, { passive: true, capture: true }));
    }
    unbindUnlockListeners() {
        if (!this.unlockBound) return;
        this.unlockBound = false;
        UNLOCK_EVENTS.forEach(e => window.removeEventListener(e, this.handleUnlockAttempt, { capture: true }));
    }
    async handleUnlockAttempt(ev) {
        if (!ev.isTrusted) return;
        try {
            await this.ensureContext();
            if (this.context?.state === "suspended") await this.context.resume();
            if (this.context?.state === "running") {
                this.unlocked = true;
                this.unbindUnlockListeners();
                this.notify("unlock", { ok: true, message: "Sound ready." });
            }
        } catch {}
    }
    async unlock() {
        if (this._unlockPromise) return this._unlockPromise;
        this._unlockPromise = (async () => {
            try {
                await this.ensureContext();
                if (this.context.state === "suspended") await this.context.resume().catch(() => {});
                await delay(80);
                this.unlocked = this.context.state === "running";
                if (this.unlocked) {
                    this.unbindUnlockListeners();
                    this.notify("unlock", { ok: true, message: "Sound ready." });
                    return { ok: true, message: "Sound ready." };
                }
                return { ok: false, message: "Tap anywhere to enable audio." };
            } catch (err) {
                return { ok: false, message: err?.message || "Audio unavailable." };
            } finally { this._unlockPromise = null; }
        })();
        return this._unlockPromise;
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────

    setReducedEffects(v) {
        this.reducedEffects = Boolean(v);
        if (!this.context) return;
        const t = this.context.currentTime;
        this.masterGain?.gain.setTargetAtTime(v ? 0.25 : 0.72, t, 0.3);
    }

    async setAmbientEnabled(enabled, themeKey = "clear-day", localHour = new Date().getHours()) {
        this.ambientEnabled = Boolean(enabled);
        if (!this.ambientEnabled) {
            this.stop();
            this.notify("ambient", { ok: true, enabled: false, message: "Sound off." });
            return { ok: true, message: "Sound off." };
        }
        const r = await this.unlock();
        if (!r.ok) { this.ambientEnabled = false; return r; }
        return this.play(themeKey, localHour);
    }

    async play(themeKey, localHour = new Date().getHours()) {
        const r = await this.unlock();
        if (!r.ok) return r;  // Browser needs user interaction first
        try {
            this.stop();
            await delay(60);
            this.ambientEnabled = true;
            this._buildScene(themeKey, localHour);
            this.notify("ambient", { ok: true, enabled: true, message: "Sound on." });
            return { ok: true, message: "Sound on." };
        } catch (err) {
            this.stop();
            const message = err?.message || "Audio failed.";
            this.notify("error", { ok: false, message });
            return { ok: false, message };
        }
    }

    stop() {
        this.ambientEnabled = false;
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];
        const now = this.context?.currentTime ?? 0;
        this.activeNodes.forEach(({ node, gain }) => {
            try {
                gain?.gain.cancelScheduledValues(now);
                gain?.gain.setValueAtTime(gain.gain.value, now);
                gain?.gain.linearRampToValueAtTime(0, now + 0.6);
                if (typeof node.stop === "function") node.stop(now + 0.65);
            } catch {}
            setTimeout(() => {
                try { node.disconnect(); } catch {}
                try { gain?.disconnect(); } catch {}
            }, 800);
        });
        this.activeNodes = [];
    }

    playUiTone(kind = "click") {
        if (!this.unlocked || !this.context || this.context.state !== "running") return false;
        try {
            const now  = this.now();
            const freq = kind === "hover" ? P.E5 : P.G5;
            const osc  = this.osc("sine", freq);
            const g    = this.context.createGain();
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(0.02, now + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "hover" ? 0.14 : 0.22));
            osc.connect(g); g.connect(this.reverb); g.connect(this.dryBus);
            osc.start(now); osc.stop(now + 0.25);
            return true;
        } catch { return false; }
    }

    // ── SCENE ROUTER ─────────────────────────────────────────────────────────

    _buildScene(themeKey, hour) {
        if (themeKey === "storm")           return this._storm();
        if (themeKey.includes("rain"))      return this._rain(hour);
        if (themeKey === "snow")            return this._snow();
        if (themeKey.includes("mist"))      return this._mist();
        if (themeKey.includes("cloud"))     return this._cloudy(hour);
        // Time-based clear sky
        if (hour >= 5  && hour < 8)         return this._dawn();
        if (hour >= 8  && hour < 12)        return this._morning();
        if (hour >= 12 && hour < 17)        return this._afternoon();
        if (hour >= 17 && hour < 20)        return this._evening();
        if (hour >= 20 && hour < 23)        return this._night();
        return this._midnight();
    }

    // ── WEATHER SCENES ────────────────────────────────────────────────────────

    _rain(hour) {
        // Soft layered rain — like distant rain through a window
        this._rainLayer(3200, 0.5, 0.18);   // gentle high shimmer
        this._rainLayer(900,  1.0, 0.14);    // soft mid body
        this._rainLayer(260,  0.3, 0.08);    // faint low rumble

        // Occasional single water drops — sparse, not rapid
        this._schedule([
            () => this._pluck(P.D4, 0.06),
            () => this._pluck(P.G4, 0.05),
            () => this._pluck(P.A4, 0.05),
            () => this._pluck(P.E4, 0.04),
        ], 1800, 5000);

        // Very soft pad — barely there
        this._pad(P.D3, 0.05, "sine", 5.0);
        this._pad(P.A3, 0.04, "sine", 7.0);
        if (hour >= 20 || hour < 6) {
            this._pad(P.G3, 0.03, "sine", 9.0);
        }
    }

    _storm() {
        this._rainLayer(2800, 0.7, 0.22);
        this._rainLayer(700,  1.2, 0.16);
        this._windLayer(200, 0.12);

        // Soft tension pad
        this._pad(P.A3, 0.06, "sine", 4.0);
        this._pad(P.E3, 0.04, "sine", 6.0);

        // Distant thunder — quiet rumble
        this._scheduleThunder();
    }

    _snow() {
        // Rare crystalline bell pings — like a single snowflake
        this._schedule([
            () => this._bell(P.C5,  0.07),
            () => this._bell(P.E5,  0.06),
            () => this._bell(P.G5,  0.05),
            () => this._bell(P.D5,  0.06),
        ], 5000, 12000);

        // Near-silent wind breath
        this._windLayer(200, 0.07);

        // Barely-there warm pad
        this._pad(P.C4, 0.05, "sine", 6.0);
        this._pad(P.G3, 0.03, "sine", 9.0);
    }

    _mist() {
        // Very soft breathing wind
        this._windLayer(300, 0.09);

        // Dreamy slow pads — very quiet
        this._pad(P.A3, 0.06, "sine", 6.0);
        this._pad(P.E4, 0.04, "sine", 9.0);
        this._pad(P.C4, 0.03, "sine", 12.0);

        // Rare distant bell
        this._scheduleOnce(() => this._bell(P.E5, 0.07), 8000, 20000);
    }

    _cloudy(hour) {
        this._windLayer(380, 0.08);
        const night = hour >= 20 || hour < 6;
        this._pad(night ? P.G3 : P.C4, 0.06, "sine", 5.0);
        this._pad(night ? P.A3 : P.E4, 0.04, "sine", 8.0);
        if (!night) {
            this._scheduleOnce(() => this._birdCall(P.A5, 0.06), 7000, 16000);
        }
    }

    // ── TIME-OF-DAY SCENES ────────────────────────────────────────────────────

    _dawn() {
        // Gentle harp — slow, sparse notes
        const harpNotes = [P.G3, P.A3, P.C4, P.E4, P.G4, P.A4, P.C5, P.A4, P.G4, P.E4, P.C4, P.A3];
        this._harpArp(harpNotes, 0.08, 1.8);  // slow interval, soft

        // Distant birds — occasional, not chattering constantly
        this._scheduleOnce(() => this._birdCall(P.A5, 0.07), 2000, 6000);
        this._scheduleOnce(() => this._birdCall(P.G5, 0.06), 5000, 12000);
        this._schedule([
            () => this._birdCall(P.A5, 0.06),
            () => this._birdCall(P.G5, 0.05),
        ], 8000, 18000);  // very infrequent

        // Leaves in soft morning breeze
        this._windLayer(2200, 0.05);

        // Warm foundation — very quiet
        this._pad(P.C4, 0.06, "sine", 5.0);
        this._pad(P.G3, 0.04, "sine", 8.0);
    }

    _morning() {
        // Gentle flute — slower, more spaced out
        const morningNotes = [P.C4, P.E4, P.G4, P.A4, P.C5, P.E5];
        this._fluteArp(morningNotes, 0.08, 1.4);

        this._schedule([
            () => this._birdCall(P.C6, 0.06),
            () => this._birdCall(P.A5, 0.07),
            () => this._birdCall(P.G5, 0.06),
        ], 6000, 14000);

        this._windLayer(1800, 0.05);
        this._pad(P.E4, 0.05, "sine", 4.0);
        this._pad(P.C4, 0.04, "sine", 7.0);
    }

    _afternoon() {
        // Lazy sparse chimes — like a breeze occasionally catches them
        const chimeNotes = [P.E4, P.G4, P.A4, P.C5, P.E5];
        this._schedule(
            chimeNotes.map(f => () => this._chime(f, 0.08)),
            7000, 18000
        );

        // Faint cicada hum in the background
        this._cicada(0.05);

        // Barely-there warm pad
        this._windLayer(420, 0.06);
        this._pad(P.G3, 0.05, "sine", 4.0);
        this._pad(P.A3, 0.04, "sine", 7.0);
    }

    _evening() {
        // Very soft piano chords — infrequent, like thinking out loud
        this._scheduleChords([
            [P.A3, P.C4, P.E4],
            [P.G3, P.A3, P.D4],
            [P.E3, P.G3, P.A3],
        ], 0.07, 9.0, 18.0);

        // Crickets just starting — soft
        this._crickets(0.08);

        // Soft evening breeze
        this._windLayer(320, 0.06);

        // Warm fading pad
        this._pad(P.E3, 0.05, "sine", 6.0);

        // Distant bell once
        this._scheduleOnce(() => this._bell(P.D5, 0.09), 8000, 18000);
    }

    _night() {
        // Soft cricket bed — ambient, not sharp
        this._crickets(0.10);

        // Sparse koto plucks — like distant music
        this._schedule([
            () => this._pluck(P.G3, 0.08),
            () => this._pluck(P.A3, 0.07),
            () => this._pluck(P.C4, 0.06),
            () => this._pluck(P.E4, 0.06),
        ], 4000, 10000);

        // Gentle night breeze
        this._windLayer(240, 0.06);

        // Very soft pad
        this._pad(P.G3, 0.05, "sine", 5.0);
        this._pad(P.A3, 0.04, "sine", 8.0);

        // One distant bell occasionally
        this._scheduleOnce(() => this._bell(P.C5, 0.09), 10000, 25000, true);
    }

    _midnight() {
        // Near silence — just barely perceptible

        // Sub drone — more felt than heard
        this._pad(P.C2, 0.04, "sine", 8.0);
        this._pad(P.G2, 0.03, "sine", 12.0);
        this._pad(P.C3, 0.02, "sine", 16.0);

        // Whisper of wind
        this._windLayer(160, 0.04);

        // Very rare distant bell — once every 30-60s
        this._scheduleOnce(() => this._bell(P.G3, 0.08), 15000, 35000, true);

        // Almost inaudible cricket
        this._crickets(0.04);
    }

    // ── SOUND PRIMITIVES ─────────────────────────────────────────────────────

    /**
     * Sustained pad — oscillator + vibrato + through reverb.
     * The backbone of every scene.
     */
    _pad(freq, vol, type = "sine", attack = 3.0) {
        const now = this.now();
        const osc = this.osc(type, freq);

        // Vibrato LFO
        const vLFO  = this.osc("sine", 4.2 + Math.random() * 1.4);
        const vGain = this.context.createGain();
        vGain.gain.value = freq * 0.004;
        vLFO.connect(vGain); vGain.connect(osc.frequency);

        const lp = this.bq("lowpass", 1200, 0.5);
        const g  = this.context.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + attack);

        osc.connect(lp); lp.connect(g);
        g.connect(this.reverb);       // wet signal — spacious
        g.connect(this.dryBus);       // dry signal — present

        osc.start(now); vLFO.start(now);
        this.activeNodes.push({ node: osc, gain: g });
        this.activeNodes.push({ node: vLFO, gain: vGain });
    }

    /**
     * Bell / crystal ping — fast attack, long reverb tail.
     */
    _bell(freq, vol) {
        if (!this.context) return;
        const now = this.now();
        const osc = this.osc("sine", freq);
        osc.detune.value = (Math.random() - 0.5) * 6;
        const g = this.context.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.008);
        g.gain.exponentialRampToValueAtTime(vol * 0.3, now + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
        osc.connect(g); g.connect(this.reverb);
        osc.start(now); osc.stop(now + 5.0);
    }

    /**
     * Pluck — triangle wave, harp/koto feel.
     */
    _pluck(freq, vol) {
        if (!this.context) return;
        const now = this.now();
        const osc = this.osc("triangle", freq);
        osc.detune.value = (Math.random() - 0.5) * 8;
        const g = this.context.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.014);
        g.gain.exponentialRampToValueAtTime(vol * 0.4, now + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(g); g.connect(this.reverb);
        osc.start(now); osc.stop(now + 2.5);
    }

    /**
     * Chime — mid-high triangle, like bamboo wind chimes.
     */
    _chime(freq, vol) {
        if (!this.context) return;
        // Play 2-3 notes close together
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const t   = this.now() + i * (0.06 + Math.random() * 0.10);
            const osc = this.osc("triangle", freq * (0.98 + Math.random() * 0.04));
            const g   = this.context.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol * (1 - i * 0.2), t + 0.016);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
            osc.connect(g); g.connect(this.reverb);
            osc.start(t); osc.stop(t + 2.2);
        }
    }

    /**
     * Harp arpeggio — rising then falling pentatonic.
     */
    _harpArp(notes, vol, intervalSec) {
        let step = 0;
        const play = () => {
            if (!this.ambientEnabled || !this.context) return;
            this._pluck(notes[step % notes.length], vol * (0.85 + Math.random() * 0.3));
            step++;
            const jitter = (Math.random() - 0.5) * 0.25 * intervalSec;
            const id = setTimeout(play, (intervalSec + jitter) * 1000);
            this.timers.push(id);
        };
        const id = setTimeout(play, 300);
        this.timers.push(id);
    }

    /**
     * Flute arpeggio — breathier, brighter than harp.
     */
    _fluteArp(notes, vol, intervalSec) {
        let step = 0;
        const play = () => {
            if (!this.ambientEnabled || !this.context) return;
            const freq = notes[step % notes.length];
            step = (step + 1) % notes.length;
            const now = this.now();

            // Main tone
            const osc = this.osc("triangle", freq);
            const g   = this.context.createGain();
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(vol, now + 0.055);
            g.gain.setValueAtTime(vol * 0.8, now + 0.35);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
            osc.connect(g); g.connect(this.reverb);
            osc.start(now); osc.stop(now + 0.9);

            // Breathiness — noise burst at same freq band
            const n  = this._noiseNode(0.25);
            const nf = this.bq("bandpass", freq * 1.8, 4);
            const ng = this.context.createGain();
            ng.gain.setValueAtTime(vol * 0.12, now);
            ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            n.connect(nf); nf.connect(ng); ng.connect(this.reverb);
            n.start(now); n.stop(now + 0.3);

            const jitter = (Math.random() - 0.5) * 0.2 * intervalSec;
            const id = setTimeout(play, (intervalSec + jitter) * 1000);
            this.timers.push(id);
        };
        const id = setTimeout(play, 500);
        this.timers.push(id);
    }

    /**
     * Bird call — synthetic chirp with pitch sweep.
     * Sounds like a real small bird.
     */
    _birdCall(baseFreq, vol) {
        if (!this.context) return;
        const chirps = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < chirps; i++) {
            const t   = this.now() + i * (0.08 + Math.random() * 0.07);
            const dur = 0.055 + Math.random() * 0.10;
            const osc = this.osc("sine", baseFreq * (0.9 + Math.random() * 0.2));
            const g   = this.context.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.010);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            // Pitch glide up then down — bird-like
            osc.frequency.setValueAtTime(baseFreq * 0.85, t);
            osc.frequency.linearRampToValueAtTime(baseFreq * 1.18, t + dur * 0.6);
            osc.frequency.linearRampToValueAtTime(baseFreq * 0.92, t + dur);
            osc.connect(g); g.connect(this.reverb); g.connect(this.dryBus);
            osc.start(t); osc.stop(t + dur + 0.02);
        }

        // Schedule next call with some randomness
        this._scheduleOnce(() => this._birdCall(baseFreq, vol), 3000, 9000);
    }

    /**
     * Cricket bed — looping synthesized cricket texture.
     */
    _crickets(vol) {
        const sr  = this.context.sampleRate;
        const dur = 3.5;
        const buf = this.context.createBuffer(1, Math.floor(sr * dur), sr);
        const ch  = buf.getChannelData(0);
        const cps = 18; // chirps per second
        for (let b = 0; b < cps * dur; b++) {
            const start   = Math.floor(b / (cps * dur) * sr * dur + Math.random() * (sr / cps * 0.7));
            const chirpLen = Math.floor(sr * 0.014);
            const freq    = 3800 + Math.random() * 900;
            for (let i = 0; i < chirpLen && start + i < ch.length; i++) {
                const env = Math.sin((Math.PI * i) / chirpLen);
                ch[start + i] += env * 0.28 * Math.sin(2 * Math.PI * freq * i / sr);
            }
        }
        const src = this.context.createBufferSource();
        const g   = this.context.createGain();
        src.buffer = buf; src.loop = true;
        g.gain.setValueAtTime(0.0001, this.now());
        g.gain.linearRampToValueAtTime(vol, this.now() + 3.0);
        const hp = this.bq("highpass", 2800, 0.6);
        src.connect(hp); hp.connect(g); g.connect(this.dryBus);
        src.start(this.now());
        this.activeNodes.push({ node: src, gain: g });
    }

    /**
     * Cicada texture — bandpass noise with tremolo, warm afternoon feel.
     */
    _cicada(vol) {
        const now = this.now();
        const n   = this._noiseNode(6);
        const f   = this.bq("bandpass", 4200, 5.0);
        const g   = this.context.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + 4.0);

        // Tremolo — cicadas pulse
        const lfo  = this.osc("sine", 7 + Math.random() * 3);
        const lfoG = this.context.createGain();
        lfoG.gain.value = vol * 0.5;
        lfo.connect(lfoG); lfoG.connect(g.gain);

        n.connect(f); f.connect(g); g.connect(this.dryBus);
        n.start(now); lfo.start(now);
        this.activeNodes.push({ node: n, gain: g });
        this.activeNodes.push({ node: lfo, gain: lfoG });
    }

    /**
     * Rain layer — shaped brownian noise for rain sound.
     */
    _rainLayer(freq, Q, vol) {
        const now = this.now();
        const n   = this._noiseNode(8);
        const f   = this.bq("bandpass", freq, Q);
        const g   = this.context.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + 1.8);
        n.connect(f); f.connect(g); g.connect(this.dryBus);
        n.start(now);
        this.activeNodes.push({ node: n, gain: g });
    }

    /**
     * Wind layer — lowpass noise, breathlike.
     */
    _windLayer(cutoff, vol) {
        const now = this.now();
        const n   = this._noiseNode(8);
        const f   = this.bq("lowpass", cutoff, 0.4);
        const g   = this.context.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + 3.5);
        n.connect(f); f.connect(g); g.connect(this.dryBus);
        n.start(now);
        this.activeNodes.push({ node: n, gain: g });
    }

    /**
     * Thunder — deep low crack with tail.
     */
    _thunder() {
        if (!this.context || this.context.state !== "running") return;
        const now = this.now();
        const n   = this._noiseNode(2);
        const f   = this.bq("lowpass", 140, 2.0);
        const g   = this.context.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.14, now + 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
        n.connect(f); f.connect(g); g.connect(this.dryBus);
        n.start(now); n.stop(now + 3.0);
    }

    _scheduleThunder() {
        const fire = () => {
            if (!this.ambientEnabled) return;
            this._thunder();
            const id = setTimeout(fire, 11000 + Math.random() * 20000);
            this.timers.push(id);
        };
        const id = setTimeout(fire, 4000 + Math.random() * 8000);
        this.timers.push(id);
    }

    /**
     * Scheduled chord stabs — soft piano chords.
     */
    _scheduleChords(chordSets, vol, minDelay, maxDelay) {
        let idx = 0;
        const play = () => {
            if (!this.ambientEnabled || !this.context) return;
            const chord = chordSets[idx % chordSets.length];
            idx++;
            chord.forEach((freq, i) => {
                const t = this.now() + i * 0.15;
                const osc = this.osc("sine", freq);
                const g   = this.context.createGain();
                g.gain.setValueAtTime(0.0001, t);
                g.gain.linearRampToValueAtTime(vol * (1 - i * 0.12), t + 0.06);
                g.gain.exponentialRampToValueAtTime(vol * 0.3, t + 1.5);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);
                osc.connect(g); g.connect(this.reverb);
                osc.start(t); osc.stop(t + 4.2);
            });
            const id = setTimeout(play, minDelay + Math.random() * (maxDelay - minDelay));
            this.timers.push(id);
        };
        const id = setTimeout(play, 1200 + Math.random() * 2000);
        this.timers.push(id);
    }

    // ── SCHEDULING HELPERS ────────────────────────────────────────────────────

    /**
     * Schedule an array of actions randomly, looping forever.
     */
    _schedule(actions, minDelay, maxDelay) {
        const fire = () => {
            if (!this.ambientEnabled || !this.context) return;
            const action = actions[Math.floor(Math.random() * actions.length)];
            action();
            const id = setTimeout(fire, minDelay + Math.random() * (maxDelay - minDelay));
            this.timers.push(id);
        };
        const id = setTimeout(fire, 200 + Math.random() * minDelay);
        this.timers.push(id);
    }

    /**
     * Schedule a one-shot action with random delay. Optionally repeat.
     */
    _scheduleOnce(action, minDelay, maxDelay, repeat = false) {
        const fire = () => {
            if (!this.ambientEnabled || !this.context) return;
            action();
            if (repeat) {
                const id = setTimeout(fire, minDelay + Math.random() * (maxDelay - minDelay));
                this.timers.push(id);
            }
        };
        const id = setTimeout(fire, minDelay + Math.random() * (maxDelay - minDelay));
        this.timers.push(id);
    }

    // ── WEB AUDIO PRIMITIVES ──────────────────────────────────────────────────

    now() { return this.context.currentTime; }

    osc(type, freq) {
        const o = this.context.createOscillator();
        o.type = type; o.frequency.value = freq; return o;
    }

    bq(type, freq, Q = 1) {
        const f = this.context.createBiquadFilter();
        f.type = type; f.frequency.value = freq; f.Q.value = Q; return f;
    }

    _noiseNode(durationSec = 6) {
        const sr  = this.context.sampleRate;
        const len = Math.floor(sr * durationSec);
        const buf = this.context.createBuffer(1, len, sr);
        const ch  = buf.getChannelData(0);
        let last  = 0;
        for (let i = 0; i < len; i++) {
            const w = Math.random() * 2 - 1;
            last = (last + 0.02 * w) / 1.02;
            ch[i] = last * 3.5;
        }
        const src = this.context.createBufferSource();
        src.buffer = buf; src.loop = true; return src;
    }

    // ── CONTEXT + REVERB SETUP ────────────────────────────────────────────────

    async ensureContext() {
        if (this.context) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error("Web Audio not supported.");

        this.context = new AC({ latencyHint: "playback", sampleRate: 44100 });

        // Master output — high volume
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = this.reducedEffects ? 0.12 : 0.28;
        this.masterGain.connect(this.context.destination);

        // Convolution reverb — gives the warm Ghibli spaciousness
        this.reverb = this._buildReverb(2.6);
        this.reverbGain = this.context.createGain();
        this.reverbGain.gain.value = 0.38;
        this.reverb.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);

        // Dry signal bus (no reverb, slightly quieter)
        this.dryBus = this.context.createGain();
        this.dryBus.gain.value = 0.42;
        this.dryBus.connect(this.masterGain);

        // SFX bus
        this.sfxBus = this.context.createGain();
        this.sfxBus.gain.value = 0.65;
        this.sfxBus.connect(this.masterGain);

        // iOS Safari unlock
        const silent = this.context.createBuffer(1, 1, this.context.sampleRate);
        const s = this.context.createBufferSource();
        s.buffer = silent; s.connect(this.context.destination); s.start(0);
    }

    _buildReverb(durationSec = 2.6) {
        const sr  = this.context.sampleRate;
        const len = Math.floor(sr * durationSec);
        const buf = this.context.createBuffer(2, len, sr);
        for (let ch = 0; ch < 2; ch++) {
            const data = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                // Exponential decay with slight early reflections
                const decay = Math.pow(1 - i / len, 2.2);
                data[i] = (Math.random() * 2 - 1) * decay;
                // Early reflection peaks
                if (i < sr * 0.04) data[i] *= 1.6;
            }
        }
        const conv = this.context.createConvolver();
        conv.buffer = buf;
        return conv;
    }

    notify(type, detail = {}) {
        this.onStateChange({ type, unlocked: this.unlocked, ambientEnabled: this.ambientEnabled, ...detail });
    }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }