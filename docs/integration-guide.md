# Fleet Map — Integration Guide

This guide walks through adding Fleet Map to your website, customizing it for your fleet, and connecting it to live AIS data.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [HTML Structure](#html-structure)
3. [Configuration](#configuration)
4. [Adding Your Vessels](#adding-your-vessels)
5. [Customizing the Map Region](#customizing-the-map-region)
6. [Custom Color Themes](#custom-color-themes)
7. [AIS Live Tracking](#ais-live-tracking)
8. [Dashboard Integration](#dashboard-integration)
9. [Framed Display / Kiosk Mode](#framed-display--kiosk-mode)
10. [Troubleshooting](#troubleshooting)

---

## Basic Setup

Fleet Map requires no build step. Just include the files:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 1. Google Fonts (required) -->
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Josefin+Sans:wght@200;300;400&display=swap" rel="stylesheet">

  <!-- 2. Fleet Map stylesheet -->
  <link rel="stylesheet" href="path/to/fleet-map/src/styles.css">
</head>
<body>

  <!-- 3. Map container with 5 canvas layers -->
  <div class="fleet-map" id="fleetMap">
    <canvas id="fleetCanvasDepth"></canvas>
    <canvas id="fleetCanvasCurrents"></canvas>
    <canvas id="fleetCanvasCoast"></canvas>
    <canvas id="fleetCanvasVessels"></canvas>
    <canvas id="fleetCanvasAtmo"></canvas>

    <!-- Optional: tooltip (appears on vessel hover) -->
    <div class="vessel-info" id="vesselInfo">
      <h4 id="viName"></h4>
      <p id="viDetail"></p>
      <span class="vi-status" id="viStatus"></span>
    </div>
  </div>

  <!-- 4. Initialize with ES module -->
  <script type="module">
    import { FleetMap } from 'path/to/fleet-map/src/index.js';

    const map = new FleetMap('#fleetMap', {
      title: 'My Fleet',
      bounds: { latN: 41, latS: 39, lonW: -75, lonE: -71 },
      vessels: [...],
      ports: [...],
    });

    map.start();
  </script>

</body>
</html>
```

---

## HTML Structure

### Required Elements

The map needs a container div with 5 canvas children. The IDs **must** match exactly:

| ID | Layer | Purpose |
|----|-------|---------|
| `fleetCanvasDepth` | 1 (bottom) | Ocean background, grid, fathom lines |
| `fleetCanvasCurrents` | 2 | Animated particle currents |
| `fleetCanvasCoast` | 3 | Coastline, land, ports, routes, labels |
| `fleetCanvasVessels` | 4 | Vessel triangles, compass rose |
| `fleetCanvasAtmo` | 5 (top) | Fog vignette overlay |

### Optional Elements

Add these inside or near the map container:

```html
<!-- Vessel roster panel (sidebar) -->
<aside class="fleet-roster" id="fleetRoster">
  <div class="fleet-roster-title">FLEET ROSTER</div>
  <div id="rosterList"></div>
</aside>

<!-- Tooltip (inside .fleet-map) -->
<div class="vessel-info" id="vesselInfo">
  <h4 id="viName"></h4>
  <p id="viDetail"></p>
  <span class="vi-status" id="viStatus"></span>
</div>

<!-- Stats bar -->
<div class="fleet-stats">
  <div class="fleet-stat">
    <div class="fleet-stat-n fleet-stat-0">0</div>
    <div class="fleet-stat-l">Vessels</div>
  </div>
  <div class="fleet-stat">
    <div class="fleet-stat-n fleet-stat-1">0</div>
    <div class="fleet-stat-l">Fishing</div>
  </div>
</div>
```

---

## Configuration

Pass a config object as the second argument to `new FleetMap()`. Any option you omit uses the default.

### Geographic Bounds

```js
bounds: {
  latN: 41.0,   // Northern latitude
  latS: 39.0,   // Southern latitude
  lonW: -75.0,  // Western longitude (negative = west)
  lonE: -71.0,  // Eastern longitude
}
```

The map uses equirectangular projection. The bounds define what geographic area is visible.

### Colors

All colors use CSS `rgba()` strings so alpha can be manipulated programmatically:

```js
colors: {
  deep:      'rgba(15,27,61,1)',     // Background
  ouro:      'rgba(196,30,58,1)',    // Accent (fishing vessels)
  verde:     'rgba(58,107,53,1)',    // Land/ports
  blade:     'rgba(59,169,156,1)',   // Currents/transit
  creme:     'rgba(212,184,150,1)',  // Light text
}
```

---

## Adding Your Vessels

### Static Data

Pass an array of vessel objects in the config:

```js
vessels: [
  {
    name: 'F/V My Boat',
    mmsi: null,          // or AIS MMSI string
    lat: 40.0,
    lon: -73.5,
    heading: 135,        // degrees, 0=north
    speed: 5.5,          // knots
    type: 'Trawler',
    status: 'Fishing',   // determines color
    catch: 'Cod',
  },
]
```

### Status Values

| Status | Color | Description |
|--------|-------|-------------|
| `Fishing` | Accent (red/gold) | Actively fishing, shows halo |
| `Scalloping` | Accent | Same as Fishing (scallop-specific) |
| `In Transit` | Blade (turquoise/blue) | Moving between grounds |
| `Returning` | Blade | Heading back to port |
| `In Port` | Verde (green) | Docked |

### Dynamic Updates

Update vessel positions at any time:

```js
// Replace all vessels
map.updateVessels(newVesselArray);
```

This automatically updates the map, roster panel, and stats.

---

## Customizing the Map Region

To adapt the map for a different coastline:

### 1. Create Coastline Data

Export an array of `[lat, lon]` points tracing your coastline from north to south:

```js
// my-coast.js
export var MY_COAST = [
  [42.0, -70.5],
  [41.8, -70.3],
  [41.5, -70.1],
  // ... more points
];
```

### 2. Create Current Data

Define ocean currents as flow paths with strength and width:

```js
// my-currents.js
export var MY_CURRENTS = [
  {
    name: 'Gulf Stream',
    points: [[38.0, -72.0], [39.0, -71.5], [40.0, -71.0]],
    strength: 1.5,  // Particle speed multiplier
    width: 1.0,     // Influence width in degrees
  },
];
```

### 3. Update Layer Files

The coast and depth layers contain region-specific labels and shelf data. Copy the layer files from a demo and modify:

- **coast.js** — Update land labels, fishing ground names, inlet positions
- **depth.js** — Update continental shelf edge coordinates and fathom labels
- **vessels.js** — Customize the compass rose (or use the default)

### 4. Configure Bounds

```js
bounds: { latN: 43, latS: 40, lonW: -71, lonE: -68 }
```

---

## Custom Color Themes

### CSS Custom Properties

The stylesheet uses CSS custom properties. Override them in your own stylesheet:

```css
:root {
  --fm-accent:       #C41E3A;  /* Barnegat Lighthouse red */
  --fm-deep:         #0F1B3D;  /* Night indigo */
  --fm-land:         #3A6B35;  /* Pine green */
  --fm-text:         #D4B896;  /* Sand */
  --fm-text-muted:   #3BA99C;  /* Turquoise */
  --fm-font-display: 'Playfair Display', Georgia, serif;
  --fm-font-sans:    'Josefin Sans', sans-serif;
}
```

### Canvas Colors

Canvas drawing uses the `config.colors` object (not CSS properties). Pass colors in your FleetMap config to match your CSS:

```js
colors: {
  deep:   'rgba(15,27,61,1)',
  ouro:   'rgba(196,30,58,1)',    // matches --fm-accent
  verde:  'rgba(58,107,53,1)',    // matches --fm-land
  blade:  'rgba(59,169,156,1)',   // matches --fm-text-muted
  creme:  'rgba(212,184,150,1)',  // matches --fm-text
}
```

---

## AIS Live Tracking

### Setup

```js
const map = new FleetMap('#fleetMap', {
  aisEndpoint: 'https://your-api.com/api/vessels',
  aisRefreshMs: 30000, // Poll every 30 seconds
});
```

### Expected API Response

Your endpoint should return a JSON array:

```json
[
  {
    "mmsi": "338123456",
    "lat": 39.85,
    "lon": -73.65,
    "heading": 135,
    "speed": 4.2,
    "name": "F/V Karen L",
    "type": "Scalloper",
    "status": "Fishing",
    "catch": "Sea Scallops"
  }
]
```

### AIS Data Sources

- **MarineTraffic API** — Commercial vessel tracking
- **AISHub** — Community AIS sharing
- **VesselFinder API** — Commercial tracking
- **US Coast Guard NAIS** — Government AIS data
- **Custom receiver** — Build your own with an AIS radio + decoder

---

## Dashboard Integration

Fleet Map is designed to be embedded in management dashboards.

### React / Vue / Svelte

```jsx
// React example
import { useEffect, useRef } from 'react';

function FleetMapWidget({ vessels }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    import('/path/to/fleet-map/src/index.js').then(({ FleetMap }) => {
      mapRef.current = new FleetMap(ref.current, {
        vessels,
        // ... config
      });
      mapRef.current.start();
    });
    return () => mapRef.current?.destroy();
  }, []);

  useEffect(() => {
    mapRef.current?.updateVessels(vessels);
  }, [vessels]);

  return (
    <div ref={ref} className="fleet-map">
      <canvas id="fleetCanvasDepth" />
      <canvas id="fleetCanvasCurrents" />
      <canvas id="fleetCanvasCoast" />
      <canvas id="fleetCanvasVessels" />
      <canvas id="fleetCanvasAtmo" />
    </div>
  );
}
```

### Event Callbacks

```js
const map = new FleetMap('#fleetMap', {
  onVesselHover: (vessel, screenPos) => {
    console.log('Hovering:', vessel.name, screenPos);
  },
  onVesselClick: (vessel) => {
    window.location.href = `/vessels/${vessel.mmsi}`;
  },
  onAISUpdate: (vessels) => {
    updateDashboardStats(vessels);
  },
});
```

---

## Framed Display / Kiosk Mode

Fleet Map is designed to work as a framed screen product — wall art for beach homes, dock offices, or restaurant displays.

### Auto-Start

The map auto-starts when `map.start()` is called. For a standalone display, just open the HTML file.

### Full-Screen CSS

```css
body { margin: 0; overflow: hidden; background: #0F1B3D; }
.fleet-map {
  width: 100vw;
  height: 100vh;
  max-height: none;
  aspect-ratio: auto;
}
```

### Tips for Display

- Use a Raspberry Pi or small PC connected to a TV/monitor
- Set the browser to full-screen kiosk mode (`chromium --kiosk`)
- The subtle animations (drifting vessels, flowing currents, pulsing ports, rotating lighthouse beam) create a living piece of art
- No user interaction required — everything animates automatically

---

## Troubleshooting

### Map is blank

- Check browser console for errors
- Ensure all 5 canvas IDs are present and spelled correctly
- Verify the ES module import path is correct
- Make sure the page is served over HTTP (not `file://`) — ES modules require a server

### Vessels don't appear

- Verify vessel lat/lon values are within the `bounds`
- Check that `status` matches one of: `'Fishing'`, `'Scalloping'`, `'In Transit'`, `'In Port'`, `'Returning'`
- Ensure `heading` is in degrees (0-360)

### Coastline doesn't show

- Verify `coastData` is set to a valid key (`'brazil'`, `'lbi'`) or a custom array
- Check that coast points are within the map `bounds`

### Poor performance

- Reduce `particleCount` (try 100-150)
- On mobile, the map automatically uses `particleCountMobile`
- Ensure no other heavy animations run on the same page
