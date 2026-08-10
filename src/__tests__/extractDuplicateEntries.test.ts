// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import { extractUniqueEntries } from "../utils/extractDuplicateEntries";
import type { ValidEndpoint } from "../utils/extractValidEntries";

describe("extractUniqueEntries", () => {
  it("returns all entries as unique when no duplicates exist", () => {
    const entries: ValidEndpoint[] = [
      { lat: 10, lon: 20, bias: 0 },
      { lat: 30, lon: 40, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(2);
    expect(duplicateEntries).toHaveLength(0);
  });

  it("detects exact coordinate duplicates", () => {
    const entries: ValidEndpoint[] = [
      { lat: 10, lon: 20, bias: 0 },
      { lat: 10, lon: 20, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(1);
    expect(duplicateEntries).toHaveLength(1);
    expect(uniqueEntries[0]).toEqual({ lat: 10, lon: 20, bias: 0 });
  });

  it("detects pole duplicates (same pole, different longitudes)", () => {
    const entries: ValidEndpoint[] = [
      { lat: 90, lon: 0, bias: 0 },
      { lat: 90, lon: 120, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(1);
    expect(duplicateEntries).toHaveLength(1);
  });

  it("does not treat north and south poles as duplicates", () => {
    const entries: ValidEndpoint[] = [
      { lat: 90, lon: 0, bias: 0 },
      { lat: -90, lon: 0, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(2);
    expect(duplicateEntries).toHaveLength(0);
  });

  it("detects antimeridian duplicates (lon 180 and -180 at same lat)", () => {
    const entries: ValidEndpoint[] = [
      { lat: 45, lon: 180, bias: 0 },
      { lat: 45, lon: -180, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(1);
    expect(duplicateEntries).toHaveLength(1);
  });

  it("does not treat antimeridian points at different lats as duplicates", () => {
    const entries: ValidEndpoint[] = [
      { lat: 45, lon: 180, bias: 0 },
      { lat: 50, lon: -180, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(2);
    expect(duplicateEntries).toHaveLength(0);
  });

  it("treats coordinates differing at the 3rd decimal place as the same when they round equally", () => {
    const entries: ValidEndpoint[] = [
      { lat: 10.001, lon: 20.001, bias: 0 },
      { lat: 10.004, lon: 20.004, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(1);
    expect(duplicateEntries).toHaveLength(1);
  });

  it("treats coordinates differing at the 3rd decimal place as unique when they round differently", () => {
    const entries: ValidEndpoint[] = [
      { lat: 10.001, lon: 20.001, bias: 0 },
      { lat: 10.009, lon: 20.009, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(2);
    expect(duplicateEntries).toHaveLength(0);
  });

  it("treats coordinates differing at the 2nd decimal place as unique", () => {
    const entries: ValidEndpoint[] = [
      { lat: 10.01, lon: 20.01, bias: 0 },
      { lat: 10.02, lon: 20.02, bias: 5 },
    ];
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries(entries);
    expect(uniqueEntries).toHaveLength(2);
    expect(duplicateEntries).toHaveLength(0);
  });

  it("returns empty arrays for empty input", () => {
    const { uniqueEntries, duplicateEntries } = extractUniqueEntries([]);
    expect(uniqueEntries).toEqual([]);
    expect(duplicateEntries).toEqual([]);
  });
});
