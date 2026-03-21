/**
 * Viking Village Fleet Map — LBI & NJ Coastline Data
 * ====================================================
 * Latitude/longitude points tracing the New Jersey coastline
 * from Sandy Hook south past Long Beach Island.
 *
 * Points are ordered north → south. The map renders land
 * to the LEFT (west) and ocean to the RIGHT (east).
 *
 * Focus area: northern Long Beach Island / Barnegat Inlet
 * with enough NJ mainland coast for context.
 */

export var LBI_COAST = [
  // Sandy Hook / northern NJ coast
  [40.47, -73.98],
  [40.45, -73.99],
  [40.42, -74.00],
  [40.39, -74.01],
  // Monmouth Beach → Long Branch
  [40.33, -73.98],
  [40.30, -73.98],
  [40.27, -73.99],
  // Asbury Park / Ocean Grove
  [40.22, -74.00],
  [40.19, -74.01],
  [40.16, -74.02],
  // Manasquan / Point Pleasant
  [40.10, -74.03],
  [40.06, -74.04],
  [40.03, -74.05],
  // Seaside Heights / Seaside Park
  [39.95, -74.07],
  [39.92, -74.08],
  [39.88, -74.09],
  // Island Beach State Park
  [39.84, -74.09],
  [39.82, -74.09],
  [39.80, -74.10],

  // === BARNEGAT INLET (gap) ===
  // North side of inlet (Island Beach)
  [39.775, -74.10],

  // South side of inlet — Barnegat Light / LBI north end
  [39.765, -74.106],
  [39.762, -74.107],

  // Long Beach Island — running south
  [39.75, -74.10],
  [39.73, -74.10],
  [39.71, -74.10],
  [39.68, -74.11],
  // Harvey Cedars
  [39.65, -74.12],
  [39.63, -74.13],
  // Surf City / Ship Bottom
  [39.60, -74.14],
  [39.58, -74.16],
  [39.56, -74.17],
  // Beach Haven
  [39.53, -74.19],
  [39.51, -74.21],
  // Holgate / south tip of LBI
  [39.49, -74.23],
  [39.48, -74.25],
  [39.47, -74.27],

  // Little Egg Inlet
  [39.46, -74.28],
  [39.45, -74.30],

  // Atlantic City area
  [39.42, -74.33],
  [39.38, -74.38],
  [39.35, -74.42],
  [39.33, -74.43],

  // Continue south past Ventnor / Margate
  [39.30, -74.45],
  [39.27, -74.48],

  // Ocean City
  [39.24, -74.52],
  [39.20, -74.56],

  // Cape May area
  [39.10, -74.78],
  [38.95, -74.90],
  [38.93, -74.92],
];

/**
 * NJ mainland / bay shore coast (west side of Barnegat Bay)
 * For rendering the mainland behind the barrier islands.
 */
export var NJ_MAINLAND = [
  // Toms River / Bayville area
  [39.96, -74.15],
  [39.93, -74.16],
  [39.90, -74.18],
  [39.87, -74.20],
  // Barnegat / Manahawkin
  [39.82, -74.22],
  [39.78, -74.22],
  [39.75, -74.23],
  [39.72, -74.24],
  // Stafford / Tuckerton
  [39.68, -74.26],
  [39.63, -74.30],
  [39.58, -74.32],
  [39.54, -74.34],
  [39.50, -74.36],
  // Bass River / New Gretna
  [39.47, -74.40],
  [39.43, -74.44],
  [39.40, -74.48],
];
