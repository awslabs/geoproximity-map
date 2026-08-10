// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import type { EndpointInput } from "geoproximity-map";
import { TYPE_LABELS } from "../utils/endpointLabels";

/** One card per endpoint: type on the first line, details on the second. */
export function EndpointList({
  endpoints,
  onDelete,
}: {
  endpoints: EndpointInput[];
  onDelete: (index: number) => void;
}) {
  if (endpoints.length === 0) {
    return (
      <Box color="text-status-inactive" fontSize="body-m">
        No endpoints yet.
      </Box>
    );
  }

  return (
    <SpaceBetween size="xs">
      {endpoints.map((endpoint, index) => {
        const bias = endpoint.bias ?? 0;
        const details =
          endpoint.type === "Coordinate"
            ? `lat ${endpoint.lat}, lon ${endpoint.lon} · bias ${bias}`
            : `${endpoint.name} · bias ${bias}`;
        return (
          <Container key={index}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <SpaceBetween size="xxxs">
                <Box variant="strong" fontSize="body-s">
                  {index + 1}. {TYPE_LABELS[endpoint.type]}
                </Box>
                <Box fontSize="body-s">{details}</Box>
              </SpaceBetween>
              <Button
                variant="icon"
                iconName="remove"
                ariaLabel="Delete endpoint"
                onClick={() => onDelete(index)}
              />
            </div>
          </Container>
        );
      })}
    </SpaceBetween>
  );
}
