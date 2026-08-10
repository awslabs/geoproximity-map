// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { EndpointInput, GeoproximityMapData } from "../types";
import { extractValidEntries } from "./extractValidEntries";
import { extractUniqueEntries } from "./extractDuplicateEntries";

/** Validates and deduplicates raw endpoint inputs into parallel arrays ready for map rendering. */
export const processEndpoints = (
  input: EndpointInput[],
): GeoproximityMapData => {
  const { validEntries, invalidEntries } = extractValidEntries(input);
  const { uniqueEntries, duplicateEntries } =
    extractUniqueEntries(validEntries);

  if (invalidEntries.length > 0) {
    console.warn(
      `[GeoproximityMap] ${invalidEntries.length} invalid endpoint(s) dropped.`,
      invalidEntries,
    );
  }
  if (duplicateEntries.length > 0) {
    console.warn(
      `[GeoproximityMap] ${duplicateEntries.length} duplicate endpoint(s) dropped.`,
      duplicateEntries,
    );
  }

  /** Add endpoint labels to match the map required data format. */
  const result: GeoproximityMapData = {
    lats: [],
    lons: [],
    biases: [],
    endpointLabels: [],
  };
  for (let i = 0; i < uniqueEntries.length; i++) {
    result.lats.push(uniqueEntries[i].lat);
    result.lons.push(uniqueEntries[i].lon);
    result.biases.push(uniqueEntries[i].bias);
    result.endpointLabels.push(i + 1);
  }

  return result;
};
