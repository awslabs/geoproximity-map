// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import regionsData from "../data/regions.json";
import localZonesData from "../data/local-zones.json";
import customData from "../data/custom.json";

/** Customdata is intentionally put at last to ensure its priority in coordinate lookup */
const COORDINATES: Record<string, { lat: number; lon: number }> = {
  ...localZonesData,
  ...regionsData,
  ...customData,
};

export const getGeoproximityCoordinate = (name: string) => {
  return COORDINATES[name] ?? null;
};
