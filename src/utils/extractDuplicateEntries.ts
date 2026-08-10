// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ValidEndpoint } from "./extractValidEntries";

const POLE_LATITUDE = 90;
const ANTIMERIDIAN_LONGITUDE = 180;

/** Separates unique endpoints from duplicates (same coordinates, poles, or antimeridian equivalents). */
export const extractUniqueEntries = (
  entries: ValidEndpoint[],
): {
  uniqueEntries: ValidEndpoint[];
  duplicateEntries: ValidEndpoint[];
} => {
  const seenLocations = new Set<string>();
  const seenPoles = new Set<string>();
  const seenAntimeridian = new Set<string>();

  const uniqueEntries: ValidEndpoint[] = [];
  const duplicateEntries: ValidEndpoint[] = [];

  for (const entry of entries) {
    // "lat,lon" string used as a unique identifier for this location
    const locationKey = `${entry.lat.toFixed(2)},${entry.lon.toFixed(2)}`;
    const isAtPole = Math.abs(entry.lat) === POLE_LATITUDE;
    const isAtAntimeridian = Math.abs(entry.lon) === ANTIMERIDIAN_LONGITUDE;

    const isDuplicate =
      seenLocations.has(locationKey) ||
      (isAtPole && seenPoles.has(entry.lat > 0 ? "north" : "south")) ||
      (isAtAntimeridian && seenAntimeridian.has(entry.lat.toFixed(2)));

    if (isDuplicate) {
      duplicateEntries.push(entry);
    } else {
      seenLocations.add(locationKey);
      if (isAtPole) seenPoles.add(entry.lat > 0 ? "north" : "south");
      if (isAtAntimeridian) seenAntimeridian.add(entry.lat.toFixed(2));
      uniqueEntries.push(entry);
    }
  }

  return { uniqueEntries, duplicateEntries };
};
