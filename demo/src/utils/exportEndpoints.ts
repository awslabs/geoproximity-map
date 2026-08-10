// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { EndpointInput } from "geoproximity-map";

/**
 * Serialize the current endpoint list (Regions, Local Zones, Coordinates, and
 * Custom entries the user added, including those from "click to add endpoint")
 * to a pretty-printed JSON string. The output round-trips back into the
 * `endpoints` prop, so an exported file can later be re-imported unchanged.
 */
export function serializeEndpoints(endpoints: EndpointInput[]): string {
  return JSON.stringify(endpoints, null, 2);
}

/**
 * Trigger a client-side download of the current endpoints as a JSON file.
 * Callers should disable the control when the list is empty; exporting an
 * empty list is still valid and produces `[]`.
 */
export function exportEndpoints(
  endpoints: EndpointInput[],
  fileName = "geoproximity-endpoints.json",
): void {
  const blob = new Blob([serializeEndpoints(endpoints)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
