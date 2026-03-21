# Fleet Map — Modular Fleet Tracking System

A canvas-based, animated fleet tracking map designed for fishing and seafood companies that want a visual real-time vessel tracker on their website. Built with vanilla JavaScript (ES modules), no framework dependencies.

---

## Overview

Fleet Map renders an interactive nautical chart showing vessel positions, ocean currents, coastlines, ports, and shipping routes. It uses a 5-layer canvas stack for performance — static layers (bathymetry, coastline, atmosphere) only redraw when needed, while animated layers (current particles, vessel positions) render at 60fps.

The system ships with a South Atlantic / Brazilian coast dataset but can be adapted to any ocean region by swapping the coastline and current data files.

**Key features:**

- Animated particle-based ocean currents
- Vessel triangles with heading, wake trails, and ping rings
- Hover tooltips and vessel roster panel
- Optional AIS (Automatic Identification System) integration for live tracking
- Simulated GPS drift when no AIS endpoint is configured
- DPR-aware rendering (sharp on Retina / HiDPI displays)
- Fully configurable colors, fonts, bounds, and data

---

## Quick Start

### 1. Add the required DOM structure

```html
<div id="myFleet">
  <!-- Map canvas stack -->
  <div class="fleet-map" id="fleetMap">
    <canvas id="fleetCanvasDepth"></canvas>
    <canvas id="fleetCanvasCurrents"></canvas>
    <canvas id="fleetCanvasCoast"></canvas>
    <canvas id="fleetCanvasVessels"></canvas>
    <canvas id="fleetCanvasAtmo"></canvas>

    <!-- Hover tooltip -->
    <div class="vessel-info" id="vesselInfo">
      <h4 id="viName">—</h4>
      <p id="viDetail">—</p>
      <span class="vi-status" id="viStatus">—</span>
    </div>
  </div>

  <!-- Optional: vessel roster panel -->
  <div id="rosterList"></div>
</div>
```

### 2. Load fonts (optional but recommended)

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Josefin+Sans:wght@300;400;600&display=swap" rel="stylesheet">
```

### 3. Initialize the map

```html
<script type="module">
  import { FleetMap } from './fleet-map/index.js';

  var map = new FleetMap('#fleetMap', {
    title: 'D\'Ascola Fleet',
    vessels: [
      { name: 'São Jorge', lat: -24.2, lon: -44.8, heading: 135, speed: 7.2,
        type: 'Longliner', status: 'Fishing', catch: 'Swordfish' },
    ],
    ports: [
      { name: 'Santos', lat: -23.96, lon: -46.33, size: 'major' },
    ],
    routes: [
      { name: 'Santos to NYC', points: [[-23.96,-46.33],[-22,-42],[5,-40],[40.7,-74]] },
    ],
  });

  map.start();
</script>
```

### 4. Loading vessel data from vessels.json

```html
<script type="module">
  import { FleetMap } from './fleet-map/index.js';

  fetch('./fleet-map/vessels.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var map = new FleetMap('#fleetMap', {
        vessels: data.vessels,
        ports: data.ports,
        routes: data.routes,
      });
      map.start();
    });
</script>
```

---

## Configuration Reference

All options are defined in `config.js` with sensible defaults. Pass overrides as the second argument to `new FleetMap()`.

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `'Fleet Tracker'` | Company or map title |
| `subtitle` | `string` | `''` | Subtitle text |
| `bounds` | `object` | `{ latN: -15, latS: -35, lonW: -55, lonE: -25 }` | Geographic bounds of the map viewport |
| `particleCount` | `number` | `250` | Number of current particles (desktop) |
| `particleCountMobile` | `number` | `100` | Number of current particles (mobile) |
| `trailLength` | `number` | `20` | Length of particle trails in frames |
| `mobileBreakpoint` | `number` | `900` | Width in px below which mobile settings apply |
| `aisEndpoint` | `string\|null` | `null` | URL for AIS API polling. `null` = simulated drift |
| `aisRefreshMs` | `number` | `60000` | AIS poll interval in milliseconds |
| `colors` | `object` | *(see below)* | Color palette for all map elements |
| `fonts` | `object` | *(see below)* | Font families for labels and UI |
| `vessels` | `array` | `[]` | Array of vessel objects |
| `ports` | `array` | `[]` | Array of port objects |
| `routes` | `array` | `[]` | Array of route objects |
| `coastData` | `string\|array` | `'brazil'` | Built-in coast key or custom points array |
| `currentData` | `string\|array` | `'south-atlantic'` | Built-in current key or custom flow array |
| `onVesselHover` | `function\|null` | `null` | Callback: `function(vessel, screenPos)` |
| `onVesselClick` | `function\|null` | `null` | Callback: `function(vessel)` |
| `onAISUpdate` | `function\|null` | `null` | Callback: `function(vessels)` after AIS poll |

### Default Color Palette

```js
colors: {
  deep:      'rgba(4,10,16,1)',       // Ocean background
  ouro:      'rgba(201,168,76,1)',     // Gold accent (labels, compass)
  verde:     'rgba(0,104,71,1)',       // Green accent
  blade:     'rgba(139,175,196,1)',    // Light steel blue
  creme:     'rgba(240,235,224,1)',    // Off-white text
  land:      ['rgba(0,42,31,0.6)', 'rgba(0,59,46,0.5)', 'rgba(0,42,31,0.4)'],
  ocean:     ['rgba(13,34,64,0.35)', 'rgba(10,28,50,0.2)', 'rgba(4,10,16,0.05)'],
  fathom:    'rgba(27,58,92,0.12)',    // Fathom contour lines
  grid:      'rgba(201,168,76,0.04)', // Lat/lon grid
  coastGlow: 'rgba(201,168,76,0.08)', // Coastline glow
  coastLine: 'rgba(201,168,76,0.35)', // Coastline stroke
}
```

### Default Fonts

```js
fonts: {
  display: '"Playfair Display", Georgia, serif',  // Headings, cartouche
  sans:    '"Josefin Sans", sans-serif',           // Labels, stats
}
```

---

## Managing Vessels

### Editing vessels.json

The simplest way to manage the fleet is by editing `fleet-map/vessels.json`. This file contains:

- **vessels** — Array of vessel objects with position, heading, speed, type, status, and catch.
- **ports** — Array of port locations with name, coordinates, and size (`major` or `minor`).
- **routes** — Array of shipping routes, each defined as a sequence of `[lat, lon]` waypoints.

See the `_documentation` block at the top of vessels.json for field descriptions and step-by-step editing instructions.

### Vessel Object Format

```json
{
  "name": "São Jorge",
  "mmsi": null,
  "lat": -24.2,
  "lon": -44.8,
  "heading": 135,
  "speed": 7.2,
  "type": "Longliner",
  "status": "Fishing",
  "catch": "Swordfish"
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Display name |
| `mmsi` | No | MMSI number for AIS tracking (`null` if not tracked) |
| `lat` | Yes | Latitude (decimal degrees, negative = south) |
| `lon` | Yes | Longitude (decimal degrees, negative = west) |
| `heading` | Yes | Heading in degrees (0 = north, clockwise) |
| `speed` | Yes | Speed in knots (0 = stationary) |
| `type` | Yes | `'Longliner'`, `'Trawler'`, `'Gillnetter'`, `'Seiner'`, etc. |
| `status` | Yes | `'Fishing'`, `'In Transit'`, `'In Port'`, `'Returning'` |
| `catch` | Yes | Species name or `'—'` if none |

### Updating Programmatically

```js
// Replace the entire vessel list at runtime
map.updateVessels([
  { name: 'New Vessel', lat: -24.0, lon: -44.0, heading: 90, speed: 5,
    type: 'Trawler', status: 'Fishing', catch: 'Shrimp' },
]);
```

This rebuilds the roster panel and updates the stats display automatically.

### Connecting AIS for Live Tracking

1. Set the `aisEndpoint` config option to your AIS API URL.
2. Set `mmsi` on each vessel you want tracked.
3. The AIS client polls the endpoint on the configured interval and merges position updates by MMSI match.

```js
var map = new FleetMap('#fleetMap', {
  aisEndpoint: 'https://api.example.com/ais/positions',
  aisRefreshMs: 30000,  // Poll every 30 seconds
  vessels: [
    { name: 'São Jorge', mmsi: '710012345', lat: -24.2, lon: -44.8, ... },
  ],
});
```

Expected AIS API response format:

```json
[
  {
    "mmsi": "710012345",
    "lat": -24.21,
    "lon": -44.79,
    "heading": 137,
    "speed": 7.0,
    "status": "Fishing",
    "timestamp": "2025-01-15T14:30:00Z"
  }
]
```

### Future: Dashboard UI

The `updateVessels()` method is the integration point for a non-technical dashboard. A future admin panel could provide a form-based interface that reads/writes `vessels.json` or calls `updateVessels()` directly, removing the need to edit JSON by hand.

---

## Customizing Appearance

### Colors

Override any color in the palette by passing a `colors` object. Only the keys you specify will be overridden; the rest keep their defaults.

```js
var map = new FleetMap('#fleetMap', {
  colors: {
    ouro: 'rgba(255,200,50,1)',        // Brighter gold
    coastLine: 'rgba(255,200,50,0.4)', // Match the new gold
  },
  // ...
});
```

### Fonts

Load your preferred Google Fonts (or local fonts) and update the `fonts` config:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
```

```js
var map = new FleetMap('#fleetMap', {
  fonts: {
    display: '"Cormorant Garamond", Georgia, serif',
    sans:    '"Inter", sans-serif',
  },
});
```

### Swapping the Coastline for a Different Region

To display a different part of the world:

1. Create a new coast data file (e.g., `data/gulf-coast.js`) exporting an array of `[lat, lon]` coordinate pairs tracing the coastline.
2. Create a new current data file (e.g., `data/currents-gulf.js`) defining current flow paths for the region.
3. Update the `bounds` to frame the new region.
4. Update ports and routes to match the new geography.
5. Pass the custom data arrays via config:

```js
import { GULF_COAST } from './fleet-map/data/gulf-coast.js';
import { GULF_CURRENTS } from './fleet-map/data/currents-gulf.js';

var map = new FleetMap('#fleetMap', {
  bounds: { latN: 32, latS: 18, lonW: -100, lonE: -78 },
  coastData: GULF_COAST,
  currentData: GULF_CURRENTS,
  ports: [
    { name: 'Galveston', lat: 29.3, lon: -94.8, size: 'major' },
  ],
});
```

---

## File Structure

```
fleet-map/
  index.js              Main entry point — FleetMap class
  config.js             Default configuration and merge logic
  core.js               CanvasManager — 5-canvas stack, render loop, DPR
  projection.js         Equirectangular lat/lon to screen projection
  roster.js             Vessel roster side panel builder
  interaction.js        Mouse/touch hover, tooltip, click handling
  ais.js                AIS endpoint polling client
  vessels.json          Fleet data file (vessels, ports, routes)
  README.md             This documentation
  data/
    brazil-coast.js     Brazilian coastline coordinate array
    currents-sa.js      South Atlantic current flow definitions
  layers/
    depth.js            Layer 1: Bathymetry, fathom lines, grid
    currents.js         Layer 2: Particle ocean current animation
    coast.js            Layer 3: Coastline, land, ports, routes, labels
    vessels.js          Layer 4: Vessel triangles, trails, halos, compass
    atmosphere.js       Layer 5: Fog vignette overlay
```

---

## Architecture

### The 5-Canvas Layer System

Fleet Map uses five stacked `<canvas>` elements rather than a single canvas. Each layer is a separate canvas positioned absolutely on top of the previous one. This architecture exists for two reasons:

1. **Performance** — Static layers (depth, coast, atmosphere) only redraw when the window resizes or data changes. Only the two animated layers (currents, vessels) clear and redraw every frame at 60fps. This cuts per-frame draw work by roughly 60%.

2. **Visual compositing** — Each canvas composites naturally via CSS stacking. Transparency in upper layers reveals lower layers without needing manual compositing in JavaScript.

**Layer stack (bottom to top):**

| Layer | Canvas ID | Redraws | Purpose |
|---|---|---|---|
| 1. Depth | `fleetCanvasDepth` | On resize / data change | Ocean gradient, fathom contour lines, lat/lon grid |
| 2. Currents | `fleetCanvasCurrents` | Every frame (60fps) | Animated particle ocean currents |
| 3. Coast | `fleetCanvasCoast` | On resize / data change | Coastline, land fill, port markers, route lines, labels |
| 4. Vessels | `fleetCanvasVessels` | Every frame (60fps) | Vessel triangles, heading indicators, wake trails, ping rings |
| 5. Atmosphere | `fleetCanvasAtmo` | On resize / data change | Fog vignette and edge darkening |

The `CanvasManager` (core.js) owns all five canvases, handles DPR-aware resizing, and runs the `requestAnimationFrame` render loop. Each layer has a `dirty` flag — static layers only redraw when marked dirty.

---

## Adding a New Map Region

Step-by-step guide to adapting the map for a different part of the world.

### Step 1: Create coast data

Create a new file in `data/` that exports an array of `[lat, lon]` pairs tracing the coastline. Points should follow the coast in order (clockwise or counterclockwise). The coast layer draws a filled polygon from these points.

```js
// data/norway-coast.js
export var NORWAY_COAST = [
  [58.0, 6.5],
  [58.5, 6.0],
  // ... hundreds of points tracing the coastline
  [71.0, 28.0],
];
```

### Step 2: Create current data

Create a current flow file defining the major ocean currents in your region. Each current is an object with a `points` array (the flow path) and visual properties.

```js
// data/currents-nordic.js
export var NORDIC_CURRENTS = [
  { points: [[58,0],[62,3],[66,8],[70,15]], speed: 0.4, width: 60 },
  // ... more current paths
];
```

### Step 3: Update bounds

Set the geographic bounding box to frame your region:

```js
bounds: { latN: 72, latS: 56, lonW: -5, lonE: 35 }
```

### Step 4: Update ports and routes

Define the ports and shipping routes relevant to the new region:

```js
ports: [
  { name: 'Bergen', lat: 60.39, lon: 5.32, size: 'major' },
  { name: 'Tromsø', lat: 69.65, lon: 18.96, size: 'minor' },
],
routes: [
  { name: 'North Sea Run', points: [[60.39,5.32],[58,2],[55,-1]] },
],
```

### Step 5: Pass everything to FleetMap

```js
import { NORWAY_COAST } from './fleet-map/data/norway-coast.js';
import { NORDIC_CURRENTS } from './fleet-map/data/currents-nordic.js';

var map = new FleetMap('#fleetMap', {
  bounds: { latN: 72, latS: 56, lonW: -5, lonE: 35 },
  coastData: NORWAY_COAST,
  currentData: NORDIC_CURRENTS,
  ports: [ /* ... */ ],
  routes: [ /* ... */ ],
  vessels: [ /* ... */ ],
});
```

---

## API Reference

### `new FleetMap(selector, config)`

Creates a new fleet map instance.

- **selector** (`string | HTMLElement`) — CSS selector or DOM element for the `.fleet-map` container.
- **config** (`object`) — Configuration overrides. See Configuration Reference above.

### `map.start()`

Begin rendering and (if configured) AIS polling. Draws static layers once and starts the 60fps animation loop. Also attaches the window resize listener.

### `map.stop()`

Pause rendering and AIS polling. The map freezes in its current state. Call `start()` to resume.

### `map.destroy()`

Full teardown. Stops rendering, removes event listeners, releases all canvas contexts and DOM references. Call this when removing the map from the page to prevent memory leaks.

### `map.updateVessels(newVesselsArray)`

Replace the entire vessel list at runtime. Accepts an array of vessel objects (same format as the config `vessels` array). This method:

- Deep-copies the input array (does not mutate your original).
- Rebuilds the roster panel.
- Updates the fleet stats display.
- Fires the `onAISUpdate` callback if configured.

This is the primary integration point for dashboards, admin panels, or any external system that manages vessel data.

### `map.resize()`

Manually trigger a resize. Normally called automatically on `window.resize`. Recalculates canvas dimensions, respects device pixel ratio, and marks all layers for redraw.

---

## Browser Support

Fleet Map requires:

- **ES Modules** — `<script type="module">` support
- **Canvas 2D** — Standard `<canvas>` with 2D rendering context
- **requestAnimationFrame** — For the render loop
- **fetch API** — Only needed if using AIS live tracking

This covers all modern browsers: Chrome 61+, Firefox 60+, Safari 11+, Edge 79+. Internet Explorer is not supported.

For mobile devices, the map automatically reduces particle count below the `mobileBreakpoint` width for better performance.
