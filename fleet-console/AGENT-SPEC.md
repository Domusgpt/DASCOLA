# D'Ascola Fleet Console — Production Template & Agent Specification

## Overview

The Fleet Console is a standalone, full-viewport interactive maritime operations map for D'Ascola Seafood. It tracks fishing vessels across the South Atlantic, visualizes air freight routes from Santos (Brazil) to US markets, and provides cinematic port-by-port exploration with real-time AIS vessel tracking.

**Architecture**: MapLibre GL JS (accurate coastlines) + Three.js (holographic glass overlay) + GSAP (cinematic animations) + AIS Client (live vessel tracking)

**File**: `fleet-console/index.html` — self-contained, all dependencies bundled in `fleet-console/lib/`

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FLEET CONSOLE (Browser)                    │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ MapLibre   │  │ Three.js     │  │ AIS Client          │  │
│  │ GL JS      │  │ Holographic  │  │                     │  │
│  │            │  │ Overlay      │  │ polls endpoint      │  │
│  │ - Dark     │  │              │  │ every 60s by MMSI   │  │
│  │   tiles    │  │ - GLSL glass │  │                     │  │
│  │ - Markers  │  │ - Scanlines  │  │ merges lat/lon/     │  │
│  │ - Routes   │  │ - Bloom      │  │ heading/speed       │  │
│  │ - flyTo    │  │ - Chromatic  │  │                     │  │
│  │   camera   │  │   aberration │  │ fallback: simulated │  │
│  │            │  │              │  │ sinusoidal drift    │  │
│  └────────────┘  └──────────────┘  └──────────┬──────────┘  │
│                                                │              │
│  ┌─────────────────────────────────────────────┘              │
│  │  Console UI                                               │
│  │  - Top bar (stats, AIS status)                            │
│  │  - Sidebar (vessel roster)                                │
│  │  - Port info panel (stats, nearby vessels)                │
│  │  - Bottom nav (port buttons by region)                    │
│  │  - Auto-tour mode                                         │
│  │  - Route particle animation (canvas overlay)              │
│  └───────────────────────────────────────────────────────────┘
│                                                              │
└──────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────────┐
│ CartoDB Dark     │          │ AIS API Endpoint     │
│ Raster Tiles     │          │ (configurable)       │
│ (free, no key)   │          │                     │
│                  │          │ GET ?mmsi=123,456    │
│ Accurate coast-  │          │ Returns JSON array   │
│ lines matching   │          │ of vessel positions  │
│ Google Maps      │          │                     │
└─────────────────┘          └─────────────────────┘
```

---

## Data Model

### Vessels
```javascript
{
  name: 'Ana Amaral',           // Display name
  lat: -25.4,                   // Decimal degrees (updated by AIS)
  lon: -44.2,                   // Decimal degrees (updated by AIS)
  heading: 155,                 // Compass degrees 0-360 (updated by AIS)
  speed: 6.8,                   // Knots (updated by AIS)
  type: 'Longliner',           // Vessel classification
  status: 'Fishing',           // Fishing | Returning | In Port | In Transit
  catch: 'Swordfish',          // Primary catch species
  captain: 'Takeshi',          // Captain name (optional)
  detail: 'Premium-grade...',  // One-line description
  mmsi: null,                  // AIS MMSI identifier (set for live tracking)
  lastUpdate: null,            // ISO 8601 timestamp of last AIS update
}
```

**Current fleet (5 vessels):**
| Vessel | Position | Type | Status | Catch | MMSI |
|--------|----------|------|--------|-------|------|
| Ana Amaral | -25.4, -44.2 | Longliner | Fishing | Swordfish | null |
| Brisa C | -24.1, -45.4 | Longliner | Returning | Swordfish | null |
| Blaze I | -33.2, -49.8 | Trawler | Fishing | Monkfish | null |
| Cordeiro de Deus E | -20.5, -29.3 | Factory | Fishing | Carabineros | null |
| Prudence | 12.4, -62.1 | Longliner | Fishing | Yellowfin Tuna | null |

### Ports
```javascript
{
  name: 'Santos',
  lat: -23.96, lon: -46.33,
  size: 'major',                // major | minor (affects marker size/glow)
  region: 'São Paulo, Brazil',  // Used for grouping in nav bar
  desc: 'Company headquarters since 1893...',
  stats: { depth: '16m', vessels: 3, species: 'All species', established: '1893' },
  zoom: 14, pitch: 60, bearing: -15,  // Cinematic camera for flyTo
}
```

**Port groups:**
- **Brazil (4):** Florianópolis → Santos (HQ) → Rio de Janeiro → Vitória
- **Caribbean (1):** St. George's (Grenada)
- **USA (11):** Boston, New York, Newark, Montauk, Washington DC, Jacksonville, Miami, Houston, Chicago, San Francisco, Los Angeles

### Air Routes (10)
All originate from GRU (São Paulo) at [-46.47, -23.43]. Great circle arcs computed mathematically. Animated gold particles travel along each route.

### Ocean Route (1)
Trindade Grounds: Santos → Rio offshore → Trindade Island → Cordeiro de Deus E position

---

## AIS Integration

### Configuration
```javascript
// In fleet-console/index.html, edit AIS_CONFIG:
const AIS_CONFIG = {
  aisEndpoint: null,           // Set to your API URL
  aisRefreshMs: 60000,         // Poll interval in ms
  fetchTimeoutMs: 10000,       // Abort after 10s
};
```

### Expected API Contract
```
GET {aisEndpoint}?mmsi=710012345,710012346,710012347

Response 200:
[
  {
    "mmsi": "710012345",
    "lat": -24.2,
    "lon": -44.8,
    "heading": 135,
    "speed": 7.2,
    "status": "Fishing",        // optional
    "timestamp": "2026-03-24T14:30:00Z"  // optional
  }
]
```

### AIS Client Lifecycle
1. `new AISClient(config, vessels, onUpdate)` — creates client
2. `aisClient.start()` — immediate fetch + `setInterval`
3. Each fetch: builds MMSI query → HTTP GET → JSON parse → merge by MMSI → callback
4. `aisClient.stop()` — pauses polling
5. `aisClient.destroy()` — full teardown

### Simulated Drift (Fallback)
When `aisEndpoint` is null, runs every 2 seconds:
- Sinusoidal lat/lon wobble (0.00008° amplitude per frame)
- Per-vessel phase offset for natural independent movement
- Heading drift (±0.2° sinusoidal)
- Speed fluctuation (±0.02 kn sinusoidal)

### Status Indicator
Top bar shows:
- `● LIVE 3v · #42` — Live AIS, 3 vessels updated, 42nd fetch
- `● SIM drift` — Simulated drift mode
- `● ERR retry...` — Fetch failed, will retry next interval

---

## Cinematic Camera System

Each port has custom flyTo parameters:

| Port | Zoom | Pitch | Bearing | Effect |
|------|------|-------|---------|--------|
| Florianópolis | 13 | 55° | -30° | Angled south-to-north approach |
| Santos | 14 | 60° | -15° | Close dramatic overhead |
| Rio de Janeiro | 13 | 50° | +20° | Coastal sweep |
| Vitória | 13 | 55° | -40° | Harbor approach angle |
| St. George's | 13 | 50° | +10° | Caribbean island view |
| US cities | 12 | 45° | 0° | Standard city overview |

**Vessel zoom**: Flies to vessel position at zoom 11, pitch 55°, bearing = vessel heading - 180° (chase-cam effect looking at the bow).

**Auto-tour**: Cycles through Brazilian ports → Caribbean → overview, 6s per stop.

---

## Three.js Holographic Glass Layer

Custom GLSL fragment shader creating:
1. **Iridescent bands** — 3 overlapping sine waves at different frequencies creating R/G/B color separation
2. **Chromatic aberration** — RGB channels offset slightly for prismatic edge effect
3. **Edge vignette** — Stronger holographic glow at viewport edges
4. **Noise grain** — Hash-based noise for analog texture
5. **Scanline modulation** — 400-line vertical scanlines at 15% opacity

Rendered as a full-screen orthographic quad via `THREE.ShaderMaterial` with `mix-blend-mode: screen` at 7% opacity.

---

## Console UI Components

### Top Bar
- Company title + subtitle
- Fleet stats: Vessels (5), Ports (16), Air Routes (10), Fishing (4)
- AIS status indicator

### Vessel Roster (Sidebar)
- Toggle with hamburger button or `R` key
- Cards show: name, type, status badge, catch, captain, speed/heading
- Click card → flyTo vessel

### Port Info Panel
- Slides in from right on port selection
- Shows: name, region, description, stats grid (depth, vessels, species, established)
- Close button or Escape

### Port Navigation Bar
- Bottom of screen, horizontal scroll
- Grouped by region with colored dots (green=Brazil, gold=USA, blue=Caribbean)
- Click → cinematic flyTo

### Route Particles
- Canvas overlay animating gold dots along great circle arcs
- 2 particles per route at different phases/speeds
- Glow effect via radial gradient

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-4` | Fly to Brazilian ports (south → north) |
| `T` | Toggle auto-tour |
| `R` | Toggle vessel roster sidebar |
| `Esc` | Return to overview + close panels + stop tour |

---

## File Structure

```
fleet-console/
├── index.html              # Complete standalone application (≈1000 lines)
├── lib/
│   ├── maplibre-gl.js      # MapLibre GL JS v3.6.2
│   ├── maplibre-gl.css     # MapLibre styles
│   ├── three.min.js        # Three.js r160
│   └── gsap.min.js         # GSAP 3.12.5
└── AGENT-SPEC.md           # This document
```

---

## Extension Points (For Future Agents)

### 1. Enable Real AIS Tracking
Set actual MMSI numbers on vessels and configure the endpoint:
```javascript
// In VESSELS array:
{ name: 'Ana Amaral', mmsi: '710XXXXXX', ... }

// In AIS_CONFIG:
const AIS_CONFIG = { aisEndpoint: 'https://your-ais-api.com/v1/positions', ... };
```

### 2. Add New Vessels
Add to the `VESSELS` array. Include all fields. The system auto-generates markers, roster cards, and includes them in AIS polling.

### 3. Add New Ports
Add to the `PORTS` array with cinematic camera params:
```javascript
{ name: 'Porto Alegre', lat: -30.03, lon: -51.23, size: 'minor',
  region: 'Southern Brazil', desc: '...', stats: { ... },
  zoom: 13, pitch: 55, bearing: -20 }
```

### 4. Add New Air Routes
Add to `AIR_ROUTES` array. Great circle arcs are computed automatically:
```javascript
{ from: [-46.47, -23.43], to: [-90.0, 30.0], code: 'GRU→MSY' }
```

### 5. Upgrade Map Tiles
Replace CartoDB with Mapbox, Google, or satellite tiles:
```javascript
// In map style.sources:
tiles: ['https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN']
```

### 6. Add Weather Overlay
The NOAA weather service exists at `fleet-map/services/noaa.js`. Can be ported to add SST (sea surface temperature), wind, and wave data overlays.

### 7. At-Sea Coordination Features (Roadmap)
Future capabilities for maritime coordination:
- **Vessel-to-vessel messaging** via satellite (Starlink/Iridium)
- **Catch reporting** — real-time species/weight logging from vessels
- **ETA tracking** — estimated arrival times at ports
- **Weather routing** — optimal path recommendations
- **Geofence alerts** — notify when vessels enter/leave fishing zones
- **Cold chain monitoring** — temperature telemetry from freezer holds
- **Crew communications** — text/voice relay through shore infrastructure
- **Regulatory compliance** — automatic logbook generation, NOAA SIMP reporting

### 8. Three.js Enhancements
- **3D bathymetry** — ocean depth as terrain mesh
- **Vessel 3D models** — GLTF fishing boat models instead of 2D dots
- **Glass refraction** — sample map texture through a refractive glass shader
- **Volumetric fog** — atmospheric haze over the ocean
- **Day/night cycle** — sun position affecting lighting

---

## Agent Instructions

When an AI agent is tasked with modifying or extending the fleet console, follow these guidelines:

### Before Starting
1. Read `fleet-console/index.html` to understand the current implementation
2. Read this spec document for architecture and data model
3. Check `fleet-map/ais.js`, `fleet-map/services/`, and `fleet-map/vessels.json` for reference implementations
4. Run the existing Playwright test (`test-console.mjs`) to verify current state

### Code Organization
The file is organized in numbered PARTs:
- **PART 2**: Data constants (VESSELS, PORTS, AIR_ROUTES)
- **PART 3**: MapLibre map initialization
- **PART 4**: Great circle arc computation
- **PART 5**: Layers & markers added on map load
- **PART 6**: UI interactions (nav bar, roster, toggles)
- **PART 7**: Cinematic flyTo animations
- **PART 8**: Auto-tour system
- **PART 9**: Holographic overlay (Canvas 2D)
- **PART 10**: Route particle animation
- **PART 11**: Three.js holographic glass (GLSL shader)
- **PART 12**: AIS integration
- **PART 13**: Keyboard shortcuts

### Testing Protocol
Use Playwright with the existing Chromium at `/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome`:
```javascript
const browser = await chromium.launch({
  headless: true,
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
  args: ['--enable-webgl', '--use-gl=swiftshader'],
});
```
Note: Map tiles won't render in headless (no external DNS). Verify UI layout, JS errors, and marker positions instead.

### Design Language
- **Background**: `#030810` (deep navy)
- **Gold accent**: `#D4A54A` (ouro — used for highlights, routes, stats)
- **Green**: `#0A7E6E` (verde — land, Brazilian port dots)
- **Blue-gray**: `#9CC5C9` (blade — secondary text)
- **Cream**: `#F5EDD8` (creme — primary text)
- **Fonts**: Playfair Display (display), Josefin Sans (sans), JetBrains Mono (mono)
- **Glass panels**: `backdrop-filter: blur(16px) saturate(1.4)` with `rgba(3,8,16,.72)` background
- **All transitions**: `cubic-bezier(.4,0,.2,1)` easing, 300-500ms duration

### Quality Standards
- Zero JS console errors
- All flyTo animations complete without jank
- Glass panels render with proper backdrop blur
- Port markers pulse with animation
- Vessel markers show heading indicators
- Route particles animate continuously
- AIS status updates in top bar
- Keyboard shortcuts all functional
- Mobile responsive (port nav scrollable, panels adapt)

---

## Deployment

### Static Hosting (Recommended)
The console is a static site. Deploy to:
- GitHub Pages: `https://domusgpt.github.io/DASCOLA/fleet-console/`
- Vercel/Netlify: point to `fleet-console/` directory
- S3 + CloudFront: upload `fleet-console/` contents

### AIS Backend Requirements
If enabling live AIS:
- CORS-enabled HTTP API
- JSON response format (see API Contract above)
- Recommended: proxy through your own backend to add auth/caching
- AIS data sources: MarineTraffic API, VesselFinder API, AISHub, or direct AIS receiver

### Environment Variables
None required. All configuration is in the `AIS_CONFIG` and `VESSELS` constants within the HTML file. For production, consider extracting to a separate `config.js`.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-24 | Initial build — MapLibre + Three.js + GSAP + AIS client |
| 1.1 | 2026-03-24 | Production polish — loading state, mobile responsive, nearby vessels |

---

*This document is the authoritative specification for the D'Ascola Fleet Console. Any AI agent or developer working on this system should read it in full before making changes.*
