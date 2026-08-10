// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The component is linked via `file:..`, so dedupe these to a single copy —
  // otherwise React resolving to two copies triggers "Invalid hook call".
  resolve: {
    dedupe: ["react", "react-dom", "maplibre-gl"],
  },
  server: {
    port: 5173,
    open: true,
  },
});
