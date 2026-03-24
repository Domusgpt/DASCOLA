# Viking Village Fleet Map

Interactive fleet tracking map for **Viking Village**, the historic commercial fishing dock at Barnegat Light, Long Beach Island, New Jersey.

## Demo

Open `viking-village-demo.html` in a browser to see the full working map with 15 real Viking Village vessels.

## Features

- **15 real vessels** from Viking Village: scallopers, longliners, gillnetters, and draggers
- **Barnegat Lighthouse compass rose** with animated red/white banded tower and sweeping light beam
- **NJ coastline** from Sandy Hook to Cape May, with Long Beach Island and barrier islands
- **Atlantic fishing grounds** labeled: Barnegat Ridge, North/South Ridge, Harvey Cedars Lump, Hudson Canyon, Klondike, 17 Fathom Hole
- **Ocean currents**: Gulf Stream, shelf currents, Hudson Canyon upwelling, Barnegat Ridge tidal flow
- **Shipping routes**: Hudson Canyon Run and Fulton Fish Market (NYC) supply routes
- **6 ports**: Viking Village (home), Barnegat Light, Point Pleasant, Atlantic City, Sandy Hook, Cape May
- **Responsive**: works on desktop and mobile
- **Home decor ready**: designed to look beautiful as a framed screen piece for LBI beach homes

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Accent (Lighthouse Red) | Barnegat Lighthouse bands | `#C41E3A` |
| Deep (Night Indigo) | Ocean background | `#0F1B3D` |
| Land (Pine Barrens) | NJ forests & parks | `#3A6B35` |
| Text (Beach Sand) | Labels & numbers | `#D4B896` |
| Ocean (Turquoise) | Currents & secondary | `#3BA99C` |

## Vessels

All vessel names are real boats from Viking Village dock:

| Vessel | Type | Status |
|--------|------|--------|
| F/V Karen L | Scalloper | Scalloping |
| F/V Lucky Thirteen | Scalloper | Scalloping |
| F/V C.B. Keane | Scalloper | In Transit |
| F/V Madelyn | Scalloper | Scalloping |
| F/V Ms Manya | Scalloper | Scalloping |
| F/V Elizabeth | Scalloper | In Port |
| F/V F. Nelson Blount | Scalloper | Scalloping |
| F/V Relentless | Scalloper/Dragger | Fishing |
| F/V Alexandria Dawn | Longliner | Fishing (Tuna) |
| F/V Bear | Scalloper/Longliner | Returning |
| F/V Provider III | Scalloper | Scalloping |
| F/V Julianne | Scalloper | In Port |
| F/V Eliza | Gillnetter | Fishing (Dogfish) |
| F/V Dana Christine II | Longliner | Fishing (Tilefish) |
| F/V Lindsay L | Scalloper | Returning |

## File Structure

```
viking-village-map/
├── index.js          — FleetMap class (start/stop/destroy/updateVessels)
├── config.js         — Barnegat Lighthouse color defaults & bounds
├── core.js           — Canvas manager (5 layers, DPR, render loop)
├── projection.js     — Lat/lon ↔ screen coordinate conversion
├── layers/
│   ├── depth.js      — NJ continental shelf contours, grid
│   ├── currents.js   — 250-particle Gulf Stream & shelf currents
│   ├── coast.js      — NJ coastline, LBI, inlet, fishing ground labels
│   ├── vessels.js    — Vessel triangles + Barnegat Lighthouse compass
│   └── atmosphere.js — Fog vignette
├── data/
│   ├── lbi-coast.js      — 60-point NJ/LBI coastline dataset
│   └── currents-nj.js    — NJ Atlantic current definitions
├── roster.js         — Side panel vessel list
├── interaction.js    — Hover/click detection, tooltip
├── ais.js            — AIS endpoint polling client
├── styles.css        — Lighthouse-themed CSS
├── vessels.json      — Editable vessel, port, and route data
└── README.md         — This file
```

## Customization

### Change colors
Edit the `:root` custom properties in `styles.css` and the `colors` object in `config.js`.

### Add/remove vessels
Edit `vessels.json` or pass a different `vessels` array when instantiating `FleetMap`.

### AIS live tracking
Set `aisEndpoint: 'https://your-ais-api.com/vessels'` in the config to enable real-time vessel position updates.

## Sources

- [Viking Village, Inc.](https://www.vikingvillage.net/) — vessel names and fleet composition
- [National Fisherman](https://www.nationalfisherman.com/) — fleet history and heritage
- [Barnegat Lighthouse - Wikipedia](https://en.wikipedia.org/wiki/Barnegat_Lighthouse) — lighthouse specs
- [NJ DEP Prime Fishing Grounds](https://gisdata-njdep.opendata.arcgis.com/) — fishing area coordinates
