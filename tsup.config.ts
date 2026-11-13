// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { defineConfig } from "tsup";

const require = createRequire(import.meta.url);

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  injectStyle: true,
  external: ["react", "react-dom", "maplibre-gl"],
  // Inline `?raw` imports (the MapLibre worker) as strings, matching Vite's `?raw`.
  noExternal: [/\?raw$/],
  esbuildPlugins: [
    {
      name: "raw",
      setup(build) {
        build.onResolve({ filter: /\?raw$/ }, (args) => ({
          path: require.resolve(args.path.slice(0, -"?raw".length)),
          namespace: "raw",
        }));
        build.onLoad({ filter: /.*/, namespace: "raw" }, (args) => ({
          contents: readFileSync(args.path, "utf8"),
          loader: "text",
        }));
      },
    },
  ],
});
