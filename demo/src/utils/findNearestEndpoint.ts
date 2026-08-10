// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type maplibregl from "maplibre-gl";
import type { EndpointInput } from "geoproximity-map";
import { resolveCoordinate } from "./resolveCoordinate";

export interface NearestEndpoint {
  index: number;
  lngLat: [number, number];
}

/** Default pixel radius within which a point counts as hitting an endpoint. */
export const HIT_RADIUS = 12;

/**
 * Returns the endpoint whose map position is closest to `point`, within
 * `radius` pixels, or null if none qualify. Endpoints without a resolvable
 * coordinate are skipped.
 */
export function findNearestEndpoint(
  map: maplibregl.Map,
  endpoints: EndpointInput[],
  point: maplibregl.Point,
  radius: number = HIT_RADIUS,
): NearestEndpoint | null {
  let hit: NearestEndpoint | null = null;
  let nearest = radius;
  endpoints.forEach((endpoint, index) => {
    const coord = resolveCoordinate(endpoint);
    if (!coord) return;
    const projected = map.project([coord.lon, coord.lat]);
    const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
    if (distance <= nearest) {
      nearest = distance;
      hit = { index, lngLat: [coord.lon, coord.lat] };
    }
  });
  return hit;
}
