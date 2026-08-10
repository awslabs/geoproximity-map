// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface GeoproximityMapData {
  lats: number[];
  lons: number[];
  biases: number[];
  endpointLabels: number[];
}

/**
 * A single geoproximity endpoint before validation.
 * - Region/LocalZoneGroup/Custom: resolved to coordinates via name lookup.
 * - Coordinate: uses the provided lat/lon directly.
 * Bias must be an integer in [-99, 99].
 */
export type EndpointInput =
  | { type: "Region"; name: string; bias?: number }
  | { type: "LocalZoneGroup"; name: string; bias?: number }
  | { type: "Coordinate"; lat: number; lon: number; bias?: number }
  | { type: "Custom"; name: string; bias?: number };
