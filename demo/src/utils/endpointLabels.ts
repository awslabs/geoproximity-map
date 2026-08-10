// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { EndpointInput } from "geoproximity-map";

/** Human-readable label for each endpoint type. */
export const TYPE_LABELS: Record<EndpointInput["type"], string> = {
  Region: "AWS Region",
  LocalZoneGroup: "AWS Local Zone",
  Coordinate: "Coordinate",
  Custom: "Custom",
};
