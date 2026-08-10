// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import { getGeoproximityCoordinate } from "../coordinates/getGeoproximityMapCoordinates";

describe("getGeoproximityCoordinate", () => {
  it("returns coordinates for a known region", () => {
    const result = getGeoproximityCoordinate("us-east-1");
    expect(result).toEqual({ lat: 38.89, lon: -77.01 });
  });

  it("returns coordinates for a known local zone", () => {
    const result = getGeoproximityCoordinate("us-east-1-atl-1");
    expect(result).toEqual({ lat: 33.64, lon: -84.43 });
  });

  it("returns null for an unknown name", () => {
    const result = getGeoproximityCoordinate("fake-region");
    expect(result).toBeNull();
  });

  it("returns null for an empty string", () => {
    const result = getGeoproximityCoordinate("");
    expect(result).toBeNull();
  });
});
