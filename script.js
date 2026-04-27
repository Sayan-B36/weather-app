import { createWeatherApp } from "./weather-app.js";

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => createWeatherApp(), { once: true });
} else {
    createWeatherApp();
}