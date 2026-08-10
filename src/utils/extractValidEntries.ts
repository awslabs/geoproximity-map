// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { EndpointInput } from "../types";
import { getGeoproximityCoordinate } from "../coordinates/getGeoproximityMapCoordinates";

const MAX_LATITUDE = 90;
const MIN_LATITUDE = -90;
const MAX_LONGITUDE = 180;
const MIN_LONGITUDE = -180;
const MAX_BIAS = 99;
const MIN_BIAS = -99;

export interface ValidEndpoint {
  lat: number;
  lon: number;
  bias: number;
}

const isValidEntry = (entry: EndpointInput): ValidEndpoint | null => {
  const bias = entry.bias ?? 0;
  if (
    typeof bias !== "number" ||
    !Number.isFinite(bias) ||
    !Number.isInteger(bias) ||
    bias < MIN_BIAS ||
    bias > MAX_BIAS
  ) {
    return null;
  }

  if (entry.type === "Coordinate") {
    const { lat, lon } = entry;
    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < MIN_LATITUDE ||
      lat > MAX_LATITUDE ||
      lon < MIN_LONGITUDE ||
      lon > MAX_LONGITUDE
    ) {
      return null;
    }
    return { lat, lon, bias };
  }

  const coords = getGeoproximityCoordinate(entry.name);
  if (!coords) {
    return null;
  }
  return { lat: coords.lat, lon: coords.lon, bias };
};

/** Splits raw inputs into resolved valid endpoints and rejected invalid entries. */
export const extractValidEntries = (
  input: EndpointInput[],
): {
  validEntries: ValidEndpoint[];
  invalidEntries: EndpointInput[];
} => {
  const validEntries: ValidEndpoint[] = [];
  const invalidEntries: EndpointInput[] = [];

  for (const entry of input) {
    const resolved = isValidEntry(entry);
    if (resolved) {
      validEntries.push(resolved);
    } else {
      invalidEntries.push(entry);
    }
  }

  return { validEntries, invalidEntries };
};
