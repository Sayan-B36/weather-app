import { AmbientAudio } from "./ambient-audio.js";
import { MotionController } from "./motion-controller.js";
import { SceneController } from "./scene-controller.js";
import { renderWeatherIllustration, renderHeroParticles, getWeatherIcon } from "./weather-illustrations.js";

const FEATURED_CITIES = ["Kolkata", "New York", "Tokyo", "Cape Town", "Reykjavik", "Sao Paulo"];

const THEME_PRESETS = {
    "clear-day": {
        accent: "#96f1ff", accentStrong: "#ffbf74",
        sceneStart: "#07152c", sceneMid: "#204c86", sceneEnd: "#ffb36b",
        liquidA: "rgba(151, 230, 255, 0.36)", liquidB: "rgba(255, 208, 136, 0.32)", liquidC: "rgba(102, 161, 255, 0.22)",
        glassSurface: "rgba(11, 24, 47, 0.46)", glassStrong: "rgba(9, 18, 38, 0.72)", glassEdge: "rgba(255, 255, 255, 0.16)",
        cardGlow: "rgba(147, 217, 255, 0.34)", shadowColor: "rgba(5, 18, 42, 0.34)",
        label: "Sunlit horizon", summary: "Warm gradients, luminous glass edges, and soft atmospheric lift."
    },
    "clear-night": {
        accent: "#abc6ff", accentStrong: "#95f1da",
        sceneStart: "#040714", sceneMid: "#0f2143", sceneEnd: "#142d5d",
        liquidA: "rgba(121, 155, 255, 0.26)", liquidB: "rgba(135, 235, 215, 0.22)", liquidC: "rgba(255, 255, 255, 0.1)",
        glassSurface: "rgba(9, 15, 31, 0.54)", glassStrong: "rgba(5, 9, 21, 0.78)", glassEdge: "rgba(196, 211, 255, 0.16)",
        cardGlow: "rgba(132, 166, 255, 0.28)", shadowColor: "rgba(4, 8, 20, 0.42)",
        label: "Nocturne skyline", summary: "Subdued midnight glass with quiet drift, cool glow, and restrained shimmer."
    },
    "cloud-day": {
        accent: "#a7dfff", accentStrong: "#e7f6ff",
        sceneStart: "#162438", sceneMid: "#5e7895", sceneEnd: "#c7d6e6",
        liquidA: "rgba(204, 232, 255, 0.28)", liquidB: "rgba(163, 196, 230, 0.28)", liquidC: "rgba(255, 255, 255, 0.12)",
        glassSurface: "rgba(14, 22, 34, 0.48)", glassStrong: "rgba(10, 16, 28, 0.74)", glassEdge: "rgba(255, 255, 255, 0.17)",
        cardGlow: "rgba(198, 222, 240, 0.28)", shadowColor: "rgba(14, 24, 37, 0.36)",
        label: "Layered overcast", summary: "Cloud bands move slowly across a soft silver palette with diffused depth."
    },
    "cloud-night": {
        accent: "#b6cbf5", accentStrong: "#dce6ff",
        sceneStart: "#08111f", sceneMid: "#223146", sceneEnd: "#4c5a74",
        liquidA: "rgba(183, 206, 255, 0.22)", liquidB: "rgba(116, 144, 189, 0.22)", liquidC: "rgba(255, 255, 255, 0.08)",
        glassSurface: "rgba(10, 15, 28, 0.54)", glassStrong: "rgba(6, 10, 20, 0.8)", glassEdge: "rgba(193, 210, 255, 0.16)",
        cardGlow: "rgba(157, 179, 223, 0.24)", shadowColor: "rgba(5, 9, 18, 0.44)",
        label: "Moonlit cloudbank", summary: "Soft cloud cover, dim highlights, and slow floating layers in deep blue air."
    },
    "rain-day": {
        accent: "#8bdcff", accentStrong: "#8ff0db",
        sceneStart: "#071627", sceneMid: "#20455d", sceneEnd: "#567a95",
        liquidA: "rgba(123, 214, 255, 0.22)", liquidB: "rgba(138, 234, 216, 0.2)", liquidC: "rgba(255, 255, 255, 0.08)",
        glassSurface: "rgba(8, 18, 30, 0.54)", glassStrong: "rgba(5, 11, 21, 0.8)", glassEdge: "rgba(210, 239, 255, 0.15)",
        cardGlow: "rgba(128, 211, 247, 0.3)", shadowColor: "rgba(4, 11, 21, 0.46)",
        label: "Rain sweep", summary: "Flowing droplets, cool contrast, and liquid refraction moving beneath the glass."
    },
    "rain-night": {
        accent: "#93c4ff", accentStrong: "#7be7df",
        sceneStart: "#020814", sceneMid: "#0e2643", sceneEnd: "#204565",
        liquidA: "rgba(113, 165, 255, 0.22)", liquidB: "rgba(120, 226, 220, 0.18)", liquidC: "rgba(255, 255, 255, 0.06)",
        glassSurface: "rgba(8, 14, 27, 0.58)", glassStrong: "rgba(4, 8, 17, 0.84)", glassEdge: "rgba(188, 216, 255, 0.16)",
        cardGlow: "rgba(112, 160, 255, 0.28)", shadowColor: "rgba(2, 6, 14, 0.5)",
        label: "After-hours rainfall", summary: "Thin luminous rain, reflective depth, and cinematic blue-black atmosphere."
    },
    storm: {
        accent: "#bad0ff", accentStrong: "#8df8f3",
        sceneStart: "#030813", sceneMid: "#122542", sceneEnd: "#304b71",
        liquidA: "rgba(156, 186, 255, 0.24)", liquidB: "rgba(143, 240, 235, 0.18)", liquidC: "rgba(255, 255, 255, 0.09)",
        glassSurface: "rgba(7, 12, 24, 0.6)", glassStrong: "rgba(3, 7, 15, 0.86)", glassEdge: "rgba(203, 223, 255, 0.18)",
        cardGlow: "rgba(163, 198, 255, 0.32)", shadowColor: "rgba(2, 6, 14, 0.54)",
        label: "Electric front", summary: "Charged air, restrained flashes, and deep pressure moving across the frame."
    },
    snow: {
        accent: "#dff2ff", accentStrong: "#9fd9ff",
        sceneStart: "#0b172d", sceneMid: "#516789", sceneEnd: "#d0deea",
        liquidA: "rgba(231, 245, 255, 0.28)", liquidB: "rgba(169, 218, 255, 0.2)", liquidC: "rgba(255, 255, 255, 0.12)",
        glassSurface: "rgba(10, 18, 32, 0.48)", glassStrong: "rgba(7, 13, 24, 0.74)", glassEdge: "rgba(248, 252, 255, 0.18)",
        cardGlow: "rgba(224, 242, 255, 0.28)", shadowColor: "rgba(7, 15, 29, 0.38)",
        label: "Winter drift", summary: "Crystalline highlights, soft flurries, and quiet depth in cold air."
    },
    mist: {
        accent: "#d8e7f1", accentStrong: "#b8dae2",
        sceneStart: "#12202c", sceneMid: "#55636f", sceneEnd: "#8f9ba4",
        liquidA: "rgba(230, 236, 242, 0.18)", liquidB: "rgba(177, 205, 214, 0.2)", liquidC: "rgba(255, 255, 255, 0.08)",
        glassSurface: "rgba(15, 22, 29, 0.5)", glassStrong: "rgba(10, 15, 22, 0.78)", glassEdge: "rgba(243, 248, 255, 0.14)",
        cardGlow: "rgba(224, 233, 240, 0.22)", shadowColor: "rgba(10, 15, 20, 0.42)",
        label: "Low-visibility veil", summary: "Blurred depth, suspended haze, and softened glass contours."
    }
};

export function createWeatherApp() {
    const elements = getElements();

    if (!elements) {
        console.error("Atmosfera could not initialize because required DOM nodes are missing.");
        return;
    }

    const root = document.documentElement;
    const reduceMotionQuery = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : { matches: false, addEventListener: () => {} };

    const state = {
        activeWeather: null,
        reduceMotion: Boolean(reduceMotionQuery.matches),
        cache: new Map(),
        suggestions: [],
        suggestionIndex: -1,
        suggestionQuery: "",
        suggestionRequestId: 0,
        selectedSuggestion: null,
        audioEnabled: true,
        audioUnlocked: false,
        audioPending: null
    };

    const audio  = new AmbientAudio({ onStateChange: handleAudioStateChange });
    const scene  = new SceneController(elements.sceneCanvas);
    const motion = new MotionController(document);

    const debouncedCitySearch = debounce((query) => {
        const q = query.trim();
        if (q.length < 2) {
            hideSuggestions();
            return;
        }
        void requestSuggestions(q);
    }, 180);

    audio.setReducedEffects(state.reduceMotion);
    renderLoadingState(elements);
    renderRecentStrip();
    updateMotionState(elements, state.reduceMotion);
    updateAudioUi();
    motion.init({
        reduceMotion: state.reduceMotion,
        onUiClick: () => audio.playUiTone("click"),
        onUiHover: () => audio.playUiTone("hover")
    });
    bindEvents();
    hydrateFeaturedCities();
    loadDefaultCity();

    // ── INIT ──────────────────────────────────────────────────────────────────

    async function loadDefaultCity() {
        const savedSelection = getLastSelection();
        if (savedSelection) {
            state.selectedSuggestion = savedSelection;
            elements.cityInput.value = savedSelection.label || savedSelection.query || savedSelection.city || "";
            if (hasSelectionCoordinates(savedSelection)) {
                await fetchAndRenderWeather(
                    { lat: savedSelection.lat, lon: savedSelection.lon, days: 5 },
                    { source: "manual", announce: false, selection: savedSelection }
                );
                return;
            }
            if (savedSelection.query) {
                await fetchAndRenderWeather(
                    { city: savedSelection.query, days: 5 },
                    { source: "manual", announce: false, selection: savedSelection }
                );
                return;
            }
        }

        const savedCity = safeLocalStorageGet("atmosfera:last-city") || "Kolkata";
        elements.cityInput.value = savedCity;
        await fetchAndRenderWeather({ city: savedCity, days: 5 }, { source: "manual", announce: false });
    }

    // ── EVENTS ────────────────────────────────────────────────────────────────

    function bindEvents() {
        elements.searchForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const city = elements.cityInput.value.trim();
            if (!city) {
                showStatus("Enter a city to stage the live forecast.", "info");
                return;
            }
            await performSearch(city);
        });

        elements.geoButton.addEventListener("click", async () => {
            setAppState("loading");
            showStatus("Detecting your location...", "info");

            // ── LOCATION STRATEGY ─────────────────────────────────────────
            // Stage 1 (mobile/GPS): Browser geolocation with high accuracy.
            //   Only TRUSTED if accuracy < 2000m — means real GPS signal.
            //   On PC/laptop accuracy is typically 10,000–50,000m (WiFi),
            //   which is completely unreliable. We skip it in that case.
            //
            // Stage 2 (PC/laptop): /api/ip-locate — server reads the real
            //   client IP from request headers (X-Forwarded-For on Render),
            //   calls ip-api.com over HTTP (fine in Node.js, blocked in
            //   browser HTTPS), gets actual ISP city, then snaps to nearest
            //   known Indian city within 80km via haversine.
            //
            // Stage 3 (fallback): /api/weather?city=auto:ip — WeatherAPI's
            //   own IP detection. Less accurate but always available.
            // ─────────────────────────────────────────────────────────────

            // Stage 1: Try browser GPS
            let gpsCoords = null;
            if (navigator.geolocation) {
                gpsCoords = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        ({ coords }) => resolve({
                            lat: coords.latitude,
                            lon: coords.longitude,
                            accuracy: coords.accuracy
                        }),
                        () => resolve(null),
                        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                    );
                });
            }

            // Only use GPS if accuracy is good enough — real GPS on a phone
            // PC WiFi geolocation is 10,000–50,000m — completely wrong
            if (gpsCoords && gpsCoords.accuracy < 2000) {
                showStatus(`GPS acquired (±${Math.round(gpsCoords.accuracy)}m) — resolving city...`, "info");
                try {
                    const locateRes  = await fetch(`/api/locate?lat=${gpsCoords.lat}&lon=${gpsCoords.lon}`);
                    const locateData = locateRes.ok ? await locateRes.json() : null;
                    const cityToFetch = locateData?.resolvedCity || `${gpsCoords.lat},${gpsCoords.lon}`;
                    if (locateData?.displayName) elements.cityInput.value = locateData.displayName;
                    await fetchAndRenderWeather({ city: cityToFetch, days: 5 }, { source: "location", announce: true });
                    return;
                } catch (err) {
                    console.warn("Atmosfera: GPS locate failed", err);
                }
            }

            // Stage 2: Server-side IP geolocation (works on PC, works on Render)
            showStatus("Using IP-based location...", "info");
            try {
                const ipRes  = await fetch("/api/ip-locate");
                const ipData = ipRes.ok ? await ipRes.json() : null;

                if (ipData && !ipData.error) {
                    const cityToFetch = ipData.resolvedCity || `${ipData.lat},${ipData.lon}`;
                    if (ipData.displayName) elements.cityInput.value = ipData.displayName;
                    await fetchAndRenderWeather({ city: cityToFetch, days: 5 }, { source: "location", announce: true });
                    return;
                }
            } catch (err) {
                console.warn("Atmosfera: /api/ip-locate failed", err);
            }

            // Stage 3: WeatherAPI auto:ip — last resort
            try {
                const autoRes  = await fetch("/api/weather?city=auto:ip&days=5");
                const autoData = autoRes.ok ? await autoRes.json() : null;
                if (autoData?.location?.name) {
                    const cityName = autoData.location.name;
                    elements.cityInput.value = autoData.location.displayName || cityName;
                    state.activeWeather = autoData;
                    state.selectedSuggestion = normalizeSelectionEntry(buildSelectionFromWeather(autoData));
                    storeRecentSelection(state.selectedSuggestion);
                    storeLastSelection(state.selectedSuggestion);
                    renderWeather(autoData, "location");
                    setAppState("success");
                    showStatus(`Live weather updated for ${autoData.location.displayName || cityName}.`, "success");
                    announceLive(`Live weather updated for ${autoData.location.displayName || cityName}.`);
                    return;
                }
            } catch (err) {
                console.warn("Atmosfera: auto:ip fallback failed", err);
            }

            showStatus("Could not detect location. Please search your city manually.", "error");
            setAppState(state.activeWeather ? "success" : "idle");
        });

        elements.cityInput.addEventListener("input", () => {
            const value = elements.cityInput.value.trim();
            if (state.selectedSuggestion && !selectionMatchesInput(state.selectedSuggestion, value)) {
                state.selectedSuggestion = null;
            }
            debouncedCitySearch(value);
        });

        elements.cityInput.addEventListener("focus", () => {
            const value = elements.cityInput.value.trim();
            if (value.length >= 2) {
                void requestSuggestions(value);
            }
        });

        elements.cityInput.addEventListener("keydown", async (event) => {
            if (elements.suggestionList.hidden || state.suggestions.length === 0) return;

            if (event.key === "ArrowDown") {
                event.preventDefault();
                state.suggestionIndex = (state.suggestionIndex + 1) % state.suggestions.length;
                paintSuggestions();
                return;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                state.suggestionIndex = (state.suggestionIndex - 1 + state.suggestions.length) % state.suggestions.length;
                paintSuggestions();
                return;
            }
            if (event.key === "Escape") {
                hideSuggestions();
                return;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                const suggestion = state.suggestions[state.suggestionIndex >= 0 ? state.suggestionIndex : 0];
                await selectSuggestion(suggestion);
            }
        });

        elements.suggestionList.addEventListener("mousedown", async (event) => {
            const button = event.target.closest("button[data-index]");
            if (!button) return;
            event.preventDefault();
            const index = Number(button.dataset.index);
            const suggestion = state.suggestions[index];
            await selectSuggestion(suggestion);
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".field-shell")) {
                hideSuggestions();
            }
        });

        elements.mapLink.addEventListener("click", (event) => {
            if (elements.mapLink.getAttribute("aria-disabled") === "true") {
                event.preventDefault();
            }
        });

        elements.recentStrip.addEventListener("click", async (event) => {
            const button = event.target.closest("button[data-query]");
            if (!button) return;
            const selection = buildSelectionFromDataset(button.dataset);
            await selectStoredSelection(selection);
        });

        elements.watchlistGrid.addEventListener("click", async (event) => {
            const button = event.target.closest("button[data-city]");
            if (!button) return;
            const city = button.dataset.city || "";
            elements.cityInput.value = city;
            await fetchAndRenderWeather({ city, days: 5 }, { source: "manual", announce: true });
        });

        elements.audioButton.addEventListener("click", async () => {
            const nextEnabled = !state.audioEnabled;
            state.audioEnabled = nextEnabled;
            const themeKey = state.activeWeather ? deriveThemeKey(state.activeWeather) : "clear-day";
            const localHour = state.activeWeather
                ? new Date(state.activeWeather.location.localTimeEpoch * 1000).getHours()
                : new Date().getHours();

            if (nextEnabled) {
                const pendingScene = state.audioPending || { themeKey, localHour };
                const result = await audio.setAmbientEnabled(true, pendingScene.themeKey, pendingScene.localHour);
                if (!result.ok) {
                    state.audioPending = pendingScene;
                    showStatus("Tap anywhere on the page to unlock audio.", "info");
                }
            } else {
                audio.stop();
                showStatus("Sound muted.", "info");
            }
            updateAudioUi();
        });

        if (typeof reduceMotionQuery.addEventListener === "function") {
            reduceMotionQuery.addEventListener("change", handleMotionChange);
        } else if (typeof reduceMotionQuery.addListener === "function") {
            reduceMotionQuery.addListener(handleMotionChange);
        }
    }

    function handleMotionChange(event) {
        state.reduceMotion = Boolean(event.matches);
        audio.setReducedEffects(state.reduceMotion);
        updateMotionState(elements, state.reduceMotion);
        motion.setReducedMotion(state.reduceMotion);
        if (state.activeWeather) {
            const themeKey = deriveThemeKey(state.activeWeather);
            applyTheme(themeKey);
            scene.play(themeKey, state.reduceMotion);
        }
    }

    // ── FETCH + RENDER ────────────────────────────────────────────────────────

    async function requestSuggestions(query, options = {}) {
        const { paint = true } = options;
        const q = query.trim();
        if (q.length < 2) {
            if (paint) hideSuggestions();
            return [];
        }

        const requestId = ++state.suggestionRequestId;
        try {
            const response = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
            if (requestId !== state.suggestionRequestId) return [];
            if (!response.ok) {
                if (paint) hideSuggestions();
                return [];
            }

            const cities = await response.json();
            if (requestId !== state.suggestionRequestId) return [];
            if (!Array.isArray(cities) || cities.length === 0) {
                if (paint) hideSuggestions();
                else {
                    state.suggestions = [];
                    state.suggestionIndex = -1;
                    state.suggestionQuery = q;
                }
                return [];
            }

            state.suggestions = cities;
            state.suggestionIndex = -1;
            state.suggestionQuery = q;
            if (paint) paintSuggestions();
            return cities;
        } catch {
            if (requestId === state.suggestionRequestId && paint) hideSuggestions();
            return [];
        }
    }

    async function resolvePrimarySuggestion(query) {
        const q = query.trim();
        if (q.length < 2) return null;
        const normalizedQuery = normalizeSearchValue(q);
        const hasFreshSuggestions =
            state.suggestions.length > 0 &&
            normalizeSearchValue(state.suggestionQuery) === normalizedQuery;

        if (!hasFreshSuggestions) {
            const fresh = await requestSuggestions(q, { paint: false });
            return fresh[0] || null;
        }

        return state.suggestions[state.suggestionIndex >= 0 ? state.suggestionIndex : 0] || null;
    }

    async function performSearch(query) {
        if (state.selectedSuggestion && selectionMatchesInput(state.selectedSuggestion, query)) {
            await selectStoredSelection(state.selectedSuggestion);
            return;
        }

        const primarySuggestion = await resolvePrimarySuggestion(query);
        if (primarySuggestion) {
            await selectSuggestion(primarySuggestion);
            return;
        }

        state.selectedSuggestion = null;
        hideSuggestions();
        await fetchAndRenderWeather({ city: query, days: 5 }, { source: "manual", announce: true });
    }

    async function selectSuggestion(suggestion) {
        if (!suggestion) return;
        const selection = buildSelectionFromSuggestion(suggestion);
        await selectStoredSelection(selection);
    }

    async function selectStoredSelection(selection) {
        if (!selection) return;
        const normalizedSelection = normalizeSelectionEntry(selection);
        state.selectedSuggestion = normalizedSelection;
        elements.cityInput.value = normalizedSelection.label || normalizedSelection.query || normalizedSelection.city || "";
        hideSuggestions();

        if (hasSelectionCoordinates(normalizedSelection)) {
            await fetchAndRenderWeather(
                { lat: normalizedSelection.lat, lon: normalizedSelection.lon, days: 5 },
                { source: "manual", announce: true, selection: normalizedSelection }
            );
            return;
        }

        const fallbackQuery = normalizedSelection.query || normalizedSelection.city || elements.cityInput.value.trim();
        await fetchAndRenderWeather(
            { city: fallbackQuery, days: 5 },
            { source: "manual", announce: true, selection: normalizedSelection }
        );
    }

    async function fetchAndRenderWeather(params, options = {}) {
        const { source = "manual", announce = true, selection = null } = options;
        const previousWeather = state.activeWeather;
        setAppState("loading");
        showStatus("Loading weather intelligence...", "info");
        renderLoadingState(elements);

        try {
            const weather = await fetchWeather(params);
            state.activeWeather = weather;
            const storedSelection = normalizeSelectionEntry(selection || buildSelectionFromWeather(weather));
            state.selectedSuggestion = storedSelection;
            if (storedSelection) {
                storeRecentSelection(storedSelection);
                storeLastSelection(storedSelection);
                if (storedSelection.label) {
                    elements.cityInput.value = storedSelection.label;
                }
            }

            renderWeather(weather, source);
            setAppState("success");
            const locationName = weather.location.displayName || weather.location.name || "your selected location";
            const bannerMessage = `Live weather updated for ${locationName}.`;
            showStatus(bannerMessage, "success");
            if (announce) announceLive(bannerMessage);
        } catch (error) {
            if (error?.code === "AMBIGUOUS_LOCATION" && Array.isArray(error.suggestions) && error.suggestions.length > 0) {
                state.activeWeather = previousWeather;
                if (previousWeather) {
                    renderWeather(previousWeather, source);
                    setAppState("success");
                } else {
                    setAppState("idle");
                }
                state.suggestions = error.suggestions;
                state.suggestionIndex = -1;
                state.suggestionQuery = elements.cityInput.value.trim();
                paintSuggestions();
                const message = error?.message || "Select a city from the suggestions.";
                showStatus(message, "info");
                if (announce) announceLive(message);
                return;
            }

            const message = error?.message || "Weather data is unavailable right now.";
            setAppState("error");
            renderFallbackState(elements, message);
            scene.play("clear-night", state.reduceMotion);
            showStatus(message, "error");
            announceLive(message);
        }
    }

    function renderWeather(weather, source) {
        const themeKey = deriveThemeKey(weather);
        const theme    = THEME_PRESETS[themeKey];
        const today    = weather.forecastDays[0] || {};
        const locationName = weather.location.displayName || weather.location.name || "Unknown location";

        elements.heroEyebrow.textContent     = `Updated ${formatDateTime(weather.current.updatedAtEpoch || weather.current.updatedAt, weather.location.timezone)}`;
        elements.heroContextChip.textContent = source === "location" ? "Current location" : "Manual search";
        elements.heroTitle.textContent       = locationName;
        // Use stat pills format
        elements.heroDescription.innerHTML = `
            <div class="hero-stat-pills">
                <span class="hero-stat-pill"><span class="hero-stat-pill-icon">👁️</span> ${escapeHtml(String(weather.current.visibilityKm))} km visibility</span>
                <span class="hero-stat-pill"><span class="hero-stat-pill-icon">💨</span> ${escapeHtml(String(weather.current.windKph))} kph wind</span>
                <span class="hero-stat-pill"><span class="hero-stat-pill-icon">🌧️</span> ${escapeHtml(String(today.chanceOfRain ?? 0))}% rain</span>
                <span class="hero-stat-pill"><span class="hero-stat-pill-icon">💧</span> ${escapeHtml(String(weather.current.humidity))}% humidity</span>
            </div>
        `;
        elements.heroTemperature.textContent = formatTemperature(weather.current.temperatureC);
        elements.heroCondition.innerHTML     = `<span class="condition-badge"><span class="condition-badge-icon">${getWeatherIcon(weather.current.conditionText, weather.current.isDay)}</span>${escapeHtml(weather.current.conditionText)}</span>`;
        elements.heroHighLow.textContent     = `High ${formatTemperature(today.maxTempC)} / Low ${formatTemperature(today.minTempC)}`;
        elements.heroFeelsLike.textContent   = `Feels like ${formatTemperature(weather.current.feelsLikeC)}`;
        elements.localTime.textContent       = formatClock(weather.location.localTimeEpoch || weather.location.localTime, weather.location.timezone);
        elements.localDate.textContent       = formatFullDate(weather.location.localTimeEpoch || weather.location.localTime, weather.location.timezone);
        elements.sunCycle.textContent        = weather.current.isDay ? "Daylight active" : "Night mode";
        elements.sunTimes.textContent        = `Sunrise ${weather.astro.sunrise || "--"} / Sunset ${weather.astro.sunset || "--"}`;
        elements.sceneLabel.textContent      = theme.label;
        elements.sceneSummary.textContent    = state.reduceMotion
            ? `${theme.summary} Motion is reduced.`
            : theme.summary;

        applyTheme(themeKey);
        // Render contextual weather illustration + particles
        const heroPanel = elements.pageRoot.querySelector(".panel-hero");
        if (heroPanel) {
            renderWeatherIllustration(heroPanel, weather.current.conditionText, weather.current.isDay);
            renderHeroParticles(heroPanel, themeKey);
        }
        renderDetails(weather);
        renderHourly(weather);
        renderForecast(weather);
        renderMap(weather);
        renderFacts(weather);
        renderRecentStrip();
        scene.play(themeKey, state.reduceMotion);
        motion.refresh(elements.pageRoot);
        motion.animateWeatherRefresh(elements.pageRoot);

        const _localHour = state.activeWeather
            ? new Date(state.activeWeather.location.localTimeEpoch * 1000).getHours()
            : new Date().getHours();

        if (state.audioEnabled) {
            audio.play(themeKey, _localHour).then((result) => {
                if (result.ok) return;
                state.audioPending = { themeKey, localHour: _localHour };
                updateAudioUi();
            });
        } else {
            state.audioPending = { themeKey, localHour: _localHour };
        }
    }

    function renderDetails(weather) {
        const uv = weather.current.uv;
        const uvPct = Math.min((uv / 11) * 100, 100);
        const cards = [
            { metric: "feels-like",  label: "Feels like",    value: formatTemperature(weather.current.feelsLikeC), meta: "Perceived air temperature", icon: "🌡️" },
            { metric: "humidity",    label: "Humidity",      value: `${weather.current.humidity}%`,                meta: "Moisture level in the air", icon: "💧" },
            { metric: "wind",        label: "Wind",          value: `${weather.current.windKph} kph`,             meta: `${weather.current.windDirection} · ${weather.current.windDegree}°`, icon: "🌬️" },
            { metric: "uv",          label: "UV index",      value: `${weather.current.uv}`,                      meta: "Sun exposure strength",      icon: "☀️", uvBar: true },
            { metric: "cloud",       label: "Cloud cover",   value: `${weather.current.cloud}%`,                  meta: "Sky saturation",             icon: "☁️" },
            { metric: "visibility",  label: "Visibility",    value: `${weather.current.visibilityKm} km`,         meta: "Clear viewing distance",     icon: "👁️" },
            { metric: "pressure",    label: "Pressure",      value: `${weather.current.pressureMb} mb`,           meta: "Surface atmospheric pressure", icon: "⬆️" },
            { metric: "precip",      label: "Precipitation", value: `${weather.current.precipMm} mm`,             meta: "Current accumulation",       icon: "🌧️" }
        ];
        elements.detailGrid.innerHTML = cards.map(({ metric, label, value, meta, icon, uvBar }) => `
            <article class="detail-card" data-card data-metric="${metric}" data-sound-hover="true" role="listitem">
                <span class="detail-card-icon">${icon}</span>
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
                <p>${escapeHtml(meta)}</p>
                ${uvBar ? `<div class="uv-bar"><div class="uv-bar-fill" style="width:${uvPct}%"></div></div>` : ""}
            </article>
        `).join("");
    }

    function renderHourly(weather) {
        elements.hourlyRail.innerHTML = weather.hourly.length
            ? weather.hourly.map((hour) => `
                <article class="hourly-card" data-card data-sound-hover="true" role="listitem">
                    <span class="hourly-time">${formatHour(hour.epoch || hour.time, weather.location.timezone)}</span>
                    <span class="hourly-icon">${getWeatherIcon(hour.conditionText, hour.isDay)}</span>
                    <strong>${formatTemperature(hour.tempC)}</strong>
                    <span class="hourly-condition">${escapeHtml(getConditionShortLabel(hour.conditionText, hour.isDay))}</span>
                    <span class="hourly-meta">🌧 ${hour.chanceOfRain}%</span>
                </article>
            `).join("")
            : `<article class="empty-card" data-card role="listitem">Hourly forecast is unavailable for this request.</article>`;
    }

    function renderForecast(weather) {
        elements.forecastGrid.innerHTML = weather.forecastDays.length
            ? weather.forecastDays.map((day, index) => `
                <article class="forecast-card ${index === 0 ? "forecast-card-current" : ""}" data-card data-sound-hover="true" role="listitem">
                    <span>${index === 0 ? "Today" : escapeHtml(day.dayName)}</span>
                    <span class="forecast-condition-icon">${getWeatherIcon(day.conditionText, true)}</span>
                    <strong style="font-size:0.95rem;letter-spacing:-0.01em">${escapeHtml(day.conditionText)}</strong>
                    <div class="forecast-temp-range">
                        <span class="forecast-temp-high">${formatTemperature(day.maxTempC)}</span>
                        <span class="forecast-temp-low">${formatTemperature(day.minTempC)}</span>
                    </div>
                    <div class="forecast-rain-bar">
                        <div class="forecast-rain-fill" style="width:${day.chanceOfRain}%"></div>
                    </div>
                    <p>🌧 ${day.chanceOfRain}% · 💨 ${day.maxWindKph} kph</p>
                </article>
            `).join("")
            : `<article class="empty-card" data-card role="listitem">Forecast data is unavailable.</article>`;
    }

    function renderMap(weather) {
        const { lat, lon, displayName } = weather.location;

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            elements.mapFrame.removeAttribute("src");
            elements.mapLink.href = "#";
            elements.mapLink.setAttribute("aria-disabled", "true");
            elements.mapLink.tabIndex = -1;
            elements.mapCaption.textContent = "Map coordinates are unavailable for this location.";
            return;
        }

        const box = {
            west:  lon - 0.32,
            east:  lon + 0.32,
            north: lat + 0.22,
            south: lat - 0.22
        };

        elements.mapFrame.src    = `https://www.openstreetmap.org/export/embed.html?bbox=${box.west},${box.south},${box.east},${box.north}&layer=mapnik&marker=${lat},${lon}`;
        elements.mapLink.href    = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=11`;
        elements.mapLink.removeAttribute("aria-disabled");
        elements.mapLink.tabIndex = 0;
        elements.mapCaption.textContent = `${displayName || weather.location.name} · ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    }

    function renderFacts(weather) {
        const today = weather.forecastDays[0] || {};
        const facts = [
            ["Region",             weather.location.region   || "Not provided"],
            ["Country",            weather.location.country  || "Not provided"],
            ["Time zone",          weather.location.timezone || "UTC"],
            ["Coordinates",        `${roundNumber(weather.location.lat)}, ${roundNumber(weather.location.lon)}`],
            ["Sunrise",            weather.astro.sunrise     || "--"],
            ["Sunset",             weather.astro.sunset      || "--"],
            ["Moon phase",         weather.astro.moonPhase   || "--"],
            ["Rain chance today",  `${today.chanceOfRain ?? 0}%`]
        ];
        elements.factsList.innerHTML = facts.map(([label, value]) => `
            <div data-card>
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
            </div>
        `).join("");
    }

    function renderRecentStrip() {
        const combined = [
            ...getRecentSelections(),
            ...FEATURED_CITIES.map((city) => normalizeSelectionEntry({ label: city, query: city, city }))
        ]
            .filter((entry, index, array) => {
                const key = `${normalizeSearchValue(entry.label || entry.query || entry.city || "")}|${entry.lat ?? ""}|${entry.lon ?? ""}`;
                return key && array.findIndex((candidate) => {
                    const candidateKey = `${normalizeSearchValue(candidate.label || candidate.query || candidate.city || "")}|${candidate.lat ?? ""}|${candidate.lon ?? ""}`;
                    return candidateKey === key;
                }) === index;
            })
            .slice(0, 8);

        elements.recentStrip.innerHTML = combined.map((entry) => `
            <button
                class="quick-pill"
                type="button"
                data-query="${escapeHtml(entry.query || entry.city || entry.label || "")}"
                data-label="${escapeHtml(entry.label || entry.query || entry.city || "")}"
                data-city="${escapeHtml(entry.city || entry.query || entry.label || "")}"
                data-lat="${entry.lat ?? ""}"
                data-lon="${entry.lon ?? ""}"
                data-country="${escapeHtml(entry.country || "")}"
                data-country-code="${escapeHtml(entry.countryCode || "")}"
                data-sound-hover="true"
            >${escapeHtml(entry.label || entry.query || entry.city || "")}</button>
        `).join("");
    }

    async function hydrateFeaturedCities() {
        elements.watchlistGrid.innerHTML = Array.from(
            { length: FEATURED_CITIES.length },
            () => `<article class="watchlist-card skeleton-card" role="listitem"></article>`
        ).join("");

        const results = await Promise.allSettled(
            FEATURED_CITIES.map((city) => fetchWeather({ city, days: 1 }))
        );

        elements.watchlistGrid.innerHTML = results.map((result, index) => {
            const city = FEATURED_CITIES[index];

            if (result.status !== "fulfilled") {
                return `
                    <button class="watchlist-card" type="button" data-city="${escapeHtml(city)}" data-card data-sound-hover="true" role="listitem">
                        <span>${escapeHtml(city)}</span>
                        <strong>Unavailable</strong>
                        <p>Tap to retry.</p>
                    </button>
                `;
            }

            const weather = result.value;
            return `
                <button class="watchlist-card" type="button" data-city="${escapeHtml(city)}" data-card data-sound-hover="true" role="listitem">
                    <span>${escapeHtml(weather.location.name)}</span>
                    <div class="watchlist-temp-row">
                        <span class="watchlist-temp">${formatTemperature(weather.current.temperatureC)}</span>
                        <span class="watchlist-icon">${getWeatherIcon(weather.current.conditionText, weather.current.isDay)}</span>
                    </div>
                    <p>${escapeHtml(weather.current.conditionText)}</p>
                </button>
            `;
        }).join("");

        motion.animateWeatherRefresh(elements.watchlistGrid);
    }

    // ── DATA ──────────────────────────────────────────────────────────────────

    async function fetchWeather(params) {
        const search = new URLSearchParams();
        search.set("days", String(params.days || 5));

        if (params.city) {
            search.set("city", params.city);
        } else if (params.lat !== undefined && params.lon !== undefined) {
            search.set("lat", String(params.lat));
            search.set("lon", String(params.lon));
        } else {
            throw new Error("fetchWeather requires city or lat/lon.");
        }

        const cacheKey = search.toString();
        if (state.cache.has(cacheKey)) return state.cache.get(cacheKey);

        const response = await fetch(`/api/weather?${search.toString()}`);
        let payload = null;

        try {
            payload = await response.json();
        } catch {
            throw new Error("Weather data could not be read from the server.");
        }

        if (!response.ok || payload?.error) {
            const error = new Error(payload?.error || "Weather data could not be loaded.");
            error.code = payload?.code || "";
            error.suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
            throw error;
        }

        state.cache.set(cacheKey, payload);
        return payload;
    }

    // ── SUGGESTIONS ───────────────────────────────────────────────────────────

    function paintSuggestions() {
        if (!state.suggestions.length) {
            hideSuggestions();
            return;
        }
        elements.suggestionList.hidden = false;
        elements.searchSection.classList.add("is-suggestions-open");
        elements.suggestionList.innerHTML = state.suggestions.map((item, index) => {
            const cityName    = item?.name        ?? item;
            const cityOnly    = item?.name        ?? item;
            const region      = item?.region      ?? "";
            const country     = item?.country     ?? "";
            const flag        = item?.flag        ?? "";
            const isActive    = index === state.suggestionIndex;
            const meta = [region, country].filter(Boolean).join(", ");
            return `
                <li role="option" aria-selected="${isActive}">
                    <button type="button" data-index="${index}"
                            class="${isActive ? "is-active" : ""}"
                            data-sound-hover="true">
                        <span class="sugg-primary">${flag ? flag + " " : ""}${escapeHtml(cityOnly)}</span>
                        ${meta ? `<span class="sugg-meta">${escapeHtml(meta)}</span>` : ""}
                    </button>
                </li>
            `;
        }).join("");
    }

    function hideSuggestions() {
        state.suggestions    = [];
        state.suggestionIndex = -1;
        state.suggestionQuery = "";
        elements.suggestionList.hidden = true;
        elements.suggestionList.innerHTML = "";
        elements.searchSection.classList.remove("is-suggestions-open");
    }

    // ── THEME ─────────────────────────────────────────────────────────────────

    function applyTheme(themeKey) {
        const theme = THEME_PRESETS[themeKey] || THEME_PRESETS["clear-day"];
        root.style.setProperty("--scene-start",   theme.sceneStart);
        root.style.setProperty("--scene-mid",     theme.sceneMid);
        root.style.setProperty("--scene-end",     theme.sceneEnd);
        root.style.setProperty("--accent",        theme.accent);
        root.style.setProperty("--accent-strong", theme.accentStrong);
        root.style.setProperty("--liquid-a",      theme.liquidA);
        root.style.setProperty("--liquid-b",      theme.liquidB);
        root.style.setProperty("--liquid-c",      theme.liquidC);
        root.style.setProperty("--glass-surface", theme.glassSurface);
        root.style.setProperty("--glass-strong",  theme.glassStrong);
        root.style.setProperty("--glass-edge",    theme.glassEdge);
        root.style.setProperty("--card-glow",     theme.cardGlow);
        root.style.setProperty("--shadow-color",  theme.shadowColor);
        elements.body.dataset.theme = themeKey;
    }

    // ── AUDIO UI ──────────────────────────────────────────────────────────────

    function updateAudioUi() {
        elements.audioButton.textContent = state.audioEnabled ? "🔊 Sound on" : "🔇 Sound off";
        elements.audioButton.setAttribute("aria-pressed", String(state.audioEnabled));
        showSoundHint(
            state.audioEnabled
                ? "Ambient sound is active — changes with weather & time"
                : "Sound is muted — click to enable"
        );
    }

    function handleAudioStateChange(change) {
        state.audioUnlocked = Boolean(change.unlocked);

        if (change.type === "unlock" && change.ok) {
            showSoundHint("Sound ready");
            if (state.audioEnabled && state.audioPending) {
                const { themeKey, localHour } = state.audioPending;
                state.audioPending = null;
                audio.play(themeKey, localHour);
            }
        }

        if (change.type === "error" && change.message) {
            showSoundHint(change.message);
        }

        updateAudioUi();
    }

    // ── STATE HELPERS ─────────────────────────────────────────────────────────

    function setAppState(status)         { elements.body.dataset.state = status; }
    function showStatus(message, tone)   {
        elements.statusBanner.hidden      = false;
        elements.statusBanner.dataset.tone = tone || "info";
        elements.statusBanner.textContent = message;
    }
    function showSoundHint(message)      { elements.soundHint.textContent = message; }
    function announceLive(message)       { elements.liveRegion.textContent = message; }
}

// ── DOM HELPERS ───────────────────────────────────────────────────────────────

function getElements() {
    const ids = [
        "body", "pageRoot", "liveRegion", "motionBadge", "soundHint",
        "audioButton", "searchSection", "searchForm", "cityInput", "geoButton", "suggestionList",
        "statusBanner", "heroEyebrow", "heroContextChip", "heroTitle",
        "heroDescription", "heroTemperature", "heroCondition", "heroHighLow",
        "heroFeelsLike", "localTime", "localDate", "sunCycle", "sunTimes",
        "sceneLabel", "sceneSummary", "recentStrip", "detailGrid",
        "hourlyRail", "forecastGrid", "mapFrame", "mapLink", "mapCaption",
        "factsList", "watchlistGrid", "sceneCanvas"
    ];

    const elements = { body: document.body };
    const missing  = [];

    for (const id of ids.slice(1)) {
        const el = document.getElementById(id);
        if (el) {
            elements[id] = el;
        } else {
            missing.push(id);
        }
    }

    if (missing.length) {
        console.error("Atmosfera: missing DOM elements →", missing.join(", "));
        return null;
    }

    return elements;
}

function renderLoadingState(elements) {
    elements.detailGrid.innerHTML  = Array.from({ length: 8 }, () => `<article class="detail-card skeleton-card" role="listitem"></article>`).join("");
    elements.hourlyRail.innerHTML  = Array.from({ length: 6 }, () => `<article class="hourly-card skeleton-card" role="listitem"></article>`).join("");
    elements.forecastGrid.innerHTML = Array.from({ length: 5 }, () => `<article class="forecast-card skeleton-card" role="listitem"></article>`).join("");
    elements.factsList.innerHTML   = Array.from({ length: 6 }, () => `<div class="facts-skeleton skeleton-card"></div>`).join("");
}

function renderFallbackState(elements, message) {
    elements.heroEyebrow.textContent     = "Weather lookup interrupted";
    elements.heroTitle.textContent       = "Could not stage that forecast.";
    elements.heroDescription.textContent = message;
    elements.heroTemperature.textContent = "--";
    elements.heroCondition.textContent   = "Try another city or your current location.";
    elements.heroHighLow.textContent     = "High -- / Low --";
    elements.heroFeelsLike.textContent   = "Feels like --";
    elements.localTime.textContent       = "--";
    elements.localDate.textContent       = "--";
    elements.sunCycle.textContent        = "--";
    elements.sunTimes.textContent        = "Sunrise -- / Sunset --";
    elements.sceneLabel.textContent      = "Idle atmosphere";
    elements.sceneSummary.textContent    = "The visual scene adapts to weather, light, and motion settings.";
    elements.mapFrame.removeAttribute("src");
    elements.mapLink.href = "#";
    elements.mapLink.setAttribute("aria-disabled", "true");
    elements.mapLink.tabIndex  = -1;
    elements.mapCaption.textContent = "Waiting for coordinates.";
    elements.detailGrid.innerHTML   = `<article class="empty-card" data-card role="listitem">${escapeHtml(message)}</article>`;
    elements.hourlyRail.innerHTML   = `<article class="empty-card" data-card role="listitem">Hourly forecast is unavailable.</article>`;
    elements.forecastGrid.innerHTML = `<article class="empty-card" data-card role="listitem">Forecast data is unavailable.</article>`;
    elements.factsList.innerHTML    = `<div data-card><dt>Status</dt><dd>Retry with another city or your current location.</dd></div>`;
}

function updateMotionState(elements, reduceMotion) {
    elements.motionBadge.hidden = !reduceMotion;
    elements.motionBadge.textContent = reduceMotion ? "Reduced motion" : "";
}

// ── THEME DERIVATION ──────────────────────────────────────────────────────────

function deriveThemeKey(weather) {
    const condition = (weather.current.conditionText || "").toLowerCase();
    const isDay     = Boolean(weather.current.isDay);

    if (condition.includes("thunder") || condition.includes("storm"))  return "storm";
    if (condition.includes("snow")    || condition.includes("sleet") || condition.includes("ice")) return "snow";
    if (condition.includes("rain")    || condition.includes("drizzle") || condition.includes("shower"))
        return isDay ? "rain-day" : "rain-night";
    if (condition.includes("fog")     || condition.includes("mist")    || condition.includes("haze")) return "mist";
    if (condition.includes("cloud")   || condition.includes("overcast"))
        return isDay ? "cloud-day" : "cloud-night";
    return isDay ? "clear-day" : "clear-night";
}

// ── CITY STORAGE ──────────────────────────────────────────────────────────────

function buildSelectionFromSuggestion(suggestion) {
    if (!suggestion) return null;
    return normalizeSelectionEntry({
        label: suggestion.displayName || [suggestion.name, suggestion.country].filter(Boolean).join(", "),
        query: suggestion.displayName || [suggestion.name, suggestion.country].filter(Boolean).join(", "),
        city: suggestion.name || "",
        region: suggestion.region || "",
        country: suggestion.country || "",
        countryCode: suggestion.countryCode || "",
        lat: suggestion.lat,
        lon: suggestion.lon
    });
}

function buildSelectionFromWeather(weather) {
    const location = weather?.location || {};
    return normalizeSelectionEntry({
        label: location.displayName || [location.name, location.country].filter(Boolean).join(", "),
        query: [location.name, location.country].filter(Boolean).join(", "),
        city: location.name || "",
        country: location.country || "",
        countryCode: location.region || "",
        lat: location.lat,
        lon: location.lon
    });
}

function buildSelectionFromDataset(dataset) {
    return normalizeSelectionEntry({
        label: dataset.label,
        query: dataset.query,
        city: dataset.city,
        country: dataset.country,
        countryCode: dataset.countryCode,
        lat: dataset.lat,
        lon: dataset.lon
    });
}

function normalizeSelectionEntry(selection) {
    if (!selection) return null;
    const label = (selection.label || selection.query || selection.city || "").trim();
    const query = (selection.query || label || selection.city || "").trim();
    const city = (selection.city || label || query || "").trim();
    const lat = selection.lat === "" || selection.lat === null || selection.lat === undefined ? null : Number(selection.lat);
    const lon = selection.lon === "" || selection.lon === null || selection.lon === undefined ? null : Number(selection.lon);

    return {
        label,
        query,
        city,
        region: selection.region || "",
        country: selection.country || "",
        countryCode: selection.countryCode || "",
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null
    };
}

function hasSelectionCoordinates(selection) {
    return Boolean(selection) && Number.isFinite(selection.lat) && Number.isFinite(selection.lon);
}

function selectionMatchesInput(selection, value) {
    const normalizedValue = normalizeSearchValue(value);
    return [
        selection?.label,
        selection?.query,
        selection?.city
    ].filter(Boolean).some((candidate) => normalizeSearchValue(candidate) === normalizedValue);
}

function normalizeSearchValue(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[^\w\s,]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function storeRecentSelection(selection) {
    const normalized = normalizeSelectionEntry(selection);
    if (!normalized || !normalized.label) return;

    const next = [normalized, ...getRecentSelections()]
        .filter((entry, index, array) => {
            const key = `${normalizeSearchValue(entry.label || entry.query || entry.city || "")}|${entry.lat ?? ""}|${entry.lon ?? ""}`;
            return key && array.findIndex((candidate) => {
                const candidateKey = `${normalizeSearchValue(candidate.label || candidate.query || candidate.city || "")}|${candidate.lat ?? ""}|${candidate.lon ?? ""}`;
                return candidateKey === key;
            }) === index;
        })
        .slice(0, 6);

    safeLocalStorageSet("atmosfera:recent-cities", JSON.stringify(next));
}

function getRecentSelections() {
    try {
        const stored = JSON.parse(safeLocalStorageGet("atmosfera:recent-cities") || "[]");
        return Array.isArray(stored)
            ? stored
                .map((entry) => typeof entry === "string"
                    ? normalizeSelectionEntry({ label: entry, query: entry, city: entry })
                    : normalizeSelectionEntry(entry))
                .filter((entry) => entry && entry.label)
            : [];
    } catch {
        return [];
    }
}

function storeLastSelection(selection) {
    const normalized = normalizeSelectionEntry(selection);
    if (!normalized || !normalized.label) return;
    safeLocalStorageSet("atmosfera:last-selection", JSON.stringify(normalized));
    safeLocalStorageSet("atmosfera:last-city", normalized.query || normalized.label || normalized.city);
}

function getLastSelection() {
    try {
        const stored = safeLocalStorageGet("atmosfera:last-selection");
        if (stored) {
            const parsed = normalizeSelectionEntry(JSON.parse(stored));
            if (parsed?.label) return parsed;
        }
    } catch {
        // ignore invalid persisted selection
    }

    const legacyCity = safeLocalStorageGet("atmosfera:last-city");
    return legacyCity ? normalizeSelectionEntry({ label: legacyCity, query: legacyCity, city: legacyCity }) : null;
}

// ── FORMATTERS ────────────────────────────────────────────────────────────────

function formatTemperature(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
    return `${Math.round(Number(value))}\u00b0C`;
}

function formatClock(value, timeZone) {
    return formatDate(value, timeZone, { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatFullDate(value, timeZone) {
    return formatDate(value, timeZone, { weekday: "long", month: "long", day: "numeric" });
}

function formatDateTime(value, timeZone) {
    return formatDate(value, timeZone, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true
    }, "just now");
}

function formatHour(value, timeZone) {
    return formatDate(value, timeZone, { hour: "numeric", hour12: true });
}

function formatDate(value, timeZone, options, fallback = "--") {
    const date = toDate(value);
    if (!date) return fallback;
    try {
        return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(date);
    } catch {
        try {
            return new Intl.DateTimeFormat("en-US", options).format(date);
        } catch {
            return fallback;
        }
    }
}

function toDate(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return new Date(value * 1000);
    }
    if (typeof value === "string" && value.trim()) {
        const normalized = value.includes("T") ? value : value.replace(" ", "T");
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
}

function getConditionShortLabel(conditionText, isDay) {
    const c = (conditionText || "").toLowerCase();
    if (c.includes("storm"))                                          return "Storm";
    if (c.includes("snow"))                                           return "Snow";
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "Rain";
    if (c.includes("fog")  || c.includes("mist")   || c.includes("haze"))    return "Mist";
    if (c.includes("cloud") || c.includes("overcast"))               return "Clouds";
    return isDay ? "Clear" : "Clear night";
}

function roundNumber(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
    return Number(value).toFixed(3);
}

function safeLocalStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
}

function safeLocalStorageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function debounce(fn, delay) {
    let id = 0;
    return (...args) => {
        window.clearTimeout(id);
        id = window.setTimeout(() => fn(...args), delay);
    };
}
