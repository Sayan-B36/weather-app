/**
 * WeatherIllustration
 * Generates contextual inline SVG landscape illustrations
 * for each weather condition — displayed inside the hero panel.
 */

const ILLUSTRATIONS = {
    "clear-day": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <radialGradient id="sun-glow" cx="65%" cy="22%" r="25%">
      <stop offset="0%" stop-color="#ffe566" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#ffb347" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a4a8a" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="#4a2060" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="hills-far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a5fa0" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#1a3a6a" stop-opacity="0.75"/>
    </linearGradient>
    <linearGradient id="hills-mid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e7a4a" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#0d5530" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="hills-near" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#155235" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0a3020" stop-opacity="1"/>
    </linearGradient>
    <filter id="soft-blur">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>
  <!-- Sky wash -->
  <rect width="600" height="400" fill="url(#sky-day)"/>
  <!-- Sun glow -->
  <circle cx="390" cy="88" r="54" fill="#ffe566" opacity="0.22"/>
  <circle cx="390" cy="88" r="38" fill="#ffed80" opacity="0.55"/>
  <circle cx="390" cy="88" r="26" fill="#fff4a0" opacity="0.85"/>
  <!-- Sun rays -->
  <g opacity="0.3" stroke="#ffe566" stroke-width="1.5" stroke-linecap="round">
    <line x1="390" y1="42" x2="390" y2="30"/>
    <line x1="390" y1="134" x2="390" y2="146"/>
    <line x1="344" y1="88" x2="332" y2="88"/>
    <line x1="436" y1="88" x2="448" y2="88"/>
    <line x1="357" y1="55" x2="349" y2="47"/>
    <line x1="423" y1="121" x2="431" y2="129"/>
    <line x1="423" y1="55" x2="431" y2="47"/>
    <line x1="357" y1="121" x2="349" y2="129"/>
  </g>
  <!-- Light clouds -->
  <g opacity="0.35" filter="url(#soft-blur)">
    <ellipse cx="180" cy="110" rx="70" ry="22" fill="rgba(255,255,255,0.6)"/>
    <ellipse cx="200" cy="98" rx="45" ry="18" fill="rgba(255,255,255,0.7)"/>
    <ellipse cx="160" cy="102" rx="40" ry="16" fill="rgba(255,255,255,0.65)"/>
    <ellipse cx="500" cy="140" rx="55" ry="18" fill="rgba(255,255,255,0.5)"/>
    <ellipse cx="515" cy="130" rx="35" ry="15" fill="rgba(255,255,255,0.6)"/>
  </g>
  <!-- Far hills -->
  <path d="M0 260 Q80 200 160 230 Q240 200 320 218 Q400 190 480 215 Q540 205 600 220 L600 400 L0 400Z"
        fill="url(#hills-far)" filter="url(#soft-blur)"/>
  <!-- Mid hills -->
  <path d="M0 300 Q60 255 130 270 Q200 245 280 265 Q360 240 440 260 Q510 248 600 265 L600 400 L0 400Z"
        fill="url(#hills-mid)"/>
  <!-- Near hills -->
  <path d="M0 340 Q70 305 150 320 Q230 295 310 315 Q390 300 470 318 Q530 308 600 320 L600 400 L0 400Z"
        fill="url(#hills-near)"/>
  <!-- Foreground detail: small trees -->
  <g opacity="0.65">
    <path d="M80 340 L88 340 L84 310 Z" fill="#0a3020"/>
    <ellipse cx="84" cy="306" rx="10" ry="16" fill="#1a5535"/>
    <path d="M470 330 L478 330 L474 298 Z" fill="#0a3020"/>
    <ellipse cx="474" cy="294" rx="12" ry="18" fill="#1a5535"/>
    <path d="M540 325 L547 325 L543.5 298 Z" fill="#0a3020"/>
    <ellipse cx="543.5" cy="294" rx="9" ry="14" fill="#1a5535"/>
  </g>
</svg>`,

    "clear-night": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#040714" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0f2143" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="hills-night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d1a2e" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#060d18" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#night-sky)"/>
  <!-- Moon -->
  <circle cx="380" cy="90" r="34" fill="#d0deff" opacity="0.75"/>
  <circle cx="394" cy="78" r="28" fill="#040a1a" opacity="0.78"/>
  <!-- Moon glow -->
  <circle cx="380" cy="90" r="60" fill="rgba(160,190,255,0.08)"/>
  <!-- Stars -->
  <g fill="white">
    <circle cx="150" cy="60" r="1.5" opacity="0.9"/>
    <circle cx="220" cy="35" r="1" opacity="0.7"/>
    <circle cx="290" cy="70" r="1.5" opacity="0.85"/>
    <circle cx="170" cy="110" r="1" opacity="0.6"/>
    <circle cx="100" cy="90" r="2" opacity="0.8"/>
    <circle cx="450" cy="55" r="1" opacity="0.7"/>
    <circle cx="500" cy="80" r="1.5" opacity="0.75"/>
    <circle cx="560" cy="40" r="1" opacity="0.65"/>
    <circle cx="130" cy="140" r="1" opacity="0.5"/>
    <circle cx="320" cy="45" r="1" opacity="0.8"/>
    <circle cx="250" cy="120" r="1.5" opacity="0.55"/>
  </g>
  <!-- Far hills -->
  <path d="M0 270 Q80 210 160 240 Q240 205 320 228 Q400 200 480 225 Q540 215 600 230 L600 400 L0 400Z"
        fill="#0d1a30" opacity="0.9"/>
  <!-- Mid hills -->
  <path d="M0 310 Q60 265 130 280 Q200 255 280 275 Q360 250 440 270 Q510 258 600 275 L600 400 L0 400Z"
        fill="#081220" opacity="0.95"/>
  <!-- Near hills / ground -->
  <path d="M0 350 Q70 315 150 330 Q230 305 310 325 Q390 310 470 328 Q530 318 600 330 L600 400 L0 400Z"
        fill="#040a14"/>
  <!-- City lights (faint dots) -->
  <g fill="#ffe9a0" opacity="0.5">
    <circle cx="180" cy="282" r="1.5"/><circle cx="195" cy="279" r="1"/>
    <circle cx="210" cy="283" r="1.5"/><circle cx="230" cy="280" r="1"/>
    <circle cx="350" cy="270" r="1.5"/><circle cx="370" cy="273" r="1"/>
    <circle cx="390" cy="270" r="2"/><circle cx="410" cy="275" r="1"/>
  </g>
</svg>`,

    "cloud-day": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <filter id="cloud-blur"><feGaussianBlur stdDeviation="2"/></filter>
    <linearGradient id="cloud-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(240,248,255,0.88)"/>
      <stop offset="100%" stop-color="rgba(200,220,240,0.7)"/>
    </linearGradient>
    <linearGradient id="hilld-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a5a7a" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#1a3050" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <!-- Layered clouds — back -->
  <g opacity="0.4" filter="url(#cloud-blur)">
    <ellipse cx="160" cy="120" rx="120" ry="40" fill="rgba(230,240,255,0.6)"/>
    <ellipse cx="200" cy="100" rx="80" ry="35" fill="rgba(240,248,255,0.7)"/>
    <ellipse cx="130" cy="108" rx="65" ry="28" fill="rgba(220,235,250,0.65)"/>
  </g>
  <!-- Main hero cloud -->
  <g opacity="0.82">
    <ellipse cx="370" cy="130" rx="160" ry="55" fill="url(#cloud-fill)"/>
    <ellipse cx="420" cy="105" rx="100" ry="48" fill="rgba(248,252,255,0.9)"/>
    <ellipse cx="330" cy="115" rx="90" ry="42" fill="rgba(245,250,255,0.85)"/>
    <ellipse cx="480" cy="125" rx="70" ry="38" fill="rgba(245,250,255,0.82)"/>
    <!-- Cloud underside shadow -->
    <ellipse cx="370" cy="178" rx="150" ry="15" fill="rgba(140,170,200,0.2)" filter="url(#cloud-blur)"/>
  </g>
  <!-- Smaller clouds mid -->
  <g opacity="0.55">
    <ellipse cx="100" cy="180" rx="90" ry="30" fill="rgba(220,235,255,0.65)"/>
    <ellipse cx="120" cy="165" rx="60" ry="26" fill="rgba(230,242,255,0.7)"/>
  </g>
  <!-- Hills -->
  <path d="M0 270 Q80 215 160 240 Q240 205 320 228 Q400 195 480 218 Q540 208 600 222 L600 400 L0 400Z"
        fill="url(#hilld-g)"/>
  <path d="M0 320 Q60 278 130 295 Q200 265 280 285 Q360 260 440 278 Q510 265 600 278 L600 400 L0 400Z"
        fill="#2a3d52" opacity="0.9"/>
  <path d="M0 360 Q70 330 150 345 Q230 320 310 338 Q390 322 470 340 Q530 328 600 340 L600 400 L0 400Z"
        fill="#1a2a38"/>
</svg>`,

    "cloud-night": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <filter id="cn-blur"><feGaussianBlur stdDeviation="2.5"/></filter>
  </defs>
  <!-- Dim moon behind clouds -->
  <circle cx="350" cy="80" r="28" fill="rgba(160,185,255,0.2)" filter="url(#cn-blur)"/>
  <!-- Dark clouds -->
  <g opacity="0.65" filter="url(#cn-blur)">
    <ellipse cx="360" cy="115" rx="155" ry="52" fill="rgba(50,65,90,0.85)"/>
    <ellipse cx="400" cy="95" rx="100" ry="46" fill="rgba(55,70,95,0.9)"/>
    <ellipse cx="300" cy="105" rx="90" ry="40" fill="rgba(48,62,88,0.88)"/>
  </g>
  <g opacity="0.45" filter="url(#cn-blur)">
    <ellipse cx="110" cy="160" rx="90" ry="30" fill="rgba(40,55,80,0.8)"/>
    <ellipse cx="130" cy="148" rx="60" ry="26" fill="rgba(45,60,85,0.8)"/>
  </g>
  <!-- Stars peeking -->
  <g fill="white" opacity="0.4">
    <circle cx="150" cy="55" r="1.5"/><circle cx="480" cy="50" r="1"/>
    <circle cx="520" cy="70" r="1.5"/><circle cx="200" cy="35" r="1"/>
  </g>
  <!-- Hills -->
  <path d="M0 270 Q80 215 160 240 Q240 205 320 228 Q400 195 480 218 Q540 208 600 222 L600 400 L0 400Z"
        fill="#0e1a28" opacity="0.9"/>
  <path d="M0 320 Q60 278 130 295 Q200 265 280 285 Q360 260 440 278 Q510 265 600 278 L600 400 L0 400Z"
        fill="#09121e" opacity="0.95"/>
  <path d="M0 360 Q70 330 150 345 Q230 320 310 338 Q390 322 470 340 Q530 328 600 340 L600 400 L0 400Z"
        fill="#050c14"/>
</svg>`,

    "rain-day": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <filter id="rain-blur"><feGaussianBlur stdDeviation="2"/></filter>
    <linearGradient id="rain-hills" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a4a5a" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#102030" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <!-- Heavy cloud layer -->
  <g opacity="0.75" filter="url(#rain-blur)">
    <ellipse cx="300" cy="80" rx="280" ry="65" fill="rgba(70,100,130,0.75)"/>
    <ellipse cx="350" cy="55" rx="200" ry="55" fill="rgba(80,110,145,0.8)"/>
    <ellipse cx="200" cy="70" rx="160" ry="48" fill="rgba(75,105,140,0.75)"/>
    <ellipse cx="500" cy="100" rx="130" ry="44" fill="rgba(65,95,130,0.7)"/>
  </g>
  <!-- Rain streaks -->
  <g opacity="0.55" stroke="rgba(130,210,255,0.7)" stroke-width="1.2" stroke-linecap="round">
    <line x1="120" y1="140" x2="108" y2="180"/><line x1="160" y1="155" x2="148" y2="200"/>
    <line x1="200" y1="145" x2="188" y2="188"/><line x1="245" y1="160" x2="233" y2="205"/>
    <line x1="290" y1="150" x2="278" y2="195"/><line x1="335" y1="165" x2="323" y2="210"/>
    <line x1="375" y1="148" x2="363" y2="193"/><line x1="420" y1="158" x2="408" y2="203"/>
    <line x1="465" y1="145" x2="453" y2="190"/><line x1="510" y1="160" x2="498" y2="205"/>
    <line x1="555" y1="150" x2="543" y2="195"/>
    <line x1="140" y1="200" x2="128" y2="250"/><line x1="185" y1="215" x2="173" y2="265"/>
    <line x1="230" y1="205" x2="218" y2="255"/><line x1="275" y1="220" x2="263" y2="270"/>
    <line x1="320" y1="208" x2="308" y2="258"/><line x1="365" y1="218" x2="353" y2="268"/>
    <line x1="410" y1="205" x2="398" y2="255"/><line x1="455" y1="215" x2="443" y2="265"/>
    <line x1="500" y1="208" x2="488" y2="258"/><line x1="545" y1="218" x2="533" y2="268"/>
  </g>
  <!-- Hills -->
  <path d="M0 270 Q80 215 160 240 Q240 205 320 228 Q400 195 480 218 Q540 208 600 222 L600 400 L0 400Z"
        fill="url(#rain-hills)"/>
  <path d="M0 320 Q60 278 130 295 Q200 265 280 285 Q360 260 440 278 Q510 265 600 278 L600 400 L0 400Z"
        fill="#1a2e3a" opacity="0.95"/>
  <path d="M0 358 Q70 328 150 343 Q230 318 310 336 Q390 320 470 338 Q530 326 600 338 L600 400 L0 400Z"
        fill="#0e1e28"/>
</svg>`,

    "rain-night": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <filter id="rn-blur"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <g opacity="0.8" filter="url(#rn-blur)">
    <ellipse cx="300" cy="75" rx="280" ry="60" fill="rgba(30,50,80,0.85)"/>
    <ellipse cx="360" cy="50" rx="200" ry="50" fill="rgba(35,55,88,0.9)"/>
    <ellipse cx="180" cy="68" rx="155" ry="45" fill="rgba(30,50,82,0.85)"/>
  </g>
  <g opacity="0.45" stroke="rgba(100,175,255,0.65)" stroke-width="1.2" stroke-linecap="round">
    <line x1="120" y1="135" x2="108" y2="178"/><line x1="165" y1="150" x2="153" y2="196"/>
    <line x1="210" y1="140" x2="198" y2="186"/><line x1="255" y1="155" x2="243" y2="202"/>
    <line x1="300" y1="145" x2="288" y2="192"/><line x1="345" y1="160" x2="333" y2="208"/>
    <line x1="390" y1="148" x2="378" y2="195"/><line x1="435" y1="158" x2="423" y2="205"/>
    <line x1="480" y1="145" x2="468" y2="192"/><line x1="525" y1="158" x2="513" y2="205"/>
    <line x1="148" y1="200" x2="136" y2="250"/><line x1="200" y1="215" x2="188" y2="265"/>
    <line x1="252" y1="205" x2="240" y2="255"/><line x1="304" y1="218" x2="292" y2="268"/>
    <line x1="356" y1="208" x2="344" y2="258"/><line x1="408" y1="218" x2="396" y2="268"/>
    <line x1="460" y1="205" x2="448" y2="255"/><line x1="512" y1="218" x2="500" y2="268"/>
  </g>
  <path d="M0 270 Q80 215 160 240 Q240 205 320 228 Q400 195 480 218 Q540 208 600 222 L600 400 L0 400Z"
        fill="#0a1520" opacity="0.95"/>
  <path d="M0 325 Q60 285 130 300 Q200 268 280 288 Q360 262 440 282 Q510 268 600 280 L600 400 L0 400Z"
        fill="#060e18"/>
  <g fill="rgba(255,230,120,0.45)" opacity="0.6">
    <circle cx="175" cy="283" r="1.5"/><circle cx="192" cy="280" r="1"/>
    <circle cx="340" cy="272" r="1.5"/><circle cx="360" cy="275" r="1"/>
    <circle cx="380" cy="270" r="2"/>
  </g>
</svg>`,

    "storm": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <filter id="storm-blur"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="lightning-glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <!-- Dark storm clouds -->
  <g opacity="0.88" filter="url(#storm-blur)">
    <ellipse cx="300" cy="70" rx="295" ry="70" fill="rgba(20,35,65,0.92)"/>
    <ellipse cx="250" cy="45" rx="200" ry="58" fill="rgba(25,40,75,0.95)"/>
    <ellipse cx="400" cy="55" rx="180" ry="55" fill="rgba(22,38,72,0.9)"/>
    <ellipse cx="120" cy="85" rx="130" ry="46" fill="rgba(18,32,62,0.88)"/>
  </g>
  <!-- Lightning bolt -->
  <g filter="url(#lightning-glow)">
    <polygon points="330,130 312,185 328,185 310,255 345,185 328,185 346,130"
             fill="rgba(220,240,255,0.88)" opacity="0.9"/>
    <polygon points="330,130 312,185 328,185 310,255 345,185 328,185 346,130"
             fill="rgba(160,210,255,0.4)" transform="scale(1.1) translate(-30,-13)"/>
  </g>
  <!-- Heavy rain -->
  <g opacity="0.48" stroke="rgba(120,190,255,0.65)" stroke-width="1.4" stroke-linecap="round">
    <line x1="100" y1="130" x2="82" y2="185"/><line x1="150" y1="145" x2="132" y2="205"/>
    <line x1="200" y1="135" x2="182" y2="195"/><line x1="250" y1="148" x2="232" y2="210"/>
    <line x1="400" y1="138" x2="382" y2="198"/><line x1="450" y1="148" x2="432" y2="210"/>
    <line x1="500" y1="138" x2="482" y2="198"/><line x1="548" y1="148" x2="530" y2="210"/>
    <line x1="125" y1="200" x2="107" y2="260"/><line x1="178" y1="215" x2="160" y2="275"/>
    <line x1="228" y1="205" x2="210" y2="265"/><line x1="278" y1="218" x2="260" y2="278"/>
    <line x1="378" y1="205" x2="360" y2="265"/><line x1="428" y1="215" x2="410" y2="275"/>
    <line x1="478" y1="205" x2="460" y2="265"/><line x1="528" y1="218" x2="510" y2="278"/>
  </g>
  <!-- Dark ground -->
  <path d="M0 280 Q80 228 160 252 Q240 218 320 240 Q400 208 480 230 Q540 220 600 234 L600 400 L0 400Z"
        fill="#0a1420" opacity="0.95"/>
  <path d="M0 335 Q60 295 130 310 Q200 278 280 298 Q360 272 440 292 Q510 278 600 292 L600 400 L0 400Z"
        fill="#060d18"/>
</svg>`,

    "snow": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <filter id="snow-blur"><feGaussianBlur stdDeviation="2"/></filter>
    <linearGradient id="snow-hills" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(210,230,250,0.7)"/>
      <stop offset="100%" stop-color="rgba(140,180,220,0.9)"/>
    </linearGradient>
    <linearGradient id="snow-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(230,242,255,0.9)"/>
      <stop offset="100%" stop-color="rgba(180,210,240,0.95)"/>
    </linearGradient>
  </defs>
  <!-- Snow clouds -->
  <g opacity="0.65" filter="url(#snow-blur)">
    <ellipse cx="290" cy="85" rx="260" ry="62" fill="rgba(200,220,245,0.7)"/>
    <ellipse cx="340" cy="62" rx="190" ry="54" fill="rgba(215,232,252,0.75)"/>
    <ellipse cx="180" cy="75" rx="155" ry="46" fill="rgba(205,225,248,0.72)"/>
  </g>
  <!-- Snowflakes -->
  <g fill="rgba(240,250,255,0.8)">
    <circle cx="140" cy="150" r="3"/><circle cx="190" cy="168" r="2"/>
    <circle cx="240" cy="155" r="3"/><circle cx="288" cy="170" r="2"/>
    <circle cx="335" cy="158" r="3"/><circle cx="382" cy="172" r="2"/>
    <circle cx="428" cy="155" r="3"/><circle cx="475" cy="168" r="2"/>
    <circle cx="520" cy="158" r="3"/><circle cx="160" cy="218" r="2"/>
    <circle cx="208" cy="232" r="3"/><circle cx="258" cy="220" r="2"/>
    <circle cx="308" cy="235" r="3"/><circle cx="356" cy="222" r="2"/>
    <circle cx="404" cy="235" r="3"/><circle cx="452" cy="220" r="2"/>
    <circle cx="500" cy="232" r="2.5"/>
  </g>
  <!-- Snow-covered hills -->
  <path d="M0 268 Q80 212 160 238 Q240 202 320 225 Q400 192 480 215 Q540 205 600 218 L600 400 L0 400Z"
        fill="rgba(60,90,130,0.6)"/>
  <!-- Snow cap on hills -->
  <path d="M0 268 Q80 212 160 238 Q240 202 320 225 Q400 192 480 215 Q540 205 600 218 L600 255 Q540 242 480 248 Q400 228 320 260 Q240 238 160 272 Q80 248 0 304Z"
        fill="url(#snow-hills)" opacity="0.6"/>
  <path d="M0 318 Q60 278 130 295 Q200 262 280 282 Q360 258 440 278 Q510 264 600 278 L600 400 L0 400Z"
        fill="rgba(40,65,95,0.85)"/>
  <!-- Snow ground layer -->
  <path d="M0 355 Q70 328 150 340 Q230 315 310 333 Q390 318 470 335 Q530 324 600 335 L600 400 L0 400Z"
        fill="url(#snow-ground)" opacity="0.55"/>
</svg>`,

    "mist": () => `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
  <defs>
    <filter id="mist-blur"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="mist-soft"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <!-- Background hills (barely visible through mist) -->
  <path d="M0 240 Q80 185 160 210 Q240 178 320 200 Q400 170 480 192 Q540 182 600 196 L600 400 L0 400Z"
        fill="rgba(90,110,130,0.25)" filter="url(#mist-blur)"/>
  <!-- Mist layers -->
  <rect x="0" y="145" width="600" height="50" rx="25"
        fill="rgba(210,218,228,0.22)" filter="url(#mist-blur)"/>
  <rect x="0" y="195" width="600" height="60" rx="30"
        fill="rgba(200,212,224,0.28)" filter="url(#mist-blur)"/>
  <rect x="0" y="255" width="600" height="55" rx="25"
        fill="rgba(195,208,222,0.32)" filter="url(#mist-blur)"/>
  <rect x="0" y="310" width="600" height="50" rx="25"
        fill="rgba(190,205,218,0.35)" filter="url(#mist-blur)"/>
  <!-- Mid hills through mist -->
  <path d="M0 290 Q60 255 130 270 Q200 245 280 265 Q360 242 440 262 Q510 248 600 262 L600 400 L0 400Z"
        fill="rgba(70,90,110,0.35)" filter="url(#mist-soft)"/>
  <!-- Ground -->
  <path d="M0 345 Q70 315 150 330 Q230 305 310 325 Q390 310 470 328 Q530 316 600 328 L600 400 L0 400Z"
        fill="rgba(55,72,90,0.65)"/>
  <!-- Mist wisps -->
  <g opacity="0.4" filter="url(#mist-soft)">
    <ellipse cx="100" cy="230" rx="100" ry="18" fill="rgba(220,230,240,0.5)"/>
    <ellipse cx="300" cy="265" rx="130" ry="20" fill="rgba(215,226,238,0.45)"/>
    <ellipse cx="500" cy="250" rx="110" ry="16" fill="rgba(218,228,240,0.5)"/>
  </g>
</svg>`
};

/**
 * Get weather condition icon emoji
 */
export function getWeatherIcon(conditionText, isDay) {
    const c = (conditionText || "").toLowerCase();
    if (c.includes("thunder") || c.includes("storm")) return "⛈️";
    if (c.includes("snow") || c.includes("sleet") || c.includes("blizzard")) return "❄️";
    if (c.includes("heavy rain")) return "🌧️";
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return isDay ? "🌦️" : "🌧️";
    if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "🌫️";
    if (c.includes("overcast")) return "☁️";
    if (c.includes("cloud")) return isDay ? "⛅" : "🌥️";
    if (c.includes("sunny") || (c.includes("clear") && isDay)) return "☀️";
    if (!isDay) return "🌙";
    return "🌤️";
}

/**
 * Get condition theme key (matches THEME_PRESETS in weather-app.js)
 */
function getThemeKey(conditionText, isDay) {
    const c = (conditionText || "").toLowerCase();
    if (c.includes("thunder") || c.includes("storm")) return "storm";
    if (c.includes("snow") || c.includes("sleet") || c.includes("ice")) return "snow";
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return isDay ? "rain-day" : "rain-night";
    if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "mist";
    if (c.includes("cloud") || c.includes("overcast")) return isDay ? "cloud-day" : "cloud-night";
    return isDay ? "clear-day" : "clear-night";
}

/**
 * Inject weather illustration into the hero panel.
 * Creates or updates the .weather-illustration element.
 */
export function renderWeatherIllustration(heroPanelEl, conditionText, isDay) {
    const themeKey = getThemeKey(conditionText, isDay);
    const svgFn    = ILLUSTRATIONS[themeKey] || ILLUSTRATIONS["clear-day"];

    let container = heroPanelEl.querySelector(".weather-illustration");
    if (!container) {
        container = document.createElement("div");
        container.className = "weather-illustration";
        heroPanelEl.prepend(container);
    }

    container.classList.remove("is-ready");
    container.innerHTML = svgFn();

    // Fade in after paint
    requestAnimationFrame(() => {
        requestAnimationFrame(() => container.classList.add("is-ready"));
    });
}

/**
 * Inject animated particles (rain/snow/lightning) into the hero panel.
 * Removes any existing particle layer first.
 */
export function renderHeroParticles(heroPanelEl, themeKey) {
    const existing = heroPanelEl.querySelector(".hero-particles");
    if (existing) existing.remove();

    const isRain  = themeKey === "rain-day" || themeKey === "rain-night";
    const isStorm = themeKey === "storm";
    const isSnow  = themeKey === "snow";

    if (!isRain && !isStorm && !isSnow) return;

    const container = document.createElement("div");
    container.className = "hero-particles";
    heroPanelEl.prepend(container);

    if (isStorm) {
        const flash = document.createElement("div");
        flash.className = "lightning-flash";
        container.appendChild(flash);
    }

    if (isRain || isStorm) {
        const count = isStorm ? 28 : 18;
        for (let i = 0; i < count; i++) {
            const p = document.createElement("div");
            p.className = "rain-particle";
            p.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-duration: ${0.6 + Math.random() * 0.7}s;
                animation-delay: ${-Math.random() * 1.5}s;
                opacity: ${0.4 + Math.random() * 0.4};
                height: ${12 + Math.random() * 16}px;
            `;
            container.appendChild(p);
        }
    }

    if (isSnow) {
        for (let i = 0; i < 22; i++) {
            const p = document.createElement("div");
            p.className = "snow-particle";
            p.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-duration: ${2.5 + Math.random() * 2}s;
                animation-delay: ${-Math.random() * 3}s;
                width: ${3 + Math.random() * 4}px;
                height: ${3 + Math.random() * 4}px;
            `;
            container.appendChild(p);
        }
    }
}