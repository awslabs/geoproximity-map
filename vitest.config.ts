// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    testTimeout: 20000,
    exclude: [...configDefaults.exclude, "**/build/**", "**/dist/**"],
    silent: "passed-only",
    reporters: ["default"],
    coverage: {
      include: ["src/**/*.ts"],
      skipFull: true,
      reporter: ["text-summary", "html", "cobertura"],
      reportsDirectory: "coverage",
    },
  },
});
