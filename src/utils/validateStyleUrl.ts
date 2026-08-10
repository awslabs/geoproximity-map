// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/** Validates that styleUrl is a well-formed absolute URL. Returns the URL string if valid, null otherwise. */
export const validateStyleUrl = (styleUrl: string): string | null => {
  try {
    new URL(styleUrl);
    return styleUrl;
  } catch {
    console.warn(
      `[GeoproximityMap] Invalid styleUrl: "${styleUrl}". Must be a valid absolute URL.`,
    );
    return null;
  }
};
