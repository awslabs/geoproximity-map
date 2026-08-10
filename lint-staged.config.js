// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// One root ESLint config (with per-area overrides) lints both the component and
// the demo, so staged files route through a single eslint + prettier pass.
export default {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,cjs,json,md,scss,css}": "prettier --write",
};
