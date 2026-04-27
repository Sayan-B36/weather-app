import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT_INDEX = path.join(__dirname, "index.html");
const DIST_DIR   = path.join(__dirname, "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");

const app     = express();
const PORT    = Number(process.env.PORT || 3000);
const API_KEY = process.env.OPENWEATHER_KEY;   // ← switched from WEATHERAPI_KEY

const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const CITY_CACHE_TTL_MS    = 6 * 60 * 60 * 1000; // 6h — city names don't change
const weatherCache = new Map();
const cityCache    = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN INDIAN CITIES — direct coordinate lookup bypasses OWM search
// ambiguity entirely. Format: lowercase alias → "lat,lon" query string.
// ─────────────────────────────────────────────────────────────────────────────
const INDIA_CITY_COORDS = {
    "delhi":          "28.6139,77.2090",
    "new delhi":      "28.6139,77.2090",
    "mumbai":         "19.0760,72.8777",
    "bombay":         "19.0760,72.8777",
    "kolkata":        "22.5726,88.3639",
    "calcutta":       "22.5726,88.3639",
    "salt lake":      "22.5797,88.4280",
    "salt lake city": "22.5797,88.4280",
    "sector v":       "22.5766,88.4344",
    "bidhannagar":    "22.5797,88.4280",
    "durgapur":       "23.5204,87.3119",
    "benachity":      "23.5204,87.3119",
    "asansol":        "23.6888,86.9661",
    "kashmir":        "34.0837,74.7973",
    "srinagar":       "34.0837,74.7973",
    "jammu":          "32.7266,74.8570",
    "chandigarh":     "30.7333,76.7794",
    "bangalore":      "12.9716,77.5946",
    "bengaluru":      "12.9716,77.5946",
    "hyderabad":      "17.3850,78.4867",
    "chennai":        "13.0827,80.2707",
    "madras":         "13.0827,80.2707",
    "pune":           "18.5204,73.8567",
    "ahmedabad":      "23.0225,72.5714",
    "jaipur":         "26.9124,75.7873",
    "lucknow":        "26.8467,80.9462",
    "kanpur":         "26.4499,80.3319",
    "nagpur":         "21.1458,79.0882",
    "surat":          "21.1702,72.8311",
    "patna":          "25.5941,85.1376",
    "bhopal":         "23.2599,77.4126",
    "indore":         "22.7196,75.8577",
    "vadodara":       "22.3072,73.1812",
    "kochi":          "9.9312,76.2673",
    "cochin":         "9.9312,76.2673",
    "thiruvananthapuram": "8.5241,76.9366",
    "trivandrum":     "8.5241,76.9366",
    "visakhapatnam":  "17.6868,83.2185",
    "vizag":          "17.6868,83.2185",
    "coimbatore":     "11.0168,76.9558",
    "guwahati":       "26.1445,91.7362",
    "bhubaneswar":    "20.2961,85.8245",
    "ranchi":         "23.3441,85.3096",
    "raipur":         "21.2514,81.6296",
    "amritsar":       "31.6340,74.8723",
    "agra":           "27.1767,78.0081",
    "varanasi":       "25.3176,82.9739",
    "allahabad":      "25.4358,81.8463",
    "prayagraj":      "25.4358,81.8463",
    "meerut":         "28.9845,77.7064",
    "ghaziabad":      "28.6692,77.4538",
    "noida":          "28.5355,77.3910",
    "faridabad":      "28.4082,77.3178",
    "gurgaon":        "28.4595,77.0266",
    "gurugram":       "28.4595,77.0266",
    "thane":          "19.2183,72.9781",
    "navi mumbai":    "19.0330,73.0297",
    "jabalpur":       "23.1815,79.9864",
    "jodhpur":        "26.2389,73.0243",
    "rajkot":         "22.3039,70.8022",
    "madurai":        "9.9252,78.1198",
    "tiruchirappalli":"10.7905,78.7047",
    "mysore":         "12.2958,76.6394",
    "mysuru":         "12.2958,76.6394",
    "mangalore":      "12.9141,74.8560",
    "hubli":          "15.3647,75.1240",
    "dharwad":        "15.4589,75.0078",
    "shimla":         "31.1048,77.1734",
    "manali":         "32.2396,77.1887",
    "darjeeling":     "27.0360,88.2627",
    "gangtok":        "27.3314,88.6138",
    "shillong":       "25.5788,91.8933",
    "imphal":         "24.8170,93.9368",
    "kohima":         "25.6751,94.1086",
    "aizawl":         "23.7271,92.7176",
    "agartala":       "23.8315,91.2868",
    "panaji":         "15.4909,73.8278",
    "goa":            "15.2993,74.1240",
    "dehradun":       "30.3165,78.0322",
    "haridwar":       "29.9457,78.1642",
    "rishikesh":      "30.0869,78.2676",
    "udaipur":        "24.5854,73.7125",
    "ajmer":          "26.4499,74.6399",
    "bikaner":        "28.0229,73.3119",
    "kota":           "25.2138,75.8648",
    "siliguri":       "26.7271,88.3953",
    "jalpaiguri":     "26.5500,88.7333",
    "kharagpur":      "22.3460,87.2320",
    "barrackpur":     "22.7667,88.3667",
    "barasat":        "22.7200,88.4800",
    "howrah":         "22.5958,88.2636",
    "serampore":      "22.7500,88.3333",
    "hooghly":        "22.9000,88.3833",
    "burdwan":        "23.2324,87.8615",
    "bardhaman":      "23.2324,87.8615",
    "bankura":        "23.2300,87.0700",
    "purulia":        "23.3300,86.3667",
    "midnapore":      "22.4200,87.3200",
    "medinipur":      "22.4200,87.3200",
};

const REGION_CODES = [
    "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
    "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS",
    "BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN",
    "CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE",
    "EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF",
    "GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM",
    "HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM",
    "JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC",
    "LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK",
    "ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA",
    "NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG",
    "PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW",
    "SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS",
    "ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO",
    "TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI",
    "VN","VU","WF","WS","XK","YE","YT","ZA","ZM","ZW"
];

const COUNTRY_NAME_TO_CODE = buildCountryLookup();

app.disable("x-powered-by");
app.set("trust proxy", true); // Trust X-Forwarded-For from Render/reverse proxies

// ── WEATHER API ───────────────────────────────────────────────────────────────

app.get("/api/weather", async (req, res) => {
    if (!API_KEY) return res.status(500).json({ error: "Missing OPENWEATHER_KEY in .env" });

    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const lat  = typeof req.query.lat  === "string" ? req.query.lat.trim()  : "";
    const lon  = typeof req.query.lon  === "string" ? req.query.lon.trim()  : "";
    const days = clampDays(req.query.days);

    if (!city && !(lat && lon)) {
        return res.status(400).json({ error: "Provide city or lat+lon." });
    }

    // If city matches a known Indian city, use coordinates directly
    let query = city || `${lat},${lon}`;
    if (city) {
        const coordOverride = INDIA_CITY_COORDS[city.toLowerCase().trim()];
        if (coordOverride) query = coordOverride;
    }

    const queryType = (lat && lon && !city) ? "coordinates" : "city";
    const isAutoIp  = city.toLowerCase() === "auto:ip";
    const cacheKey  = `${query}:${days}`;
    const cached    = !isAutoIp && getCached(weatherCache, cacheKey, WEATHER_CACHE_TTL_MS);
    if (cached) return res.json(cached);

    try {
        const data       = await fetchForecast(query, days);
        const normalized = normalizeWeather(data, { query, queryType, requestedDays: days });
        weatherCache.set(cacheKey, { timestamp: Date.now(), payload: normalized });
        return res.json(normalized);
    } catch (err) {
        return res.status(err.statusCode || 502).json({ error: err.message });
    }
});

// ── CITY SEARCH API ───────────────────────────────────────────────────────────

app.get("/api/cities", async (req, res) => {
    if (!API_KEY) return res.status(500).json({ error: "Missing OPENWEATHER_KEY in .env" });

    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query.length < 2) return res.json([]);

    const cacheKey = query.toLowerCase();
    const cached   = getCached(cityCache, cacheKey, CITY_CACHE_TTL_MS);
    if (cached) return res.json(cached);

    try {
        // Detect if the query looks India-specific (Indian city name or explicit "india")
        const qLower = query.toLowerCase();
        const isIndiaQuery = qLower.includes("india") || Boolean(INDIA_CITY_COORDS[qLower]);

        // Build local coordinate-based matches for known Indian cities
        const coordMatches = Object.entries(INDIA_CITY_COORDS)
            .filter(([name]) => name.startsWith(qLower))
            .slice(0, 3)
            .map(([name, coords]) => {
                const [clat, clon] = coords.split(",").map(Number);
                return {
                    _coordMatch: true,
                    name: name.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
                    region: "India",
                    country: "IN",
                    lat: clat,
                    lon: clon,
                    url: "",
                    id: `coord-${name.replace(/\s+/g, "-")}`
                };
            });

        // Only run the India-biased parallel search when the query actually targets India
        const searches = isIndiaQuery
            ? [fetchCitySearch(query), fetchCitySearch(`${query}, India`)]
            : [fetchCitySearch(query)];

        const results = await Promise.allSettled(searches);

        const seen   = new Set();
        const indian = [];
        const others = [];

        const addResult = (item) => {
            const key = `${item.name}|${item.region}|${item.country}`.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            if (item.country === "IN") indian.push(item);
            else others.push(item);
        };

        results.forEach(r => { if (r.status === "fulfilled") r.value.forEach(addResult); });

        // For India queries: Indian cities first, then others; for global queries: global first
        const merged = isIndiaQuery
            ? [...coordMatches, ...indian, ...others]
            : [...others, ...indian];

        // Sort alphabetically by city name within each group, then cap to 5
        const sortAlpha = (a, b) => a.name.localeCompare(b.name);
        const allResults = isIndiaQuery
            ? [
                ...[...coordMatches, ...indian].sort(sortAlpha),
                ...others.sort(sortAlpha)
              ].filter((v, i, arr) => arr.findIndex(x => x.name === v.name && x.country === v.country) === i)
            : [
                ...others.sort(sortAlpha),
                ...indian.sort(sortAlpha)
              ];

        const normalized = normalizeCitySearchResults(allResults).slice(0, 5);
        cityCache.set(cacheKey, { timestamp: Date.now(), payload: normalized });
        return res.json(normalized);
    } catch (err) {
        return res.status(err.statusCode || 502).json({ error: err.message });
    }
});

// ── LOCATE: nearest city from GPS coords ─────────────────────────────────────

app.get("/api/locate", async (req, res) => {
    if (!API_KEY) return res.status(500).json({ error: "Missing OPENWEATHER_KEY in .env" });

    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Provide lat and lon." });
    }

    // Step 1: Find nearest city in our known Indian city list
    let nearest = null;
    let nearestDist = Infinity;

    for (const [name, coords] of Object.entries(INDIA_CITY_COORDS)) {
        const [clat, clon] = coords.split(",").map(Number);
        const dist = haversineKm(lat, lon, clat, clon);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = { name, lat: clat, lon: clon, dist };
        }
    }

    // Step 2: If nearest known city is within 80km, use its exact coordinates
    if (nearest && nearest.dist <= 80) {
        const displayName = nearest.name
            .split(" ")
            .map(w => w[0].toUpperCase() + w.slice(1))
            .join(" ");
        return res.json({
            resolvedCity: nearest.name,
            displayName,
            lat: nearest.lat,
            lon: nearest.lon,
            distanceKm: Math.round(nearest.dist),
            source: "local-db"
        });
    }

    // Step 3: Outside our known list — use raw coords directly
    return res.json({
        resolvedCity: null,
        displayName: null,
        lat,
        lon,
        distanceKm: null,
        source: "gps-coords"
    });
});

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── IP-BASED LOCATION (server-side) ──────────────────────────────────────────

app.get("/api/ip-locate", async (req, res) => {
    const clientIp =
        (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
        req.socket?.remoteAddress || "";
    const cleanIp = clientIp.replace(/^::ffff:/, "");

    try {
        const ipApiUrl = `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,city,regionName,country,lat,lon,isp,query`;
        const ipRes  = await fetch(ipApiUrl);
        const ipData = await ipRes.json();

        if (ipData?.status !== "success") {
            return res.status(502).json({ error: "IP geolocation failed." });
        }

        const { lat, lon, city, regionName, country, isp, query: detectedIp } = ipData;

        // Try to snap to nearest known Indian city within 80km
        let nearest = null, nearestDist = Infinity;
        for (const [name, coords] of Object.entries(INDIA_CITY_COORDS)) {
            const [clat, clon] = coords.split(",").map(Number);
            const dist = haversineKm(lat, lon, clat, clon);
            if (dist < nearestDist) { nearestDist = dist; nearest = { name, lat: clat, lon: clon, dist }; }
        }

        if (nearest && nearest.dist <= 80) {
            const displayName = nearest.name.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
            return res.json({
                resolvedCity: nearest.name, displayName,
                lat: nearest.lat, lon: nearest.lon,
                rawCity: city, rawRegion: regionName, country, isp, detectedIp,
                distanceKm: Math.round(nearest.dist), source: "ip-local-db"
            });
        }

        return res.json({
            resolvedCity: null,
            displayName: [city, regionName, country].filter(Boolean).join(", "),
            lat, lon, rawCity: city, rawRegion: regionName, country, isp, detectedIp,
            distanceKm: null, source: "ip-raw"
        });
    } catch (err) {
        return res.status(502).json({ error: "IP geolocation unavailable." });
    }
});

// ── STATIC ────────────────────────────────────────────────────────────────────

app.use((req, res, next) => {
    if (req.path.includes("node_modules") || /\/\.[^/]/.test(req.path)) {
        return res.status(403).end();
    }
    next();
});

if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR, { index: false }));
}

app.use(express.static(__dirname, {
    index: false,
    setHeaders(res, filePath) {
        if (filePath.endsWith(".css")) res.setHeader("Content-Type", "text/css");
        if (filePath.endsWith(".js"))  res.setHeader("Content-Type", "application/javascript");
    }
}));

app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found." });
    if (fs.existsSync(DIST_INDEX))   return res.sendFile(DIST_INDEX);
    if (fs.existsSync(ROOT_INDEX))   return res.sendFile(ROOT_INDEX);
    res.status(200).send("Run `npm install` then `npm start`.");
});

app.listen(PORT, () => {
    console.log(`\n  Atmosfera  →  http://localhost:${PORT}\n`);
    if (!API_KEY) console.warn("  ⚠  OPENWEATHER_KEY missing in .env\n");
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getCached(cache, key, ttlMs) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp >= ttlMs) { cache.delete(key); return null; }
    return entry.payload;
}

function clampDays(value) {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? 5 : Math.max(1, Math.min(n, 5));
}

// ── FETCH FUNCTIONS (OpenWeatherMap) ─────────────────────────────────────────

async function fetchForecast(query, days) {
    // Resolve query to lat/lon — either already "lat,lon" or a city name
    let lat, lon, resolvedName;

    if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query)) {
        // Already coordinates
        [lat, lon] = query.split(",").map(Number);
    } else {
        // City name → geocode via OWM
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`;
        const geoData = await fetchJson(geoUrl);
        if (!Array.isArray(geoData) || geoData.length === 0) {
            const err = new Error(`City not found: ${query}`);
            err.statusCode = 404;
            throw err;
        }
        lat          = geoData[0].lat;
        lon          = geoData[0].lon;
        resolvedName = geoData[0].name;
    }

    // Fetch current weather + 5-day forecast (3-hour steps, 40 entries = ~5 days) in parallel
    const currentUrl  = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=40`;

    const [currentData, forecastData] = await Promise.all([
        fetchJson(currentUrl),
        fetchJson(forecastUrl)
    ]);

    return { currentData, forecastData, lat, lon, resolvedName };
}

async function fetchCitySearch(query) {
    // OWM Geocoding API — returns up to 10 matches so we have room to sort & deduplicate
    const url  = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=10&appid=${API_KEY}`;
    const data = await fetchJson(url);
    if (!Array.isArray(data)) {
        const err = new Error("City search failed.");
        err.statusCode = 502;
        throw err;
    }
    // Normalize to the same shape the rest of the code expects
    return data.map(e => ({
        id:      `${e.name}-${e.state || ""}-${e.country}`.toLowerCase().replace(/\s+/g, "-"),
        name:    e.name    || "",
        region:  e.state   || "",
        country: e.country || "",
        lat:     e.lat,
        lon:     e.lon,
        url:     ""
    }));
}

async function fetchJson(url) {
    const response = await fetch(url);
    const data     = await response.json().catch(() => null);
    if (!response.ok) {
        const msg = data?.message || data?.error?.message || "External API failed.";
        const err = new Error(msg);
        err.statusCode = response.status || 502;
        throw err;
    }
    return data;
}

// ── NORMALIZE: OWM → Atmosfera shape ─────────────────────────────────────────

function normalizeWeather(data, meta) {
    const { currentData: cur, forecastData: fc, lat, lon, resolvedName } = data;

    const nowEpoch      = cur.dt || Math.floor(Date.now() / 1000);
    const timezoneShift = cur.timezone || 0; // seconds offset from UTC

    // Local time epoch: UTC now + timezone offset
    const localTimeEpoch = Math.floor(Date.now() / 1000) + timezoneShift;

    // ── Build forecast days from 3-hour slots ──────────────────────────────
    // Group OWM 3-hour slots by local date
    const dayMap = new Map();
    for (const item of (fc.list || [])) {
        const localEpoch = item.dt + timezoneShift;
        const d = new Date(localEpoch * 1000);
        const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
        if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
        dayMap.get(dateStr).push(item);
    }

    const forecastDays = [...dayMap.entries()].slice(0, 5).map(([dateStr, items]) => {
        const temps    = items.map(i => i.main.temp);
        const maxTempC = Math.max(...temps);
        const minTempC = Math.min(...temps);
        const avgTempC = temps.reduce((s, t) => s + t, 0) / temps.length;

        // Pick midday slot for condition, fallback to first
        const midday = items.find(i => {
            const localH = new Date((i.dt + timezoneShift) * 1000).getUTCHours();
            return localH >= 11 && localH <= 14;
        }) || items[0];

        const rainChance  = Math.round((items.reduce((s, i) => s + (i.pop || 0), 0) / items.length) * 100);
        const maxWindKph  = Math.max(...items.map(i => (i.wind?.speed || 0) * 3.6));
        const avgHumidity = Math.round(items.reduce((s, i) => s + (i.main.humidity || 0), 0) / items.length);
        const totalPrecip = items.reduce((s, i) => s + (i.rain?.["3h"] || 0), 0);

        return {
            date:          dateStr,
            dayName:       weekdayFromDate(dateStr),
            minTempC,      minTempF: toF(minTempC),
            maxTempC,      maxTempF: toF(maxTempC),
            avgTempC,      avgTempF: toF(avgTempC),
            maxWindKph,
            humidity:      avgHumidity,
            uv:            0,
            chanceOfRain:  rainChance,
            chanceOfSnow:  0,
            totalPrecipMm: totalPrecip,
            conditionText: capitalise(midday.weather?.[0]?.description || "Unknown"),
            iconUrl:       owmIcon(midday.weather?.[0]?.icon, true),
            sunrise:       "",
            sunset:        ""
        };
    });

    // ── Hourly — next 24 three-hour slots ─────────────────────────────────
    const hourly = (fc.list || []).slice(0, 24).map(h => ({
        time:          new Date(h.dt * 1000).toISOString(),
        epoch:         h.dt,
        tempC:         h.main.temp,
        tempF:         toF(h.main.temp),
        conditionText: capitalise(h.weather?.[0]?.description || "Unknown"),
        iconUrl:       owmIcon(h.weather?.[0]?.icon, false),
        isDay:         h.sys?.pod === "d",
        chanceOfRain:  Math.round((h.pop || 0) * 100),
        chanceOfSnow:  0,
        windKph:       (h.wind?.speed || 0) * 3.6,
        humidity:      h.main.humidity,
        cloud:         h.clouds?.all || 0
    }));

    // ── Sunrise / sunset (formatted from epoch) ────────────────────────────
    const sunriseEpoch = cur.sys?.sunrise || 0;
    const sunsetEpoch  = cur.sys?.sunset  || 0;
    const fmtSunTime   = (epoch) => {
        if (!epoch) return "--";
        const d = new Date((epoch + timezoneShift) * 1000);
        const h = d.getUTCHours();
        const m = String(d.getUTCMinutes()).padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        return `${h % 12 || 12}:${m} ${ampm}`;
    };

    // ── is_day derived from sun position ──────────────────────────────────
    const isDay = nowEpoch >= sunriseEpoch && nowEpoch <= sunsetEpoch;

    // ── Location name ─────────────────────────────────────────────────────
    const cityName   = resolvedName || cur.name || "";
    const countryCode = cur.sys?.country || "";
    const countryName = countryCode
        ? (new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode)
        : "";

    return {
        query: {
            type:          meta.queryType,
            requested:     meta.query,
            requestedDays: meta.requestedDays,
            returnedDays:  forecastDays.length
        },
        location: {
            name:           cityName,
            region:         countryCode,
            country:        countryName,
            displayName:    [cityName, countryName].filter(Boolean).join(", "),
            timezone:       "UTC",          // OWM free tier doesn't give tz_id string
            localTime:      new Date(localTimeEpoch * 1000).toISOString(),
            localTimeEpoch: localTimeEpoch,
            lat:            cur.coord?.lat ?? lat,
            lon:            cur.coord?.lon ?? lon
        },
        current: {
            temperatureC:  cur.main?.temp,
            temperatureF:  toF(cur.main?.temp),
            feelsLikeC:    cur.main?.feels_like,
            feelsLikeF:    toF(cur.main?.feels_like),
            humidity:      cur.main?.humidity,
            windKph:       (cur.wind?.speed || 0) * 3.6,
            windMph:       (cur.wind?.speed || 0) * 2.237,
            windDegree:    cur.wind?.deg   || 0,
            windDirection: degToCompass(cur.wind?.deg || 0),
            uv:            0,               // Not available on OWM free tier
            cloud:         cur.clouds?.all || 0,
            pressureMb:    cur.main?.pressure,
            precipMm:      cur.rain?.["1h"] || cur.rain?.["3h"] || 0,
            visibilityKm:  (cur.visibility || 0) / 1000,
            isDay,
            conditionText: capitalise(cur.weather?.[0]?.description || "Unknown"),
            conditionCode: cur.weather?.[0]?.id || 0,
            iconUrl:       owmIcon(cur.weather?.[0]?.icon, true),
            updatedAt:     new Date(nowEpoch * 1000).toISOString(),
            updatedAtEpoch: nowEpoch
        },
        astro: {
            sunrise:           fmtSunTime(sunriseEpoch),
            sunset:            fmtSunTime(sunsetEpoch),
            moonrise:          "--",
            moonset:           "--",
            moonPhase:         "--",
            moonIllumination:  "--"
        },
        forecastDays,
        hourly
    };
}

// ── CITY SEARCH NORMALIZE ─────────────────────────────────────────────────────

function normalizeCitySearchResults(results) {
    const seen = new Set();
    return results
        .filter(e => {
            const key = `${e.name}|${e.region}|${e.country}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map((e) => {
            // country is already an ISO code from OWM ("IN", "US", etc.)
            const countryCode = e._coordMatch ? "IN" : (e.country || "");
            const countryName = countryCode
                ? (new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode)
                : "";
            const displayName = e._coordMatch
                ? `${e.name}, India`
                : [e.name, e.region, countryName].filter((v, i, a) => v && a.indexOf(v) === i).join(", ");
            return {
                id:          e.id || `${e.name}-${e.region}-${e.country}`.toLowerCase().replace(/\s+/g, "-"),
                name:        e.name    || "",
                region:      e.region  || "",
                country:     countryName,
                displayName,
                lat:         Number(e.lat),
                lon:         Number(e.lon),
                url:         e.url || "",
                flag:        countryCode ? countryCodeToFlag(countryCode) : "🌍",
                countryCode
            };
        });
}

// ── SMALL UTILITIES ───────────────────────────────────────────────────────────

function toF(c) {
    return (c === null || c === undefined) ? null : c * 9 / 5 + 32;
}

function degToCompass(deg) {
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
}

function owmIcon(iconCode, large = false) {
    if (!iconCode) return "";
    return `https://openweathermap.org/img/wn/${iconCode}${large ? "@2x" : ""}.png`;
}

function capitalise(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function withHttps(url) { return !url ? "" : url.startsWith("http") ? url : `https:${url}`; }

function weekdayFromDate(s) {
    if (!s) return "";
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(`${s}T00:00:00`));
}

function buildCountryLookup() {
    const map = new Map();
    const rn  = new Intl.DisplayNames(["en"], { type: "region" });
    for (const code of REGION_CODES) {
        const label = rn.of(code);
        if (label) map.set(norm(label), code);
    }
    const aliases = {
        "uk":"GB","great britain":"GB","england":"GB","scotland":"GB","wales":"GB",
        "usa":"US","us":"US","united states":"US","united states of america":"US",
        "uae":"AE","emirates":"AE","south korea":"KR","north korea":"KP",
        "russia":"RU","laos":"LA","moldova":"MD","bolivia":"BO","venezuela":"VE",
        "tanzania":"TZ","syria":"SY","palestine":"PS","brunei":"BN",
        "vietnam":"VN","iran":"IR","micronesia":"FM","india":"IN"
    };
    for (const [name, code] of Object.entries(aliases)) map.set(norm(name), code);
    return map;
}

function getCountryCode(name) { return COUNTRY_NAME_TO_CODE.get(norm(name)) || ""; }

function norm(v) {
    return v.normalize("NFKD").replace(/[^\w\s]/g," ").replaceAll("_"," ")
            .replace(/\s+/g," ").trim().toLowerCase();
}

function countryCodeToFlag(code) {
    if (!/^[A-Z]{2}$/.test(code)) return "🌍";
    return [...code].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}