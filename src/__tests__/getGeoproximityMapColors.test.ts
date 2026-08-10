// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import {
  getColorAtIndex,
  getTextColorAtIndex,
} from "../utils/getGeoproximityMapColors";

describe("getColorAtIndex", () => {
  it("returns a color for index 0", () => {
    expect(getColorAtIndex(0)).toBe("#0000FF");
  });

  it("wraps around when index exceeds array length", () => {
    expect(getColorAtIndex(15)).toBe("#0000FF");
    expect(getColorAtIndex(16)).toBe("#800000");
  });
});

describe("getTextColorAtIndex", () => {
  it("returns a text color for index 0", () => {
    expect(getTextColorAtIndex(0)).toBe("popup-white");
  });

  it("returns popup-black for light background colors", () => {
    expect(getTextColorAtIndex(2)).toBe("popup-black");
  });

  it("wraps around when index exceeds array length", () => {
    expect(getTextColorAtIndex(15)).toBe("popup-white");
  });
});
