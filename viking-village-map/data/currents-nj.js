/**
 * Viking Village Fleet Map — NJ Atlantic Current Data
 * =====================================================
 * Ocean current definitions for the waters off New Jersey.
 *
 * Each current has:
 *   - name: display name
 *   - points: [[lat, lon], ...] waypoints defining the flow path
 *   - strength: particle velocity multiplier (1.0 = moderate)
 *   - width: influence width in degrees (particles within this
 *            distance from the path are pushed along it)
 *
 * Major currents in this area:
 *   1. Gulf Stream warm edge — flows NE, passes ~100mi offshore
 *   2. Cold Wall / Labrador Current influence — flows SW nearshore
 *   3. Shelf currents — variable, generally SW along the coast
 *   4. Barnegat Ridge upwelling — localized circular flow
 */

export var NJ_CURRENTS = [
  // Gulf Stream — warm current flowing northeast, far offshore
  // Passes roughly 80-120 miles off the NJ coast
  {
    name: 'Gulf Stream',
    points: [
      [38.8, -72.8],
      [39.0, -72.5],
      [39.3, -72.2],
      [39.6, -71.9],
      [39.9, -71.7],
      [40.2, -71.5],
      [40.5, -71.3],
      [40.8, -71.1],
    ],
    strength: 1.8,
    width: 1.5,
  },

  // Cold shelf current — flows southwest along the inner shelf
  // This is the dominant nearshore flow, Labrador Current origin
  {
    name: 'Shelf Current',
    points: [
      [40.7, -73.6],
      [40.5, -73.7],
      [40.3, -73.8],
      [40.0, -73.9],
      [39.8, -74.0],
      [39.5, -74.1],
      [39.2, -74.3],
      [39.0, -74.4],
      [38.8, -74.5],
    ],
    strength: 0.8,
    width: 0.8,
  },

  // Mid-shelf flow — between the Gulf Stream and shelf current
  // Meanders and eddies form here
  {
    name: 'Mid-Shelf Eddy',
    points: [
      [40.6, -73.0],
      [40.3, -73.1],
      [40.0, -73.0],
      [39.7, -72.9],
      [39.4, -72.8],
      [39.1, -73.0],
      [38.9, -73.2],
    ],
    strength: 0.6,
    width: 1.0,
  },

  // Hudson Canyon upwelling — nutrient-rich water rises
  // along the canyon walls, creating circular flow
  {
    name: 'Hudson Canyon Upwelling',
    points: [
      [39.8, -72.5],
      [39.9, -72.3],
      [40.0, -72.2],
      [40.0, -72.0],
      [39.9, -71.9],
      [39.7, -72.0],
      [39.6, -72.2],
      [39.7, -72.4],
      [39.8, -72.5],
    ],
    strength: 0.5,
    width: 0.6,
  },

  // Barnegat Ridge tidal flow — localized current near the ridge
  {
    name: 'Barnegat Ridge Flow',
    points: [
      [39.9, -73.8],
      [39.8, -73.7],
      [39.7, -73.8],
      [39.6, -73.9],
      [39.7, -74.0],
      [39.8, -73.9],
      [39.9, -73.8],
    ],
    strength: 0.4,
    width: 0.4,
  },
];
