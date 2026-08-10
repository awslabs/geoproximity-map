// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { EndpointInput } from "geoproximity-map";
import regionsData from "../data/regions.json";
import localZonesData from "../data/local-zones.json";

export interface Coordinate {
  lat: number;
  lon: number;
}

// The demo owns its own region/zone coordinates so it depends only on the
// component's public API. Snapshot of the component's region/local-zone data.
const COORDINATES: Record<string, Coordinate> = {
  ...localZonesData,
  ...regionsData,
};

/** Resolves an endpoint to its map coordinate, or null if it has none. */
export function resolveCoordinate(endpoint: EndpointInput): Coordinate | null {
  if (endpoint.type === "Coordinate") {
    return { lat: endpoint.lat, lon: endpoint.lon };
  }
  return COORDINATES[endpoint.name] ?? null;
}
