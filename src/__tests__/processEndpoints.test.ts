// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi } from "vitest";
import { processEndpoints } from "../utils/processEndpoints";
import type { EndpointInput } from "../types";

describe("processEndpoints", () => {
  it("returns empty GeoproximityMapData for empty input", () => {
    const result = processEndpoints([]);
    expect(result).toEqual({
      lats: [],
      lons: [],
      biases: [],
      endpointLabels: [],
    });
  });

  it("produces correct parallel arrays for valid input", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: 10 },
      { type: "Coordinate", lat: 45, lon: -120, bias: -5 },
    ];
    const result = processEndpoints(input);
    expect(result.lats).toEqual([38.89, 45]);
    expect(result.lons).toEqual([-77.01, -120]);
    expect(result.biases).toEqual([10, -5]);
    expect(result.endpointLabels).toEqual([1, 2]);
  });

  it("drops invalid entries and assigns sequential labels to valid ones", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: 0 },
      { type: "Region", name: "fake-region", bias: 0 },
      { type: "Coordinate", lat: 10, lon: 20, bias: 5 },
    ];
    const result = processEndpoints(input);
    expect(result.lats).toHaveLength(2);
    expect(result.endpointLabels).toEqual([1, 2]);
  });

  it("drops duplicate entries", () => {
    const input: EndpointInput[] = [
      { type: "Coordinate", lat: 10, lon: 20, bias: 0 },
      { type: "Coordinate", lat: 10, lon: 20, bias: 5 },
    ];
    const result = processEndpoints(input);
    expect(result.lats).toHaveLength(1);
    expect(result.endpointLabels).toEqual([1]);
  });

  it("warns about invalid entries", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());
    const input: EndpointInput[] = [
      { type: "Region", name: "fake-region", bias: 0 },
    ];
    processEndpoints(input);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("invalid"),
      expect.anything(),
    );
    warnSpy.mockRestore();
  });

  it("warns about duplicate entries", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());
    const input: EndpointInput[] = [
      { type: "Coordinate", lat: 10, lon: 20, bias: 0 },
      { type: "Coordinate", lat: 10, lon: 20, bias: 5 },
    ];
    processEndpoints(input);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("duplicate"),
      expect.anything(),
    );
    warnSpy.mockRestore();
  });
});
