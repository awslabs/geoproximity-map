// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import maplibregl, { LngLat } from "maplibre-gl";

import { getColorAtIndex } from "./getGeoproximityMapColors";

export const GEOPROXIMITY_CONSTANTS = {
  MAX_LONGITUDE: 180,
  MIN_LONGITUDE: -180,
  MAX_LATITUDE: 90,
  MIN_LATITUDE: -90,
  MAX_BIAS: 99,
  GRID_SQUARE_LENGTH: 0.3, // Size of each grid square in degrees latitude/longitude
};

const RADIUS = 6371; // Approximate radius of the earth in kilometers
const MIDPOINT_ACCURACY_CONST = 10; // Impacts how accurately the midpoint between two regions is detected; defines how many points to test in each grid square when searching for the transition point
const MAXIMUM_SHIFT = 10; // When searching for the midpoint between a left and right point, the left point is separated from the right by a certain number of grid spaces. This defines the maximum shift to be allowed
const HIGH_LATITUDE_THRESHOLD = 75; // As you approach either pole, the distance per degree starts getting distorted. This threshold tells us to adjust and use different constants at points beyond this value
export const ENDPOINT_RADIUS = 9; // Defines the radius in pixels that should be used for plotting the endpoints
export const ENDPOINT_OPACITY = 1; // Define the opacity that should be used for plotting the endpoints
const MAX_LATITUDE_ADJUSTMENT = 89.999; // MapLibre has issues when multiple points are plotted at latitude 90. For the sake of mapping, these values are moved down slightly to fix the graphical errors
const BASE_OVERREACH_FACTOR = 1.4; // Default value of overreach factor
const HIGH_LATITUDE_OVERREACH_FACTOR = 1.6; // Adjusted value of overreach factor for higher latitudes

/**
 * Check if input is valid and indicate whether or not to draw a geoproximity overlay
 */
export const validateInput = (
  lats: number[],
  lons: number[],
  biases: number[],
) => {
  let valid = true;
  const uniqueMap = new Map();

  if (lats === undefined || lons === undefined || biases === undefined) {
    valid = false;
    return valid;
  }

  const invalidLat = lats.find(
    (lat) => Math.abs(lat) > GEOPROXIMITY_CONSTANTS.MAX_LATITUDE || isNaN(lat),
  );

  const invalidLon = lons.find(
    (lon) => Math.abs(lon) > GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE || isNaN(lon),
  );

  const invalidBias = biases.find(
    (bias) => Math.abs(bias) > GEOPROXIMITY_CONSTANTS.MAX_BIAS || isNaN(bias),
  );

  if (
    invalidLat !== undefined ||
    invalidLon !== undefined ||
    invalidBias !== undefined
  ) {
    valid = false;
    return valid;
  }

  if (lats.length !== lons.length || lats.length !== biases.length) {
    valid = false;
  } else {
    for (let i = 0; i < lats.length; i++) {
      if (
        uniqueMap.has(
          Number(lons[i]).toFixed(2) + ", " + Number(lats[i]).toFixed(2),
        )
      ) {
        valid = false;
        break;
      } else {
        uniqueMap.set(
          Number(lons[i]).toFixed(2) + ", " + Number(lats[i]).toFixed(2),
          true,
        );
      }
    }
  }
  return valid;
};

/**
 * Generates an array of geojson points for the latitudes, longitudes, and biases
 */
/* eslint-disable max-params */
export const generateGeoJsonEndpoints = (
  lats: number[],
  lons: number[],
  biases: number[],
  endpointLabels: number[],
  geoProxPolygons: Map<string, any>,
  borders: Map<string, any>,
  layerIds: Map<string, boolean>,
) => {
  const output = [];
  for (let i = 0; i < lats.length; i++) {
    const endpointLabel = endpointLabels[i]; // Label that gets attached to the endpoint on the map
    const color = getColorAtIndex(endpointLabel - 1); // Get the color at endpointLabel - 1 since labels start at 1 but array starts at 0
    const endpointId = endpointLabel.toString(); // Unique ID that gets used to reference this endpoint and region upon creation
    geoProxPolygons.set(endpointId, generateColorFeatureCollection());
    const multipolygon = {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: [],
      },
      id: 1, // Only one multipolygon per color, so id should always be 1
    };
    geoProxPolygons.get(endpointId).data.features.push(multipolygon);
    borders.set(endpointId, generateColorFeatureCollection());
    layerIds.set(endpointId, true);
    const entry = {
      id: endpointId,
      label: endpointLabel,
      type: "circle",
      source: {
        type: "geojson",
        data: {
          type: "Feature",
          id: "Endpoint",
          geometry: {
            type: "Point",
            coordinates: [lons[i], lats[i]],
          },
          color: color,
          modifier: computeBiasConstant(biases[i]),
        },
      },
      paint: {
        "circle-radius": ENDPOINT_RADIUS,
        "circle-opacity": ENDPOINT_OPACITY,
        "circle-color": color,
      },
    };
    output.push(entry);
  }
  return output;
};
/* eslint-disable max-params */

/**
 * Generates a new feature collection for polygons and border lines of a certain color
 */
const generateColorFeatureCollection = () => {
  const output = {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  };
  return output;
};

/**
 * Generates a geojson quadrilateral from the four coordinates specified
 * @param points is an object containing the four vertices of the polygon to be generated
 * @param endpointId is a string that contains the unique id of the polygon to be generated
 * @param geoProxPolygons is a map with keys for each colored region on the map; the value is a geojson FeatureCollection where the polygon data is stored
 */
export const generateGeoJsonPolygon = (
  points: any,
  endpointId: string,
  geoProxPolygons: Map<string, any>,
) => {
  const entry = [
    [
      [points.upperLeft.lng, points.upperLeft.lat],
      [points.upperRight.lng, points.upperRight.lat],
      [points.lowerRight.lng, points.lowerRight.lat],
      [points.lowerLeft.lng, points.lowerLeft.lat],
    ],
  ];
  if (endpointId) {
    geoProxPolygons
      .get(endpointId)
      .data.features[0].geometry.coordinates.push(entry);
  }
};

/**
 * Generates a new border line segment from the two coordinates specified
 * @param points is a map containing the two points that make up the line segment that is going to be drawn. The upperPoint property should be set to the point with the greater latitude. If the latitudes are equal, they can be set arbitrarily
 * @param endpointIds is an array containing the endpointIds that correspond to the regions this line segment is a border of. The ids can be passed in any order, as the points are added to every region in the list of ids
 * @param borders is a map with keys for each colored region on the map; the value is a geojson FeatureCollection where the line segment data for that region is stored
 */
export const generateGeoJsonBorder = (
  points: any,
  endpointIds: string[],
  borders: Map<string, any>,
) => {
  const newBorder = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [points.upperPoint.lng, points.upperPoint.lat],
        [points.lowerPoint.lng, points.lowerPoint.lat],
      ],
    },
  };
  for (const endpointId of endpointIds) {
    borders.get(endpointId).data.features.push(newBorder);
  }
};

/**
 * Divide map up into grid of squares of size length x length, the centers of which are used as test points
 */
export const generateTestPointGrid = () => {
  let i;
  let j;
  const testPoints: any[] = [];
  for (
    i =
      GEOPROXIMITY_CONSTANTS.MIN_LATITUDE +
      GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    i <=
    GEOPROXIMITY_CONSTANTS.MAX_LATITUDE -
      GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    i += GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH
  ) {
    const latitudes = [];
    for (
      j =
        GEOPROXIMITY_CONSTANTS.MIN_LONGITUDE +
        GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
      j <=
      GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE -
        GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
      j += GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH
    ) {
      latitudes.push(new maplibregl.LngLat(j, i));
    }
    testPoints.push(latitudes);
  }
  return testPoints;
};

/**
 * Extract geojson endpoints into an array for easier manipulation
 */
export const generateEndPointArray = (endpoints: any[]) => {
  const outputEndpointArray = [];
  for (let i = 0; i < endpoints.length; i++) {
    outputEndpointArray.push(endpoints[i].source.data);
    if (
      Number(outputEndpointArray[i].geometry.coordinates[1]) ===
      Number(GEOPROXIMITY_CONSTANTS.MAX_LATITUDE)
    ) {
      outputEndpointArray[i].geometry.coordinates[1] = MAX_LATITUDE_ADJUSTMENT;
    } else if (
      Number(outputEndpointArray[i].geometry.coordinates[1]) ===
      Number(GEOPROXIMITY_CONSTANTS.MIN_LATITUDE)
    ) {
      outputEndpointArray[i].geometry.coordinates[1] =
        -1 * MAX_LATITUDE_ADJUSTMENT;
    }
    outputEndpointArray[i].endpointId = endpoints[i].id;
  }
  return outputEndpointArray;
};

/**
 * Computes which region each point in the test grid belongs to by calculating the weighted distance
 * between the testpoint and each endpoint and taking the minimum value
 * @param testPoints is a 2D array of evenly distributed grid points that are compared to each endpoint to determine which region they belong in
 * @param endpoints is an array of endpoints formatted as geojson
 */
export const computeGeoproximityRegionsForGrid = (
  testPoints: any[][],
  endpoints: any,
) => {
  if (endpoints[0]) {
    for (const testPoint of testPoints) {
      for (const point of testPoint) {
        let min = {
          distance:
            endpoints[0].modifier *
            haversine(point, endpoints[0].geometry.coordinates),
          endpoint: endpoints[0],
          endpointId: endpoints[0].endpointId,
        };
        for (let k = 1; k < endpoints.length; k++) {
          const dist =
            endpoints[k].modifier *
            haversine(point, endpoints[k].geometry.coordinates);
          const entry = {
            distance: dist,
            endpoint: endpoints[k],
            endpointId: endpoints[k].endpointId,
          };
          if (entry.distance < min.distance) {
            min = entry;
          }
        }
        point.endpoint = min.endpoint;
        point.endpointId = min.endpointId;
      }
    }
  }
};

/**
 * Computes the haversine distance between two points using the formula below:
 *
 * a = sin^2(deltaLat/2) * sin^2(deltaLng/2) * cos(point1Lat) * cos(point2Lat)
 * c = 2 * atan2(sqrt(a), sqrt(1-a))
 * haversineDistance = radiusEarth * c
 *
 * Note that testpoint is a LngLat object, but endpoint is input as an array in the order (Lng,Lat)
 * This is because endpoints need to be stored as geojson and this is the convention it uses
 */
const haversine = (testpoint: LngLat, endpoint: number[]) => {
  const endpointObj = new maplibregl.LngLat(endpoint[0], endpoint[1]);
  const toRad = Math.PI / 180;
  const testpointLat = testpoint.lat * toRad;
  const endpointLat = endpointObj.lat * toRad;
  const deltaLat = endpointLat - testpointLat;
  const deltaLng = (endpointObj.lng - testpoint.lng) * toRad;

  let tmpCalc =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(testpointLat) *
      Math.cos(endpointLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  tmpCalc = 2 * Math.atan2(Math.sqrt(tmpCalc), Math.sqrt(1 - tmpCalc));
  const distance = RADIUS * tmpCalc;
  return distance;
};

/**
 * Updates the upper right point of the polygon that is currently being generated
 * @param testPoints is a 2D array of evenly distributed grid points that have been compared to each endpoint to determine which region they belong in
 */
export const updateUpperRightPolygonVertex = (
  i: number,
  j: number,
  testPoints: any[][],
) => {
  return new maplibregl.LngLat(
    testPoints[i][j].lng + GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
    testPoints[i][j].lat + GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
  );
};

/**
 * Updates the lower right point of the polygon that is currently being generated
 * @param testPoints is a 2D array of evenly distributed grid points that have been compared to each endpoint to determine which region they belong in
 */
export const updateLowerRightPolygonVertex = (
  i: number,
  j: number,
  testPoints: any[][],
) => {
  return new maplibregl.LngLat(
    testPoints[i][j].lng + GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
    testPoints[i][j].lat - GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
  );
};

/**
 * Uses the approximate length of the polygon being generated and the current latitude to define the
 * constants that should be used in the midpoint calculation. See the method that computes midpoint
 * for more details on what the constants do
 * @param testPoints is a 2D array of evenly distributed grid points that have been compared to each endpoint to determine which region they belong in
 * @param approximatePolygonLengthGridUnits is an approximation of how long the polygon that is currently being generated is in units of grid squares
 */
export const getMidpointCalculationConstants = (
  i: number,
  j: number,
  testPoints: any[][],
  approximatePolygonLengthGridUnits: number,
) => {
  let overreachFactor;
  let shift;
  let localApproximatePolygonLengthGridUnits =
    approximatePolygonLengthGridUnits;

  // If the polygon is extremely short, there is no need to overreach by a lot, as the slope is likely steeper
  if (localApproximatePolygonLengthGridUnits === 0) {
    localApproximatePolygonLengthGridUnits = 2;
    overreachFactor = BASE_OVERREACH_FACTOR;
  }

  // If the polygon is at the start of the latitude line, it is short, and the endpoints are more likely to be found in the expected range
  if (j === 1) {
    shift = 1;
    overreachFactor = BASE_OVERREACH_FACTOR;
    // If the polygon is long and close to either pole, it will likely be necessary to search beyond the expected region, thus shift and overreach are large
  } else if (
    j >= Math.min(localApproximatePolygonLengthGridUnits, MAXIMUM_SHIFT) &&
    Math.abs(testPoints[i][j].lat) > HIGH_LATITUDE_THRESHOLD
  ) {
    shift = Math.min(localApproximatePolygonLengthGridUnits, MAXIMUM_SHIFT);
    overreachFactor = HIGH_LATITUDE_OVERREACH_FACTOR;
    // If the polygon is long, use a greater shift since the slope may be shallower and the points may fall outside the expected range
  } else if (
    j >= Math.min(localApproximatePolygonLengthGridUnits, MAXIMUM_SHIFT)
  ) {
    shift = Math.min(localApproximatePolygonLengthGridUnits, MAXIMUM_SHIFT);
    overreachFactor = BASE_OVERREACH_FACTOR;
    // Otherwise, the polygon is short to medium and overreach can be set to default and shift does not need to be long
  } else {
    shift = 2;
    overreachFactor = BASE_OVERREACH_FACTOR;
  }

  return {
    shift: shift,
    overreachFactor: overreachFactor,
  };
};

/**
 * Computes the approximate point where the upper line on a polygon transitions to a new region
 * Get the point to start searching at by taking the point "shift" units left of the point at (i, j) in testPoints
 * Get the approximate point to stop searching at by taking the point at (i, j) in testPoints
 * Add half of a grid square's length to the latitude of each point, as this determines where the top line of the polygon transitions
 * @param testPoints is a 2D array of evenly distributed grid points that have been compared to each endpoint to determine which region they belong in
 * See getMidpoint for explanations of @param shift and @param overreachFactor
 */
export const getUpperLineMidpoint = (
  i: number,
  j: number,
  shift: number,
  overreachFactor: number,
  testPoints: any[][],
) => {
  const startSearchPoint: any = new maplibregl.LngLat(
    testPoints[i][j - shift].lng,
    testPoints[i][j - shift].lat +
      GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
  );
  startSearchPoint.endpoint = testPoints[i][j - shift].endpoint;
  const approximateEndSearchPoint: any = new maplibregl.LngLat(
    testPoints[i][j].lng,
    testPoints[i][j].lat + GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
  );
  approximateEndSearchPoint.endpoint = testPoints[i][j].endpoint;
  return getMidpoint(
    startSearchPoint,
    approximateEndSearchPoint,
    shift,
    overreachFactor,
    true,
  );
};

/**
 * Same as function above, but subtract half of a grid square's length from the latitude of each point instead of adding
 * This determines where the bottom line of the polygon transitions
 */
export const getLowerLineMidpoint = (
  i: number,
  j: number,
  shift: number,
  overreachFactor: number,
  testPoints: any[][],
) => {
  const shiftedPoint = testPoints[i][j - shift];
  const startSearchPoint: any = new maplibregl.LngLat(
    shiftedPoint.lng,
    shiftedPoint.lat - GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
  );
  startSearchPoint.endpoint = shiftedPoint.endpoint;
  const approximateEndSearchPoint: any = new maplibregl.LngLat(
    testPoints[i][j].lng,
    testPoints[i][j].lat - GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2,
  );
  approximateEndSearchPoint.endpoint = testPoints[i][j].endpoint;
  return getMidpoint(
    startSearchPoint,
    approximateEndSearchPoint,
    shift,
    overreachFactor,
    false,
  );
};

/**
 * Computes approximate point where one region transitions into another by testing points in between them until the endpoint it is closest to changes
 * @param startSearchPoint is a grid point in the left region that tells where to start looking for the midpoint
 * @param approximateEndSearchPoint is a point in the right region that tells approximately where to stop looking for the midpoint
 * @param shift is the number of grid squares between the two points being tested
 * @param overreachFactor defines how far to go beyond expected endpoint; increasing it can create smoother polygons in some geometries, but occasional graphical errors at the edges of small polygons
 * @param isUpperLine tells whether the midpoint is being calculated for an upper line or lower line on the polygon
 *
 * The midpoint is expected to be found within (MIDPOINT_ACCURACY_CONST * shift) tests
 * If the transition isn't found in this region, it tests up to (overreachFactor * accuracyConst * shift) points
 */
const getMidpoint = (
  startSearchPoint: any,
  approximateEndSearchPoint: any,
  shift: number,
  overreachFactor: number,
  isUpperLine: boolean,
) => {
  const biasLeftRegion = startSearchPoint.endpoint.modifier;
  const biasRightRegion = approximateEndSearchPoint.endpoint.modifier;
  const endpointLeftRegion = startSearchPoint.endpoint.geometry.coordinates;
  const endpointRightRegion =
    approximateEndSearchPoint.endpoint.geometry.coordinates;
  const increment =
    Math.abs(startSearchPoint.lng - approximateEndSearchPoint.lng) /
    (MIDPOINT_ACCURACY_CONST * shift);
  const incrementPoint = new maplibregl.LngLat(
    startSearchPoint.lng,
    startSearchPoint.lat,
  );
  let count = 0;

  // If 360 degrees are searched without finding a transition, a midpoint does not exist
  let midpointExists =
    incrementPoint.lng <
    2 * GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE + startSearchPoint.lng;

  let distanceToLeftEndpoint =
    biasLeftRegion * haversine(incrementPoint, endpointLeftRegion);
  let distanceToRightEndpoint =
    biasRightRegion * haversine(incrementPoint, endpointRightRegion);

  // Do an initial run through across the entire latitude using big increments to see if there is a transition between these two regions
  while (distanceToLeftEndpoint <= distanceToRightEndpoint && midpointExists) {
    incrementPoint.lng++;
    midpointExists =
      incrementPoint.lng <
      2 * GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE + startSearchPoint.lng;
    distanceToLeftEndpoint =
      biasLeftRegion * haversine(incrementPoint, endpointLeftRegion);
    distanceToRightEndpoint =
      biasRightRegion * haversine(incrementPoint, endpointRightRegion);
  }

  // If no midpoint is found, use the latitude of the grid square's center as the increment point, since there is definitely a transition point on this line. This keeps the error from being no more than half a grid square
  if (!midpointExists) {
    if (isUpperLine) {
      incrementPoint.lat -= GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    } else {
      incrementPoint.lat += GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    }
  }

  // Search for the midpoint
  const maxNumberOfIterations =
    overreachFactor * MIDPOINT_ACCURACY_CONST * shift;
  incrementPoint.lng = startSearchPoint.lng;
  distanceToLeftEndpoint =
    biasLeftRegion * haversine(incrementPoint, endpointLeftRegion);
  distanceToRightEndpoint =
    biasRightRegion * haversine(incrementPoint, endpointRightRegion);

  while (
    distanceToLeftEndpoint <= distanceToRightEndpoint &&
    count < maxNumberOfIterations
  ) {
    incrementPoint.lng += increment;
    distanceToLeftEndpoint =
      biasLeftRegion * haversine(incrementPoint, endpointLeftRegion);
    distanceToRightEndpoint =
      biasRightRegion * haversine(incrementPoint, endpointRightRegion);
    count++; // Certain geometries can create an infinite loop, so break if point isn't found after region of defined length has been tested
  }

  const midpointLng =
    (incrementPoint.lng + (incrementPoint.lng - increment)) / 2;
  incrementPoint.lng = midpointLng;

  // If the grid square's center was used as an approximation, readjust the latitude so that it's back on the line that the midpoint is being calculated for
  if (!midpointExists) {
    if (isUpperLine) {
      incrementPoint.lat += GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    } else {
      incrementPoint.lat -= GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    }
  }
  return incrementPoint;
};

/**
 * Translates a bias between -99 and 99 to a constant for use in the weighted haversine formula
 */
const computeBiasConstant = (bias: number) => {
  let biasConst = 1;
  if (bias > 0) {
    biasConst = 1 - bias / 100;
  } else if (bias < 0) {
    biasConst = 1 / (1 + bias / 100);
  }
  return biasConst;
};

export {};
