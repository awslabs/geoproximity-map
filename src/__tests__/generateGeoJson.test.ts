// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import {
  computeGeoproximityRegionsForGrid,
  ENDPOINT_OPACITY,
  ENDPOINT_RADIUS,
  generateEndPointArray,
  generateGeoJsonEndpoints,
  generateGeoJsonPolygon,
  getMidpointCalculationConstants,
  validateInput,
} from "../utils/generateGeoJson";
import { getColorAtIndex } from "../utils/getGeoproximityMapColors";

describe("validateInput", () => {
  it("should be false if lats, lons, or biases contain invalid numbers", () => {
    const result = validateInput([1000], [10], [0]);
    expect(result).toBe(false);
  });

  it("should be false if there are duplicate coordinate pairs", () => {
    const result = validateInput([10, 10], [10, 10], [0, 10]);
    expect(result).toBe(false);
  });

  it("should be false if arrays have different lengths", () => {
    const result = validateInput([10, 20], [10], [0]);
    expect(result).toBe(false);
  });

  it("should be true for valid input", () => {
    const result = validateInput([10, 20], [30, 40], [0, 5]);
    expect(result).toBe(true);
  });

  it("should be false if lats is undefined", () => {
    const result = validateInput(undefined as any, [10], [0]);
    expect(result).toBe(false);
  });
});

describe("generateGeoJsonEndpoints", () => {
  it("should generate the correct geo json endpoint", () => {
    const geoJson = generateGeoJsonEndpoints(
      [10],
      [10],
      [0],
      [1],
      new Map(),
      new Map(),
      new Map(),
    );
    const result = [
      {
        id: "1",
        label: 1,
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            id: "Endpoint",
            geometry: {
              type: "Point",
              coordinates: [10, 10],
            },
            color: getColorAtIndex(0),
            modifier: 1,
          },
        },
        paint: {
          "circle-radius": ENDPOINT_RADIUS,
          "circle-opacity": ENDPOINT_OPACITY,
          "circle-color": getColorAtIndex(0),
        },
      },
    ];
    expect(geoJson).toEqual(result);
  });

  it("should compute correct modifier for positive bias", () => {
    const geoJson = generateGeoJsonEndpoints(
      [10],
      [10],
      [50],
      [1],
      new Map(),
      new Map(),
      new Map(),
    );
    expect(geoJson[0].source.data.modifier).toBe(0.5);
  });

  it("should compute correct modifier for negative bias", () => {
    const geoJson = generateGeoJsonEndpoints(
      [10],
      [10],
      [-50],
      [1],
      new Map(),
      new Map(),
      new Map(),
    );
    expect(geoJson[0].source.data.modifier).toBe(2);
  });
});

describe("generateGeoJsonPolygon", () => {
  it("should not add polygon when endpointId is falsy", () => {
    const geoProxPolygons = new Map();
    const points = {
      upperLeft: { lng: 0, lat: 1 },
      upperRight: { lng: 1, lat: 1 },
      lowerRight: { lng: 1, lat: 0 },
      lowerLeft: { lng: 0, lat: 0 },
    };
    generateGeoJsonPolygon(points, "", geoProxPolygons);
    expect(geoProxPolygons.size).toBe(0);
  });
});

describe("generateEndPointArray", () => {
  it("should adjust lat 90 to MAX_LATITUDE_ADJUSTMENT", () => {
    const endpoints = [
      {
        id: "1",
        source: { data: { geometry: { coordinates: [10, 90] } } },
      },
    ];
    const result = generateEndPointArray(endpoints);
    expect(result[0].geometry.coordinates[1]).toBe(89.999);
  });

  it("should adjust lat -90 to negative MAX_LATITUDE_ADJUSTMENT", () => {
    const endpoints = [
      {
        id: "1",
        source: { data: { geometry: { coordinates: [10, -90] } } },
      },
    ];
    const result = generateEndPointArray(endpoints);
    expect(result[0].geometry.coordinates[1]).toBe(-89.999);
  });
});

describe("computeGeoproximityRegionsForGrid", () => {
  it("should handle empty endpoints array", () => {
    const testPoints: any[][] = [[{ lng: 0, lat: 0 }]];
    computeGeoproximityRegionsForGrid(testPoints, []);
    expect(testPoints[0][0].endpoint).toBeUndefined();
  });
});

describe("getMidpointCalculationConstants", () => {
  it("should return shift=2 and base overreach for short polygons", () => {
    const testPoints = Array.from({ length: 5 }, (_, i) =>
      Array.from({ length: 10 }, (_, j) => ({
        lng: j * 0.3 - 180,
        lat: i * 0.3 - 90,
      })),
    );
    const result = getMidpointCalculationConstants(2, 3, testPoints, 5);
    expect(result.shift).toBe(2);
    expect(result.overreachFactor).toBe(1.4);
  });
});
