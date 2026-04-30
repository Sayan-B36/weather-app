# 🌦️ Atmosfera — Live Weather Intelligence

A cinematic, weather-reactive full-stack weather app with immersive visuals, ambient audio, and global city search.

---

## 🌐 Live Demo

👉 https://atmosfera-xafi.onrender.com

---

## 🚀 Features

- 🌍 Search any city worldwide (live API suggestions as you type)
- 🌡️ Real-time current conditions + 5-day forecast + 24-hour hourly
- 🎨 Cinematic theme engine — 9 weather-reactive visual scenes
- 🌌 Per-theme atmospheric backgrounds (sun disc, moon + stars, cloud bands, rain wash, storm flicker, snow, mist)
- ✨ Subtle 3D card tilt that follows the cursor (smoothly lerp-interpolated)
- 💎 Premium glassmorphism with depth shadows, accent halos, and animated underlines
- � Themed scroll progress bar, custom scrollbar, and selection color
- �🔊 Procedural ambient audio that matches current weather
- 🗺️ Embedded OpenStreetMap with precise coordinates
- 📍 One-tap geolocation (GPS on mobile, IP-based fallback on desktop)
- ⚡ Performance-tuned: single rAF loop, no body repaints on mouse move, auto-disabled on touch / reduced-motion
- ♿ Reduced-motion support and ARIA live regions
- 🔐 API key secured on the backend — never exposed to the client
- 🇮🇳 Hardcoded coordinate overrides for 100+ Indian cities for improved accuracy

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES modules) — zero build step
- **Backend:** Node.js, Express
- **Canvas:** Custom particle engine (SceneController)
- **Audio:** Web Audio API (AmbientAudio)
- **Animation:** Web Animations API + optional GSAP
- **3D / FX:** Pure CSS transforms + a single rAF-batched JS loop (no libraries)
- **Weather API:** OpenWeatherMap (openweathermap.org)
- **Geocoding:** OpenWeatherMap Geocoding API (`/geo/1.0/direct`)
- **IP Location:** ip-api.com (server-side, no key required)

---

## ⚙️ Architecture

```
Browser → Express static server → /api/weather   → OpenWeatherMap /data/2.5/weather
                                                  → OpenWeatherMap /data/2.5/forecast
                                → /api/cities    → OpenWeatherMap /geo/1.0/direct
                                → /api/locate    → Local Indian city DB (haversine)
                                → /api/ip-locate → ip-api.com (server-side)
```

---

## 🔒 Security

- API key stored in `.env` as `OPENWEATHER_KEY`
- Express backend proxies all API calls — key never sent to browser
- `.gitignore` blocks `.env` and `dist/`

---

## 📁 Project Structure

```
atmosfera/
├── index.html               ← App shell + all DOM structure
├── script.js                ← Entry point (boots weather-app)
├── weather-app.js           ← Main app logic + theme presets
├── scene-controller.js      ← Canvas particle engine
├── motion-controller.js     ← Reveal system + GSAP parallax
├── ambient-audio.js         ← Web Audio procedural soundscape
├── weather-illustrations.js ← SVG weather illustrations
├── enhancements.js          ← 3D tilt + scroll progress (single rAF loop)
├── style.css                ← Core styles (glassmorphism design system)
├── style-enhancements.css   ← Per-theme atmosphere, depth, animations, 3D tilt
├── style-performance.css    ← GPU/FPS performance overrides
├── style-mobile.css         ← Mobile-specific tweaks
├── server.js                ← Express API proxy + static server
├── package.json
└── .env                     ← OPENWEATHER_KEY=your_key_here
```

---

## ▶️ Run Locally

**1. Get a free API key**
Sign up at https://openweathermap.org and grab your key from https://home.openweathermap.org/api_keys

**2. Create `.env` in the project root**
```
OPENWEATHER_KEY=your_api_key_here
```

**3. Install and start**
```bash
npm install
npm start
```

Open: http://localhost:3000

For hot-reload during development:
```bash
npm run dev
```

> ⚠️ OpenWeatherMap API keys can take up to 2 hours to activate after signup. If you get 401 errors, wait and try again.

---

## 🚀 Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on Render
3. Set **Start command**: `npm start`
4. Add environment variable: `OPENWEATHER_KEY = your_key`
5. Deploy

---

## 🎨 Theme Engine

Nine weather-reactive visual states are derived from the OpenWeatherMap condition + day/night flag:

| Theme | Atmosphere |
|---|---|
| `clear-day` | Warm sun disc upper-right, golden tints |
| `clear-night` | Static star field + soft moon, deep navy |
| `cloud-day` / `cloud-night` | Layered cloud-band radial highlights |
| `rain-day` / `rain-night` | Cool blue wash + canvas rain particles |
| `storm` | Dark turbulent gradient + opacity flicker |
| `snow` | Bright cool wash + canvas snow particles |
| `mist` | Soft veiled gradient |

Each theme drives 12 CSS custom properties (`--scene-start`, `--accent`, `--glass-surface`, etc.) which all panels, cards, buttons, and the canvas engine read live — no re-renders required.

---

## ⚡ Performance Notes

The enhancement layer is built to stay at 60 FPS:

- **No `body` background updates on pointer move** — that would force full-viewport repaints.
- **One global `pointermove` listener**, not per-card.
- **Single `requestAnimationFrame` loop** with a guard flag; tilt is smoothed via lerp.
- **No animated `filter: blur(>40px)`** — large rotating blurred conics were replaced with static gradients.
- **Auto-disabled on coarse pointer / mobile / `prefers-reduced-motion`**.
- `style-performance.css` strips `backdrop-filter` from cards and contains layout regions.

---

## 🌐 API Notes

| Feature | Status |
|---|---|
| Current temperature | ✅ Accurate |
| Feels like | ✅ Accurate |
| Humidity, wind, pressure | ✅ Full support |
| 5-day forecast | ✅ Full support |
| 24-hour hourly | ✅ Full support (3-hour intervals) |
| Sunrise / Sunset | ✅ Full support ||
| Indian city accuracy | ✅ Improved via coordinate overrides |

---

## 👨‍💻 Author

**Sayan Bhowmick**