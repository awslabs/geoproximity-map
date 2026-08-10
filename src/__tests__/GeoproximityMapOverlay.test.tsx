// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import { describe, it, vi } from "vitest";

import { GeoproximityMapOverlay } from "../GeoproximityMapOverlay";
import type { GeoproximityMapData } from "../types";

vi.mock("maplibre-gl", () => ({
  default: {
    LngLat: vi.fn(function (this: any, lng: number, lat: number) {
      this.lng = lng;
      this.lat = lat;
    }),
    Popup: vi.fn(function () {
      return {
        setLngLat: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
      };
    }),
  },
  LngLat: vi.fn(function (this: any, lng: number, lat: number) {
    this.lng = lng;
    this.lat = lat;
  }),
  Popup: vi.fn(function () {
    return {
      setLngLat: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    };
  }),
}));

const createMockMap = (): any => ({
  on: vi.fn(),
  addLayer: vi.fn(),
  addSource: vi.fn(),
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  getStyle: vi.fn(() => ({ layers: [] })),
  queryRenderedFeatures: vi.fn(() => []),
  setFeatureState: vi.fn(),
});

describe("GeoproximityMapOverlay", () => {
  it("should generate the geoproximity map", () => {
    const map = createMockMap();
    const data: GeoproximityMapData = {
      lats: [10, -10],
      lons: [10, -10],
      biases: [0, 0],
      endpointLabels: [1, 2],
    };
    render(<GeoproximityMapOverlay map={map} data={data} />);
  });

  it("should generate the geoproximity map with endpoints near the antimeridian", () => {
    const map = createMockMap();
    const data: GeoproximityMapData = {
      lats: [10, 10],
      lons: [170, -170],
      biases: [0, 0],
      endpointLabels: [1, 2],
    };
    render(<GeoproximityMapOverlay map={map} data={data} />);
  });

  it("should not draw polygons when data is empty", () => {
    const map = createMockMap();
    const data: GeoproximityMapData = {
      lats: [],
      lons: [],
      biases: [],
      endpointLabels: [],
    };
    render(<GeoproximityMapOverlay map={map} data={data} />);
  });
});
