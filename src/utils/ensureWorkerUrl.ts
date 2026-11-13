// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getWorkerUrl, setWorkerUrl } from "maplibre-gl";
import workerSource from "maplibre-gl/dist/maplibre-gl-worker.mjs?raw";

let bundledWorkerUrl: string | undefined;

/**
 * Points MapLibre at the worker bundled with this package, unless the app
 * already called `setWorkerUrl`.
 */
export function ensureWorkerUrl(): void {
  if (getWorkerUrl()) {
    return;
  }
  bundledWorkerUrl ??= URL.createObjectURL(
    new Blob([workerSource], { type: "text/javascript" }),
  );
  setWorkerUrl(bundledWorkerUrl);
}
