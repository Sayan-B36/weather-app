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
- 📍 One-tap geolocation
- 🖼️ Contextual SVG weather illustrations (landscapes per condition)
- ⚡ Performance-optimised — 60fps canvas, throttled particles
- ♿ Reduced-motion support and ARIA live regions
- 🔐 API key secured on the backend — never exposed to the client

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES modules)
- **Backend:** Node.js, Express
- **Canvas:** Custom particle engine (SceneController)
- **Audio:** Web Audio API (AmbientAudio)
- **Animation:** Web Animations API + optional GSAP
- **API:** WeatherAPI.com

---

## ⚙️ Architecture

```
Browser → Express static server → /api/weather → WeatherAPI.com
                                → /api/cities  → WeatherAPI.com
```

---

## 🔒 Security

- API key stored in `.env` as `WEATHERAPI_KEY`
- Express backend proxies all API calls — key never sent to browser
- `.gitignore` blocks `.env` and `dist/`

---

## 📁 Project Structure

```
atmosfera/
├── index.html               ← App shell + all DOM structure
├── script.js                ← Entry point
├── weather-app.js           ← Main app logic
├── scene-controller.js      ← Canvas particle engine
├── motion-controller.js     ← Animations + reveal system
├── ambient-audio.js         ← Web Audio procedural soundscape
├── weather-illustrations.js ← SVG landscape scenes per weather condition
├── style.css                ← Core styles (glassmorphism design system)
├── style-enhancements.css   ← Visual upgrades (illustrations, 3D cards, pills)
├── style-performance.css    ← Performance overrides (60fps optimisations)
├── server.js                ← Express API proxy + static server
├── package.json
└── .env                     ← WEATHERAPI_KEY=your_key_here
```

---

## ▶️ Run Locally

```bash
npm install
npm start
```

Open: http://localhost:3000

For hot-reload during development:

```bash
npm run dev
```

---

## 🚀 Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on Render
3. Set **Start command**: `npm start`
4. Add environment variable: `WEATHERAPI_KEY = your_key`
5. Deploy

> **Note:** Render free tier spins down after inactivity. First load may take 30–60 seconds to cold-start.

---

## 👨‍💻 Author

**Sayan Bhowmick**