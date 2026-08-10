// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi } from "vitest";
import { validateStyleUrl } from "../utils/validateStyleUrl";

describe("validateStyleUrl", () => {
  it("returns the URL string for a valid absolute URL", () => {
    const url =
      "https://maps.geo.us-east-1.amazonaws.com/v2/styles/Monochrome/descriptor?key=abc";
    expect(validateStyleUrl(url)).toBe(url);
  });

  it("returns null for a malformed URL", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());
    expect(validateStyleUrl("not-a-url")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("returns null for an empty string", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());
    expect(validateStyleUrl("")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
