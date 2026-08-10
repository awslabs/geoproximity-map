// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Slider from "@cloudscape-design/components/slider";
import type { EndpointInput } from "geoproximity-map";
import { TYPE_LABELS } from "../utils/endpointLabels";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <Box variant="awsui-key-label">{label}</Box>
      <Box>{value}</Box>
    </div>
  );
}

/**
 * Cloudscape content for the endpoint info popup, with a bias slider.
 *
 * The slider position is held in local state so dragging updates only this
 * popup (cheap). The expensive parent update (which redraws the map) is
 * committed only on release — pointer-up or key-up — not on every tick.
 */
export function EndpointInfo({
  endpoint,
  onBiasChange,
}: {
  endpoint: EndpointInput;
  onBiasChange: (bias: number) => void;
}) {
  const [bias, setBias] = useState(endpoint.bias ?? 0);

  return (
    <SpaceBetween size="xs">
      <Box variant="strong">{TYPE_LABELS[endpoint.type]}</Box>
      {endpoint.type === "Coordinate" ? (
        <>
          <Row label="Latitude" value={endpoint.lat} />
          <Row label="Longitude" value={endpoint.lon} />
        </>
      ) : (
        <Row label="Name" value={endpoint.name} />
      )}
      <Row label="Bias" value={bias} />
      <div
        style={{ minWidth: 200 }}
        onPointerUp={() => onBiasChange(bias)}
        onKeyUp={() => onBiasChange(bias)}
      >
        <Slider
          value={bias}
          min={-99}
          max={99}
          referenceValues={[0]}
          onChange={({ detail }) => setBias(detail.value)}
        />
      </div>
    </SpaceBetween>
  );
}
