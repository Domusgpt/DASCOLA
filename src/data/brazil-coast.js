/**
 * Fleet Map — Brazil Coastline Data
 * ===================================
 * 65+ coordinate pairs tracing Brazil's Atlantic coast
 * from the northeastern tip (~5°S) to the southern border (~33°S).
 *
 * Format: [latitude, longitude] — decimal degrees
 *   Negative latitude = south of equator
 *   Negative longitude = west of prime meridian
 *
 * These points are connected with quadraticCurveTo() in the coast
 * renderer for smooth curves. Points are denser around major
 * geographic features (bays, capes, peninsulas).
 *
 * To add a new coastline for your region:
 *   1. Copy this file and rename (e.g., gulf-coast.js)
 *   2. Replace coordinates with your coastline points
 *   3. Pass to FleetMap config: coastData: myCoastPoints
 *   4. Points should flow continuously (no gaps)
 *   5. More points = smoother curves = slightly more rendering work
 *
 * Sources: Simplified from NOAA/IBGE coastline data
 */
export var BRAZIL_COAST = [
  // === Natal / Rio Grande do Norte ===
  [-5.47, -35.19],
  [-5.78, -35.21],
  [-6.10, -35.07],
  [-6.50, -35.01],
  [-6.97, -34.83],

  // === João Pessoa / Paraíba ===
  [-7.12, -34.83],
  [-7.46, -34.86],

  // === Recife / Pernambuco ===
  [-7.85, -34.85],
  [-8.05, -34.87],
  [-8.30, -34.94],
  [-8.54, -35.00],
  [-8.76, -35.10],

  // === Maceió / Alagoas ===
  [-9.21, -35.38],
  [-9.67, -35.72],

  // === Aracaju / Sergipe ===
  [-10.20, -36.20],
  [-10.91, -37.05],
  [-11.30, -37.32],

  // === Northern Bahia coast ===
  [-11.68, -37.44],
  [-12.10, -37.62],
  [-12.46, -37.95],
  [-12.70, -38.32],

  // === Salvador / Baía de Todos os Santos (extra density) ===
  [-12.82, -38.48],
  [-12.90, -38.51],
  [-12.97, -38.52],
  [-13.00, -38.53],
  [-13.01, -38.50],
  [-12.98, -38.45],
  [-12.95, -38.42],
  [-13.00, -38.40],
  [-13.10, -38.43],
  [-13.25, -38.68],

  // === Southern Bahia ===
  [-13.76, -38.92],
  [-14.30, -39.02],
  [-14.80, -39.07],
  [-15.18, -39.02],
  [-15.65, -38.95],
  [-16.10, -38.98],
  [-16.45, -39.07],
  [-17.00, -39.17],
  [-17.35, -39.23],
  [-17.73, -39.25],
  [-18.20, -39.50],
  [-18.60, -39.68],

  // === Espírito Santo / Vitória ===
  [-19.18, -39.75],
  [-19.67, -40.00],
  [-20.10, -40.18],
  [-20.32, -40.29],
  [-20.52, -40.22],

  // === Northern Rio de Janeiro state ===
  [-21.05, -40.62],
  [-21.50, -41.00],
  [-22.02, -41.05],
  [-22.38, -41.40],

  // === Cabo Frio ===
  [-22.88, -42.03],

  // === Rio de Janeiro / Guanabara Bay (extra density) ===
  [-22.93, -42.50],
  [-22.95, -43.05],
  [-22.92, -43.15],
  [-22.88, -43.17],
  [-22.82, -43.16],
  [-22.82, -43.20],
  [-22.87, -43.25],
  [-22.95, -43.30],
  [-23.00, -43.38],
  [-23.02, -43.55],
  [-23.05, -43.72],

  // === Santos / São Paulo coast (extra density for indented coast) ===
  [-23.30, -44.10],
  [-23.45, -44.55],
  [-23.55, -44.80],
  [-23.72, -45.08],
  [-23.80, -45.20],
  [-23.85, -45.35],
  [-23.95, -45.50],
  [-23.98, -46.08],
  [-24.00, -46.32],
  [-24.18, -46.58],
  [-24.32, -46.82],
  [-24.50, -47.05],

  // === Paranaguá / Paraná ===
  [-25.05, -47.80],
  [-25.35, -48.10],
  [-25.52, -48.50],
  [-25.87, -48.58],

  // === Santa Catarina / Florianópolis (extra density for island) ===
  [-26.30, -48.62],
  [-26.68, -48.63],
  [-27.15, -48.52],
  [-27.38, -48.47],
  [-27.50, -48.42],
  [-27.60, -48.45],
  [-27.65, -48.50],
  [-27.58, -48.55],
  [-27.70, -48.58],
  [-28.05, -48.65],
  [-28.50, -48.80],

  // === Rio Grande do Sul ===
  [-28.85, -49.22],
  [-29.20, -49.55],
  [-29.70, -49.85],
  [-30.05, -50.12],
  [-30.40, -50.25],
  [-31.00, -50.75],
  [-31.50, -51.10],
  [-32.05, -51.95],
  [-32.35, -52.10],
  [-33.00, -52.55],
  [-33.45, -52.95],
  [-33.75, -53.37],
];
