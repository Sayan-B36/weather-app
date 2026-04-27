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
- 🔊 Procedural ambient audio that matches current weather
- 🗺️ Embedded OpenStreetMap with precise coordinates
- 📍 One-tap geolocation (GPS on mobile, IP-based fallback on desktop)
- ♿ Reduced-motion support and ARIA live regions
- 🔐 API key secured on the backend — never exposed to the client
- 🇮🇳 Hardcoded coordinate overrides for 100+ Indian cities for improved accuracy

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES modules)
- **Backend:** Node.js, Express
- **Canvas:** Custom particle engine (SceneController)
- **Audio:** Web Audio API (AmbientAudio)
- **Animation:** Web Animations API + optional GSAP
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
├── index.html            ← App shell + all DOM structure
├── script.js             ← Entry point
├── weather-app.js        ← Main app logic
├── scene-controller.js   ← Canvas particle engine
├── motion-controller.js  ← Animations + reveal system
├── ambient-audio.js      ← Web Audio procedural soundscape
├── weather-illustrations.js ← SVG weather illustrations
├── style.css             ← Core styles (glassmorphism design system)
├── style-performance.css ← GPU/FPS performance overrides
├── server.js             ← Express API proxy + static server
├── package.json
└── .env                  ← OPENWEATHER_KEY=your_key_here
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