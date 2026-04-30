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
const COUNTRY_DISPLAY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_LOOKUP_ENTRIES = Array.from(COUNTRY_NAME_TO_CODE.entries());
const CURATED_WORLD_CITIES = [
    { name: "Tokyo", country: "JP", region: "Tokyo", lat: 35.6828, lon: 139.7595, priority: 1000 },
    { name: "Toronto", country: "CA", region: "Ontario", lat: 43.6535, lon: -79.3839, priority: 995 },
    { name: "New York", country: "US", region: "New York", lat: 40.7128, lon: -74.0060, priority: 990, aliases: ["new york city", "nyc"] },
    { name: "London", country: "GB", region: "England", lat: 51.5072, lon: -0.1276, priority: 985 },
    { name: "Paris", country: "FR", region: "Ile-de-France", lat: 48.8566, lon: 2.3522, priority: 980 },
    { name: "Sydney", country: "AU", region: "New South Wales", lat: -33.8688, lon: 151.2093, priority: 975 },
    { name: "Singapore", country: "SG", region: "", lat: 1.2903, lon: 103.8519, priority: 970 },
    { name: "Dubai", country: "AE", region: "Dubai", lat: 25.2048, lon: 55.2708, priority: 965 },
    { name: "Los Angeles", country: "US", region: "California", lat: 34.0522, lon: -118.2437, priority: 960, aliases: ["la", "l.a."] },
    { name: "Chicago", country: "US", region: "Illinois", lat: 41.8781, lon: -87.6298, priority: 955 },
    { name: "Seoul", country: "KR", region: "", lat: 37.5665, lon: 126.9780, priority: 950 },
    { name: "Hong Kong", country: "HK", region: "", lat: 22.3193, lon: 114.1694, priority: 948 },
    { name: "Bangkok", country: "TH", region: "", lat: 13.7563, lon: 100.5018, priority: 946 },
    { name: "Istanbul", country: "TR", region: "", lat: 41.0082, lon: 28.9784, priority: 944 },
    { name: "Mexico City", country: "MX", region: "Mexico City", lat: 19.4326, lon: -99.1332, priority: 942, aliases: ["cdmx"] },
    { name: "Berlin", country: "DE", region: "Berlin", lat: 52.5200, lon: 13.4050, priority: 940 },
    { name: "Madrid", country: "ES", region: "Community of Madrid", lat: 40.4168, lon: -3.7038, priority: 938 },
    { name: "Barcelona", country: "ES", region: "Catalonia", lat: 41.3874, lon: 2.1686, priority: 936 },
    { name: "Zurich", country: "CH", region: "Zurich", lat: 47.3769, lon: 8.5417, priority: 934, aliases: ["zuerich"] },
    { name: "Geneva", country: "CH", region: "Geneva", lat: 46.2044, lon: 6.1432, priority: 932 },
    { name: "Bern", country: "CH", region: "Bern", lat: 46.9480, lon: 7.4474, priority: 930, aliases: ["berne"] },
    { name: "Basel", country: "CH", region: "Basel-Stadt", lat: 47.5596, lon: 7.5886, priority: 928 },
    { name: "Lausanne", country: "CH", region: "Vaud", lat: 46.5197, lon: 6.6323, priority: 926 },
    { name: "Valencia", country: "ES", region: "Valencia", lat: 39.4699, lon: -0.3763, priority: 924 },
    { name: "Seville", country: "ES", region: "Andalusia", lat: 37.3891, lon: -5.9845, priority: 922, aliases: ["sevilla"] },
    { name: "Bilbao", country: "ES", region: "Basque Country", lat: 43.2630, lon: -2.9350, priority: 920 },
    { name: "Malaga", country: "ES", region: "Andalusia", lat: 36.7213, lon: -4.4217, priority: 918, aliases: ["málaga"] },
    { name: "Santander", country: "ES", region: "Cantabria", lat: 43.4623, lon: -3.8099, priority: 916 },
    { name: "Rome", country: "IT", region: "Lazio", lat: 41.9028, lon: 12.4964, priority: 914, aliases: ["roma"] },
    { name: "Milan", country: "IT", region: "Lombardy", lat: 45.4642, lon: 9.1900, priority: 912, aliases: ["milano"] },
    { name: "Venice", country: "IT", region: "Veneto", lat: 45.4408, lon: 12.3155, priority: 910, aliases: ["venezia"] },
    { name: "Florence", country: "IT", region: "Tuscany", lat: 43.7696, lon: 11.2558, priority: 908, aliases: ["firenze"] },
    { name: "Naples", country: "IT", region: "Campania", lat: 40.8518, lon: 14.2681, priority: 906, aliases: ["napoli"] },
    { name: "Osaka", country: "JP", region: "Osaka", lat: 34.6937, lon: 135.5023, priority: 904 },
    { name: "Kyoto", country: "JP", region: "Kyoto", lat: 35.0116, lon: 135.7681, priority: 902 },
    { name: "Yokohama", country: "JP", region: "Kanagawa", lat: 35.4437, lon: 139.6380, priority: 900 },
    { name: "Sapporo", country: "JP", region: "Hokkaido", lat: 43.0618, lon: 141.3545, priority: 898 },
    { name: "Fukuoka", country: "JP", region: "Fukuoka", lat: 33.5902, lon: 130.4017, priority: 896 },
    { name: "Ottawa", country: "CA", region: "Ontario", lat: 45.4215, lon: -75.6972, priority: 894 },
    { name: "Montreal", country: "CA", region: "Quebec", lat: 45.5017, lon: -73.5673, priority: 892, aliases: ["montreal", "montréal"] },
    { name: "Vancouver", country: "CA", region: "British Columbia", lat: 49.2827, lon: -123.1207, priority: 890 },
    { name: "Calgary", country: "CA", region: "Alberta", lat: 51.0447, lon: -114.0719, priority: 888 },
    { name: "Boston", country: "US", region: "Massachusetts", lat: 42.3601, lon: -71.0589, priority: 886 },
    { name: "San Francisco", country: "US", region: "California", lat: 37.7749, lon: -122.4194, priority: 884, aliases: ["sf", "san fran"] },
    { name: "Seattle", country: "US", region: "Washington", lat: 47.6062, lon: -122.3321, priority: 882 },
    { name: "Washington", country: "US", region: "District of Columbia", lat: 38.9072, lon: -77.0369, priority: 880, aliases: ["washington dc", "dc", "d.c."] },
    { name: "Miami", country: "US", region: "Florida", lat: 25.7617, lon: -80.1918, priority: 878 },
    { name: "Beijing", country: "CN", region: "Beijing", lat: 39.9042, lon: 116.4074, priority: 876 },
    { name: "Shanghai", country: "CN", region: "Shanghai", lat: 31.2304, lon: 121.4737, priority: 874 },
    { name: "Guangzhou", country: "CN", region: "Guangdong", lat: 23.1291, lon: 113.2644, priority: 872 },
    { name: "Shenzhen", country: "CN", region: "Guangdong", lat: 22.5431, lon: 114.0579, priority: 870 },
    { name: "Melbourne", country: "AU", region: "Victoria", lat: -37.8136, lon: 144.9631, priority: 868 },
    { name: "Brisbane", country: "AU", region: "Queensland", lat: -27.4698, lon: 153.0251, priority: 866 },
    { name: "Perth", country: "AU", region: "Western Australia", lat: -31.9505, lon: 115.8605, priority: 864 },
    { name: "Canberra", country: "AU", region: "Australian Capital Territory", lat: -35.2809, lon: 149.1300, priority: 862 },
    { name: "Adelaide", country: "AU", region: "South Australia", lat: -34.9285, lon: 138.6007, priority: 860 },
    { name: "Auckland", country: "NZ", region: "Auckland", lat: -36.8509, lon: 174.7645, priority: 858 },
    { name: "Wellington", country: "NZ", region: "Wellington", lat: -41.2865, lon: 174.7762, priority: 856 },
    { name: "Christchurch", country: "NZ", region: "Canterbury", lat: -43.5321, lon: 172.6362, priority: 854 },
    { name: "Cape Town", country: "ZA", region: "Western Cape", lat: -33.9249, lon: 18.4241, priority: 852 },
    { name: "Johannesburg", country: "ZA", region: "Gauteng", lat: -26.2041, lon: 28.0473, priority: 850 },
    { name: "Durban", country: "ZA", region: "KwaZulu-Natal", lat: -29.8587, lon: 31.0218, priority: 848 },
    { name: "Sao Paulo", country: "BR", region: "Sao Paulo", lat: -23.5505, lon: -46.6333, priority: 846, aliases: ["são paulo"] },
    { name: "Rio de Janeiro", country: "BR", region: "Rio de Janeiro", lat: -22.9068, lon: -43.1729, priority: 844 },
    { name: "Brasilia", country: "BR", region: "Federal District", lat: -15.7939, lon: -47.8828, priority: 842, aliases: ["brasília"] },
    { name: "Buenos Aires", country: "AR", region: "Buenos Aires", lat: -34.6037, lon: -58.3816, priority: 840 },
    { name: "Santiago", country: "CL", region: "Santiago Metropolitan", lat: -33.4489, lon: -70.6693, priority: 838 },
    { name: "Bogota", country: "CO", region: "Bogota", lat: 4.7110, lon: -74.0721, priority: 836, aliases: ["bogotá"] },
    { name: "Lima", country: "PE", region: "Lima", lat: -12.0464, lon: -77.0428, priority: 834 },
    { name: "Jakarta", country: "ID", region: "Jakarta", lat: -6.2088, lon: 106.8456, priority: 832 },
    { name: "Denpasar", country: "ID", region: "Bali", lat: -8.6500, lon: 115.2167, priority: 830, aliases: ["bali"] },
    { name: "Hanoi", country: "VN", region: "", lat: 21.0278, lon: 105.8342, priority: 828 },
    { name: "Ho Chi Minh City", country: "VN", region: "", lat: 10.8231, lon: 106.6297, priority: 826, aliases: ["saigon"] },
    { name: "Moscow", country: "RU", region: "Moscow", lat: 55.7558, lon: 37.6173, priority: 824 },
    { name: "Saint Petersburg", country: "RU", region: "Saint Petersburg", lat: 59.9311, lon: 30.3609, priority: 822, aliases: ["st petersburg", "st. petersburg"] },
    { name: "Riyadh", country: "SA", region: "Riyadh", lat: 24.7136, lon: 46.6753, priority: 820 },
    { name: "Jeddah", country: "SA", region: "Makkah", lat: 21.5433, lon: 39.1728, priority: 818 },
    { name: "Cairo", country: "EG", region: "Cairo", lat: 30.0444, lon: 31.2357, priority: 816 },
    { name: "Lagos", country: "NG", region: "Lagos", lat: 6.5244, lon: 3.3792, priority: 814 },
    { name: "Abuja", country: "NG", region: "Federal Capital Territory", lat: 9.0765, lon: 7.3986, priority: 812 },
    { name: "Amsterdam", country: "NL", region: "North Holland", lat: 52.3676, lon: 4.9041, priority: 810 },
    { name: "Rotterdam", country: "NL", region: "South Holland", lat: 51.9244, lon: 4.4777, priority: 808 },
    { name: "The Hague", country: "NL", region: "South Holland", lat: 52.0705, lon: 4.3007, priority: 806, aliases: ["den haag"] },
    { name: "Brussels", country: "BE", region: "Brussels-Capital", lat: 50.8503, lon: 4.3517, priority: 804, aliases: ["bruxelles"] },
    { name: "Antwerp", country: "BE", region: "Flanders", lat: 51.2194, lon: 4.4025, priority: 802 },
    { name: "Lisbon", country: "PT", region: "Lisbon", lat: 38.7223, lon: -9.1393, priority: 800, aliases: ["lisboa"] },
    { name: "Porto", country: "PT", region: "Porto", lat: 41.1579, lon: -8.6291, priority: 798 },
    { name: "Vienna", country: "AT", region: "Vienna", lat: 48.2082, lon: 16.3738, priority: 796, aliases: ["wien"] },
    { name: "Stockholm", country: "SE", region: "Stockholm", lat: 59.3293, lon: 18.0686, priority: 794 },
    { name: "Oslo", country: "NO", region: "Oslo", lat: 59.9139, lon: 10.7522, priority: 792 },
    { name: "Copenhagen", country: "DK", region: "Capital Region", lat: 55.6761, lon: 12.5683, priority: 790, aliases: ["kobenhavn", "københavn"] },
    { name: "Helsinki", country: "FI", region: "Uusimaa", lat: 60.1699, lon: 24.9384, priority: 788 },
    { name: "Dublin", country: "IE", region: "Dublin", lat: 53.3498, lon: -6.2603, priority: 786 },
    { name: "Reykjavik", country: "IS", region: "Capital Region", lat: 64.1466, lon: -21.9426, priority: 784, aliases: ["reykjavík"] },
    { name: "Athens", country: "GR", region: "Attica", lat: 37.9838, lon: 23.7275, priority: 782 },
    { name: "Prague", country: "CZ", region: "Prague", lat: 50.0755, lon: 14.4378, priority: 780 },
    { name: "Warsaw", country: "PL", region: "Masovian", lat: 52.2297, lon: 21.0122, priority: 778 },
    { name: "Krakow", country: "PL", region: "Lesser Poland", lat: 50.0647, lon: 19.9450, priority: 776, aliases: ["kraków"] },
    { name: "Budapest", country: "HU", region: "Budapest", lat: 47.4979, lon: 19.0402, priority: 774 },
    { name: "Bucharest", country: "RO", region: "Bucharest", lat: 44.4268, lon: 26.1025, priority: 772 },
    { name: "Kyiv", country: "UA", region: "Kyiv", lat: 50.4501, lon: 30.5234, priority: 770, aliases: ["kiev"] }
];
const CURATED_CITY_INDEX = buildCuratedCityIndex();

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

    const countryOnlyCode = city ? getExactCountryCode(city) : "";
    if (city && countryOnlyCode) {
        const suggestions = getCountryCitySuggestions(countryOnlyCode, 5);
        if (suggestions.length > 0) {
            return res.status(409).json({
                code: "AMBIGUOUS_LOCATION",
                error: `Select a city in ${getCountryName(countryOnlyCode)}.`,
                suggestions
            });
        }
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
        const localResults = searchCuratedCities(query, 8);
        const countryCode = getExactCountryCode(query);

        if (countryCode) {
            const normalizedCountryResults = normalizeCitySearchResults(localResults).slice(0, 5);
            cityCache.set(cacheKey, { timestamp: Date.now(), payload: normalizedCountryResults });
            return res.json(normalizedCountryResults);
        }

        const shouldUseRemote = norm(query).length > 3;
        let merged = [...localResults];

        if (shouldUseRemote) {
            const remoteResults = await fetchCitySearch(query);
            merged = mergeSearchResults(localResults, remoteResults);
        }

        const normalized = normalizeCitySearchResults(rankCityResults(merged, query)).slice(0, 5);
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

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
    const uptimeSec = Math.floor(process.uptime());
    res.status(200).json({ status: 'ok', uptime: uptimeSec });
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

const server = app.listen(PORT, () => {
    console.log(`\n  Atmosfera  →  http://localhost:${PORT}\n`);
    if (!API_KEY) console.warn("  ⚠  OPENWEATHER_KEY missing in .env\n");
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n  ✗ Port ${PORT} is already in use.\n`);
        console.log(`  Quick fixes:\n`);
        console.log(`  1. Kill the process: npx fkill :${PORT}\n`);
        console.log(`  2. Use different port: PORT=3001 npm start\n`);
        process.exit(1);
    }
    throw err;
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
        // Use limit=5 so we can pick the best match (OWM sometimes returns obscure
        // small cities first — e.g. "Switzerland" in Lithuania before the country)
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        const geoData = await fetchJson(geoUrl);
        if (!Array.isArray(geoData) || geoData.length === 0) {
            const err = new Error(`City not found: ${query}`);
            err.statusCode = 404;
            throw err;
        }

        // Pick the best match: prefer results where the name closely matches
        // the query (case-insensitive), and prefer larger/more-known countries.
        // This prevents "Switzerland, Lithuania" from winning over "Switzerland" (the country's cities).
        const queryParts = query.split(",").map((part) => part.trim()).filter(Boolean);
        const cityPart = norm(queryParts[0] || query);

        let hintedCountryCode = "";
        let hintedRegion = "";
        if (queryParts.length >= 2) {
            const countryHint = queryParts.at(-1) || "";
            hintedCountryCode = getCountryCode(countryHint) || countryHint.toUpperCase().trim();
            if (queryParts.length >= 3) {
                hintedRegion = norm(queryParts.slice(1, -1).join(" "));
            } else if (!getCountryCode(queryParts[1] || "")) {
                hintedRegion = norm(queryParts[1] || "");
            }
        }

        // Score each candidate — lower is better
        const scoredGeo = geoData.map((g) => {
            const nameLower = norm(g.name || "");
            const stateLower = norm(g.state || "");
            let score = 0;

            if (!nameLower.includes(cityPart)) score += 50;
            if (nameLower === cityPart) score -= 20;
            if (nameLower.startsWith(cityPart)) score -= 8;

            if (hintedCountryCode && g.country === hintedCountryCode) score -= 30;
            if (hintedRegion && stateLower === hintedRegion) score -= 12;

            // Small reward for larger/more prominent countries (avoid tiny villages)
            const majorCountries = ["US","GB","DE","FR","ES","IT","JP","CN","AU","CA","BR","IN","RU","MX","KR","NL","SE","NO","DK","PL","CH","AT","BE","PT","GR","TR","AR","ZA","NG","EG","PK","BD"];
            if (majorCountries.includes(g.country)) score -= 5;

            return { geo: g, score };
        });

        scoredGeo.sort((a, b) => a.score - b.score);
        const best = scoredGeo[0].geo;

        lat          = best.lat;
        lon          = best.lon;
        resolvedName = best.name;
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
    return data.map((e) => ({
        id: `${e.name}-${e.state || ""}-${e.country}`.toLowerCase().replace(/\s+/g, "-"),
        name: e.name || "",
        region: e.state || "",
        country: e.country || "",
        lat: e.lat,
        lon: e.lon,
        url: "",
        localNames: e.local_names || {},
        aliases: buildRemoteAliases(e),
        priority: 0,
        source: "owm"
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

function buildRemoteAliases(entry) {
    return Array.from(new Set(Object.values(entry.local_names || {}).filter(Boolean)));
}

function buildCuratedCityIndex() {
    const rawEntries = [
        ...CURATED_WORLD_CITIES.map((entry) => ({ ...entry, source: "curated" })),
        ...buildIndiaCuratedCities()
    ];
    const merged = new Map();

    for (const entry of rawEntries) {
        const countryCode = (entry.country || "").toUpperCase().trim();
        const key = `${norm(entry.name)}|${countryCode}|${Math.round(Number(entry.lat) * 100)}|${Math.round(Number(entry.lon) * 100)}`;
        const aliases = Array.from(new Set([entry.name, ...(entry.aliases || [])].filter(Boolean)));

        if (!merged.has(key)) {
            merged.set(key, {
                ...entry,
                country: countryCode,
                aliases,
                source: entry.source || "curated",
                priority: entry.priority || 0
            });
            continue;
        }

        const existing = merged.get(key);
        existing.aliases = Array.from(new Set([...(existing.aliases || []), ...aliases]));
        existing.priority = Math.max(existing.priority || 0, entry.priority || 0);
        if (!existing.region && entry.region) existing.region = entry.region;
    }

    return Array.from(merged.values()).map(toSearchDoc);
}

function buildIndiaCuratedCities() {
    const preferredNames = {
        "28.6139,77.2090": "New Delhi",
        "12.9716,77.5946": "Bengaluru",
        "13.0827,80.2707": "Chennai",
        "8.5241,76.9366": "Thiruvananthapuram",
        "17.6868,83.2185": "Visakhapatnam",
        "23.2324,87.8615": "Bardhaman",
        "22.5797,88.4280": "Salt Lake City"
    };
    const priorityByName = {
        "new delhi": 960,
        "mumbai": 950,
        "kolkata": 940,
        "bengaluru": 938,
        "hyderabad": 936,
        "chennai": 934,
        "pune": 932,
        "ahmedabad": 930,
        "jaipur": 926,
        "lucknow": 922,
        "surat": 920,
        "kochi": 918,
        "chandigarh": 916,
        "visakhapatnam": 914,
        "bhubaneswar": 912,
        "guwahati": 910,
        "goa": 908,
        "darjeeling": 906,
        "gangtok": 904,
        "srinagar": 902
    };
    const groups = new Map();

    for (const [alias, coords] of Object.entries(INDIA_CITY_COORDS)) {
        if (!groups.has(coords)) groups.set(coords, { aliases: [] });
        groups.get(coords).aliases.push(alias);
    }

    return Array.from(groups.entries()).map(([coords, group]) => {
        const [lat, lon] = coords.split(",").map(Number);
        const firstAlias = group.aliases[0] || "";
        const canonical = preferredNames[coords] || titleCase(firstAlias);
        return {
            name: canonical,
            region: "India",
            country: "IN",
            lat,
            lon,
            aliases: group.aliases.map(titleCase),
            priority: priorityByName[norm(canonical)] || 700,
            source: "curated"
        };
    });
}

function titleCase(value) {
    return String(value)
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ");
}

function toSearchDoc(entry) {
    if (entry._normName) return entry;

    const countryCode = (entry.country || "").toUpperCase().trim();
    const countryName = getCountryName(countryCode);
    const aliasSet = new Set([entry.name, ...(entry.aliases || [])].filter(Boolean).map(norm));
    if (entry.region) aliasSet.add(norm(`${entry.name} ${entry.region}`));
    if (countryName) {
        aliasSet.add(norm(`${entry.name} ${countryName}`));
        aliasSet.add(norm(`${entry.name}, ${countryName}`));
    }

    return {
        ...entry,
        country: countryCode,
        aliases: Array.from(aliasSet),
        priority: entry.priority || 0,
        source: entry.source || "curated",
        _normName: norm(entry.name || ""),
        _normRegion: norm(entry.region || ""),
        _normCountry: norm(countryName)
    };
}

function stripSearchDoc(entry) {
    const {
        _normName,
        _normRegion,
        _normCountry,
        ...plain
    } = entry;
    return plain;
}

function getCountryName(code) {
    return code ? (COUNTRY_DISPLAY_NAMES.of(code) || code) : "";
}

function getExactCountryCode(query) {
    return getCountryCode(query);
}

function getCountryMatchContext(query) {
    const qNorm = norm(query);
    const exact = new Set();
    const prefix = new Set();

    for (const [label, code] of COUNTRY_LOOKUP_ENTRIES) {
        if (label === qNorm) exact.add(code);
        else if (qNorm.length >= 3 && label.startsWith(qNorm)) prefix.add(code);
    }

    const codes = exact.size > 0 ? exact : prefix;
    return {
        qNorm,
        codes,
        isExact: exact.size > 0,
        isPrefix: exact.size === 0 && prefix.size > 0
    };
}

function searchCuratedCities(query, limit = 8) {
    const countryContext = getCountryMatchContext(query);
    return CURATED_CITY_INDEX
        .map((entry) => {
            const score = scoreSearchDoc(entry, countryContext);
            return Number.isFinite(score) ? { entry, score } : null;
        })
        .filter(Boolean)
        .sort(compareRankedSearchResults)
        .slice(0, limit)
        .map(({ entry }) => stripSearchDoc(entry));
}

function scoreSearchDoc(entry, countryContext) {
    const { qNorm, codes, isPrefix } = countryContext;
    let score = Number.POSITIVE_INFINITY;

    if (codes.has(entry.country)) score = Math.min(score, countryContext.isExact ? 1 : 6);
    if (entry._normName === qNorm) score = Math.min(score, 0);
    if (entry.aliases.includes(qNorm)) score = Math.min(score, 2);
    if (entry._normName.startsWith(qNorm)) score = Math.min(score, 8);
    if (entry.aliases.some((alias) => alias.startsWith(qNorm))) score = Math.min(score, 12);
    if (hasWordPrefix(entry._normName, qNorm)) score = Math.min(score, 16);
    if (entry.aliases.some((alias) => hasWordPrefix(alias, qNorm))) score = Math.min(score, 20);
    if (entry._normName.includes(qNorm)) score = Math.min(score, 28);
    if (entry.aliases.some((alias) => alias.includes(qNorm))) score = Math.min(score, 34);

    if (!Number.isFinite(score)) return null;
    if (isPrefix && codes.has(entry.country)) score -= 1;
    return score;
}

function hasWordPrefix(text, query) {
    return String(text)
        .split(" ")
        .filter(Boolean)
        .some((part) => part.startsWith(query));
}

function compareRankedSearchResults(a, b) {
    if (a.score !== b.score) return a.score - b.score;
    if ((b.entry.priority || 0) !== (a.entry.priority || 0)) return (b.entry.priority || 0) - (a.entry.priority || 0);
    if ((a.entry._normName || "").length !== (b.entry._normName || "").length) {
        return (a.entry._normName || "").length - (b.entry._normName || "").length;
    }
    return (a.entry.name || "").localeCompare(b.entry.name || "");
}

function getCountryCitySuggestions(countryCode, limit = 5) {
    const rawSuggestions = CURATED_CITY_INDEX
        .filter((entry) => entry.country === countryCode)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.name.localeCompare(b.name))
        .slice(0, limit)
        .map((entry) => stripSearchDoc(entry));

    return normalizeCitySearchResults(rawSuggestions);
}

function mergeSearchResults(...collections) {
    const merged = new Map();

    for (const collection of collections) {
        for (const item of collection) {
            const doc = toSearchDoc(item);
            const key = `${doc._normName}|${Math.round(Number(doc.lat) * 100)}|${Math.round(Number(doc.lon) * 100)}`;
            if (!merged.has(key)) {
                merged.set(key, doc);
                continue;
            }

            const existing = merged.get(key);
            existing.aliases = Array.from(new Set([...(existing.aliases || []), ...(doc.aliases || [])]));
            existing.priority = Math.max(existing.priority || 0, doc.priority || 0);
            if (!existing.region && doc.region) existing.region = doc.region;
            if (existing.source !== "curated" && doc.source === "curated") existing.source = doc.source;
        }
    }

    return Array.from(merged.values()).map((entry) => stripSearchDoc(entry));
}

function rankCityResults(results, query) {
    const countryContext = getCountryMatchContext(query);
    return results
        .map((entry) => {
            const doc = toSearchDoc(entry);
            const score = scoreSearchDoc(doc, countryContext);
            return Number.isFinite(score) ? { entry: doc, score } : null;
        })
        .filter(Boolean)
        .sort(compareRankedSearchResults)
        .map(({ entry }) => stripSearchDoc(entry));
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
        const maxWindKph  = Math.round(Math.max(...items.map(i => (i.wind?.speed || 0) * 3.6)) * 10) / 10;
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
        windKph:       Math.round((h.wind?.speed || 0) * 3.6 * 10) / 10,
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
    const countryName = getCountryName(countryCode);

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
            windKph:       Math.round((cur.wind?.speed || 0) * 3.6 * 10) / 10,
            windMph:       Math.round((cur.wind?.speed || 0) * 2.237 * 10) / 10,
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
            // Dedup by rounded lat/lon
            const key = `${Math.round((e.lat||0) * 10)},${Math.round((e.lon||0) * 10)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map((e) => {
            const countryCode = (e.country || "").toUpperCase().trim();
            const countryName = getCountryName(countryCode);
            const displayName = e._coordMatch
                ? `${e.name}, India`
                : [e.name, e.region, countryName].filter((v, i, a) => v && a.indexOf(v) === i).join(", ");
            return {
                id:          e.id || `${e.name}-${e.region}-${countryCode}`.toLowerCase().replace(/\s+/g, "-"),
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