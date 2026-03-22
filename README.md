# Fleet Map

A canvas-based, animated fleet tracking map for the fishing industry. Built with vanilla JavaScript ES modules — zero dependencies, zero build step.

**[Live Demo →](https://domusgpt.github.io/fleet-map/demos/viking-village/)**

![Fleet Map](docs/preview.png)

## Features

- **5-layer canvas rendering** — depth, currents, coastline, vessels, atmosphere
- **250-particle ocean currents** — animated flow along real current paths
- **Interactive vessel tracking** — hover tooltips, click callbacks, roster panel
- **Barnegat Lighthouse compass rose** — or classic 8-point star
- **AIS integration ready** — poll any REST endpoint for live positions
- **Responsive** — desktop sidebar roster becomes mobile horizontal scroll
- **Configurable everything** — colors, fonts, bounds, coastline data, vessel data
- **Home decor mode** — designed to look beautiful on a framed screen

## Quick Start

```html
<!-- Load fonts -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Josefin+Sans:wght@200;300;400&display=swap" rel="stylesheet">

<!-- Load fleet map styles -->
<link rel="stylesheet" href="src/styles.css">

<!-- Map container -->
<div class="fleet-map" id="fleetMap">
  <canvas id="fleetCanvasDepth"></canvas>
  <canvas id="fleetCanvasCurrents"></canvas>
  <canvas id="fleetCanvasCoast"></canvas>
  <canvas id="fleetCanvasVessels"></canvas>
  <canvas id="fleetCanvasAtmo"></canvas>
  <div class="vessel-info" id="vesselInfo">
    <h4 id="viName"></h4>
    <p id="viDetail"></p>
    <span class="vi-status" id="viStatus"></span>
  </div>
</div>

<!-- Initialize -->
<script type="module">
  import { FleetMap } from './src/index.js';

  const map = new FleetMap('#fleetMap', {
    title: 'My Fleet',
    bounds: { latN: 41, latS: 39, lonW: -74.5, lonE: -71 },
    vessels: [
      { name: 'Vessel One', lat: 40.0, lon: -73.0, heading: 45, speed: 6, type: 'Trawler', status: 'Fishing', catch: 'Cod' },
    ],
    ports: [
      { name: 'Home Port', lat: 40.5, lon: -74.0, size: 'major' },
    ],
  });

  map.start();
</script>
```

## Demos

| Demo | Description | Link |
|------|-------------|------|
| **Viking Village** | 22 real vessels from Barnegat Light, NJ. Lighthouse compass rose, NJ fishing grounds. | [View →](demos/viking-village/) |
| **D'Ascola Seafood** | Brazilian fleet off Santos. South Atlantic currents, Brazil coastline. | [View →](demos/dascola/) |

## API

### `new FleetMap(selector, config)`

Creates a new fleet map instance.

```js
const map = new FleetMap('#fleetMap', { ... });
```

### `map.start()`

Begin rendering and AIS polling (if configured).

### `map.stop()`

Pause rendering and AIS polling.

### `map.destroy()`

Clean up all resources, event listeners, and DOM elements.

### `map.updateVessels(array)`

Replace the vessel list. Updates the map, roster, and stats automatically. This is the main integration point for dashboard UIs.

```js
// Fetch new positions from your API
const vessels = await fetch('/api/vessels').then(r => r.json());
map.updateVessels(vessels);
```

## Configuration

All options with defaults:

```js
{
  // Branding
  title: 'Fleet Tracker',
  subtitle: '',

  // Geographic bounds (decimal degrees)
  bounds: { latN: 41, latS: 39, lonW: -75, lonE: -71 },

  // Performance
  particleCount: 250,        // Desktop particle count
  particleCountMobile: 100,  // Mobile particle count
  trailLength: 20,           // Vessel wake trail length
  mobileBreakpoint: 900,     // px width for mobile layout

  // AIS live tracking
  aisEndpoint: null,         // REST API URL (null = simulated drift)
  aisRefreshMs: 60000,       // Polling interval (ms)

  // Colors (CSS rgba strings)
  colors: {
    deep:      'rgba(4,10,16,1)',       // Deep ocean background
    ouro:      'rgba(201,168,76,1)',    // Accent / fishing status
    verde:     'rgba(0,104,71,1)',      // Land / in-port status
    blade:     'rgba(139,175,196,1)',   // Currents / transit status
    creme:     'rgba(240,235,224,1)',   // Light text
    land:      ['rgba(...)','...','...'], // 3-stop land gradient
    ocean:     ['rgba(...)','...','...'], // 3-stop ocean gradient
    fathom:    'rgba(27,58,92,0.12)',   // Contour lines
    grid:      'rgba(201,168,76,0.04)', // Lat/lon grid
    coastGlow: 'rgba(201,168,76,0.08)', // Coast outer glow
    coastLine: 'rgba(201,168,76,0.35)', // Coast line
  },

  // Fonts
  fonts: {
    display: '"Playfair Display", Georgia, serif',
    sans: '"Josefin Sans", sans-serif',
  },

  // Data
  vessels: [],     // Array of vessel objects
  ports: [],       // Array of port objects
  routes: [],      // Array of route objects
  coastData: 'brazil',         // 'brazil', 'lbi', or custom [[lat,lon],...]
  currentData: 'south-atlantic', // 'south-atlantic', 'nj-atlantic', or custom array

  // Callbacks
  onVesselHover: null,   // function(vessel, {x, y})
  onVesselClick: null,   // function(vessel)
  onAISUpdate: null,     // function(vessels)
}
```

## Vessel Object Format

```js
{
  name: 'F/V Karen L',        // Display name
  mmsi: '338123456',           // AIS MMSI (null for simulated)
  lat: 39.85,                  // Latitude (positive = north)
  lon: -73.65,                 // Longitude (negative = west)
  heading: 135,                // Degrees (0=N, 90=E, 180=S, 270=W)
  speed: 4.2,                  // Knots
  type: 'Scalloper',           // Vessel type string
  status: 'Fishing',           // 'Fishing'|'Scalloping'|'In Transit'|'In Port'|'Returning'
  catch: 'Sea Scallops',       // Current catch (or '—' for none)
}
```

## Customization Guide

### Rebrand in 5 Lines

Change these CSS custom properties in your stylesheet:

```css
:root {
  --fm-accent:       #C41E3A;  /* Your brand color */
  --fm-deep:         #0F1B3D;  /* Dark background */
  --fm-land:         #3A6B35;  /* Land/port color */
  --fm-text:         #D4B896;  /* Light text */
  --fm-font-display: 'Your Font', serif;
}
```

### New Geographic Region

1. Create a coastline data file: `[[lat, lon], ...]` points north→south
2. Create a current data file: `[{ points, strength, width }, ...]`
3. Update the layer files for your region's geography (land direction, labels)
4. Set `bounds`, `coastData`, `currentData` in config

See `demos/viking-village/` for a complete example of adapting to a new region.

### Add Your Own Vessels

Pass them in the config or call `map.updateVessels()` at any time:

```js
map.updateVessels([
  { name: 'My Boat', lat: 40.0, lon: -73.5, heading: 90, speed: 5, type: 'Trawler', status: 'Fishing', catch: 'Tuna' },
]);
```

### AIS Live Tracking

Set `aisEndpoint` to a URL that returns JSON matching the vessel format:

```js
const map = new FleetMap('#fleetMap', {
  aisEndpoint: 'https://your-api.com/vessels',
  aisRefreshMs: 30000, // Poll every 30 seconds
});
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  FleetMap (index.js)             │
│  start() · stop() · destroy() · updateVessels() │
├──────────┬──────────────────────────────────────┤
│ Config   │ Merge defaults + user overrides       │
├──────────┼──────────────────────────────────────┤
│ Canvas   │ 5-layer stack with DPR scaling        │
│ Manager  │ depth → currents → coast → vessels    │
│ (core)   │ → atmosphere                          │
├──────────┼──────────────────────────────────────┤
│ Layers   │ depth.js    — Bathymetry + grid       │
│          │ currents.js — Particle simulation      │
│          │ coast.js    — Coastline + ports        │
│          │ vessels.js  — Triangles + compass      │
│          │ atmosphere.js — Fog vignette           │
├──────────┼──────────────────────────────────────┤
│ UI       │ roster.js     — Side panel list        │
│          │ interaction.js — Hover/click/tooltip    │
├──────────┼──────────────────────────────────────┤
│ Data     │ ais.js — Live AIS endpoint polling     │
│          │ Coastline + current datasets           │
└──────────┴──────────────────────────────────────┘
```

## File Structure

```
fleet-map/
├── src/                      # Core library
│   ├── index.js              # FleetMap class
│   ├── config.js             # Defaults + mergeConfig
│   ├── core.js               # CanvasManager
│   ├── projection.js         # Lat/lon ↔ screen coords
│   ├── roster.js             # Vessel roster panel
│   ├── interaction.js        # Mouse/touch events
│   ├── ais.js                # AIS polling client
│   ├── styles.css            # Default stylesheet
│   ├── layers/
│   │   ├── depth.js          # Bathymetry
│   │   ├── currents.js       # Particle currents
│   │   ├── coast.js          # Coastline + labels
│   │   ├── vessels.js        # Vessel triangles
│   │   └── atmosphere.js     # Fog vignette
│   └── data/
│       ├── brazil-coast.js   # Brazil coastline
│       ├── currents-sa.js    # South Atlantic currents
│       ├── lbi-coast.js      # NJ/LBI coastline
│       └── currents-nj.js    # NJ Atlantic currents
├── demos/
│   ├── viking-village/       # Barnegat Light, NJ
│   └── dascola/              # Santos, Brazil
├── docs/                     # Documentation
└── index.html                # GitHub Pages landing
```

## Browser Support

Works in all modern browsers with ES module and Canvas 2D support:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

## License

MIT

## Credits

- **Viking Village, Inc.** — Vessel names and fleet data ([vikingvillage.net](https://www.vikingvillage.net))
- **Barnegat Lighthouse** — Compass rose inspiration ([Wikipedia](https://en.wikipedia.org/wiki/Barnegat_Lighthouse))
- **D'Ascola Seafood** — Original fleet map concept
- Built with vanilla JavaScript, HTML5 Canvas, zero dependencies
