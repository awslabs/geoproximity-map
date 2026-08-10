// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import { extractValidEntries } from "../utils/extractValidEntries";
import type { EndpointInput } from "../types";

describe("extractValidEntries", () => {
  it("returns empty arrays for empty input", () => {
    const { validEntries, invalidEntries } = extractValidEntries([]);
    expect(validEntries).toEqual([]);
    expect(invalidEntries).toEqual([]);
  });

  it("resolves a valid Region to coordinates", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: 0 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(1);
    expect(validEntries[0]).toEqual({ lat: 38.89, lon: -77.01, bias: 0 });
    expect(invalidEntries).toHaveLength(0);
  });

  it("resolves a valid LocalZoneGroup to coordinates", () => {
    const input: EndpointInput[] = [
      { type: "LocalZoneGroup", name: "us-east-1-atl-1", bias: 10 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(1);
    expect(validEntries[0]).toEqual({ lat: 33.64, lon: -84.43, bias: 10 });
    expect(invalidEntries).toHaveLength(0);
  });

  it("passes through valid Coordinate input directly", () => {
    const input: EndpointInput[] = [
      { type: "Coordinate", lat: 45.0, lon: -120.0, bias: 5 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(1);
    expect(validEntries[0]).toEqual({ lat: 45.0, lon: -120.0, bias: 5 });
    expect(invalidEntries).toHaveLength(0);
  });

  it("defaults bias to 0 when omitted", () => {
    const input: EndpointInput[] = [{ type: "Region", name: "us-east-1" }];
    const { validEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(1);
    expect(validEntries[0].bias).toBe(0);
  });

  it("rejects bias out of range (> 99)", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: 100 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  it("rejects bias out of range (< -99)", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: -100 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  it("rejects non-integer bias", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: 1.5 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  it("rejects NaN bias", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: NaN },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  it("rejects unknown region name", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "fake-region", bias: 0 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  it("rejects coordinate with lat out of bounds", () => {
    const input: EndpointInput[] = [
      { type: "Coordinate", lat: 91, lon: 0, bias: 0 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  it("rejects coordinate with lon out of bounds", () => {
    const input: EndpointInput[] = [
      { type: "Coordinate", lat: 0, lon: 181, bias: 0 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  it("accepts boundary values for bias and coordinates", () => {
    const input: EndpointInput[] = [
      { type: "Coordinate", lat: 90, lon: 180, bias: 99 },
      { type: "Coordinate", lat: -90, lon: -180, bias: -99 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(2);
    expect(invalidEntries).toHaveLength(0);
  });

  it("splits mixed valid and invalid entries correctly", () => {
    const input: EndpointInput[] = [
      { type: "Region", name: "us-east-1", bias: 0 },
      { type: "Region", name: "fake-region", bias: 0 },
      { type: "Coordinate", lat: 10, lon: 20, bias: 5 },
      { type: "Coordinate", lat: 10, lon: 20, bias: 200 },
    ];
    const { validEntries, invalidEntries } = extractValidEntries(input);
    expect(validEntries).toHaveLength(2);
    expect(invalidEntries).toHaveLength(2);
  });
});
