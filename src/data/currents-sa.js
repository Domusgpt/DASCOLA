/**
 * Fleet Map — South Atlantic Current Data
 * =========================================
 * Defines ocean current flow paths for particle animation.
 *
 * Each current is an object with:
 *   name:     string   — Current name (for documentation)
 *   points:   array    — [[lat,lon], ...] waypoints defining flow direction
 *   strength: number   — Flow speed multiplier (0.5 = gentle, 2.0 = strong)
 *   width:    number   — Influence zone in degrees (how far from path particles are affected)
 *
 * The particle system uses these to calculate velocity vectors.
 * Particles near a current's path are pushed along its direction.
 *
 * To define currents for your region:
 *   1. Copy this file
 *   2. Define your ocean currents as waypoint paths
 *   3. Pass to FleetMap config: currentData: myCurrents
 *
 * Major South Atlantic currents included:
 *   - Brazil Current (warm, southward along coast)
 *   - South Atlantic Gyre (clockwise circulation)
 *   - Falklands/Malvinas Current (cold, northward)
 */
export var SA_CURRENTS = [
  {
    name: 'Brazil Current',
    points: [
      [-8.0, -34.5],
      [-10.0, -36.0],
      [-13.0, -38.5],
      [-15.0, -39.0],
      [-18.0, -39.5],
      [-20.5, -40.0],
      [-23.0, -42.0],
      [-24.0, -44.5],
      [-25.5, -47.0],
      [-28.0, -48.5],
      [-30.0, -49.5],
      [-33.0, -51.5],
      [-36.0, -53.0],
    ],
    strength: 1.2,
    width: 3
  },
  {
    name: 'South Atlantic Gyre',
    points: [
      [-10.0, -30.0],
      [-15.0, -25.0],
      [-20.0, -18.0],
      [-25.0, -10.0],
      [-30.0, -5.0],
      [-35.0, 0.0],
      [-38.0, 5.0],
      [-40.0, -5.0],
      [-38.0, -15.0],
      [-36.0, -25.0],
      [-34.0, -35.0],
      [-30.0, -42.0],
      [-25.0, -43.0],
      [-20.0, -38.0],
      [-15.0, -34.0],
      [-10.0, -30.0],
    ],
    strength: 0.8,
    width: 5
  },
  {
    name: 'Falklands Current',
    points: [
      [-55.0, -65.0],
      [-52.0, -62.0],
      [-48.0, -59.0],
      [-45.0, -57.0],
      [-42.0, -55.0],
      [-39.0, -53.5],
      [-36.0, -52.5],
      [-34.0, -51.5],
    ],
    strength: 1.0,
    width: 2
  }
];
