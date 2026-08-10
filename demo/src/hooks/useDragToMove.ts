// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { EndpointInput } from "geoproximity-map";

/**
 * Places a draggable marker on each Coordinate endpoint while `enabled`, and
 * reports the new position on drag end. Only Coordinate endpoints are draggable
 *
 * `anchor: "center"` overrides maplibre's default bottom anchor so the pin sits
 * on the coordinate itself, rather than above it.
 */
export function useDragToMove(
  map: maplibregl.Map | null,
  endpoints: EndpointInput[],
  enabled: boolean,
  onMove: (index: number, coord: { lat: number; lon: number }) => void,
) {
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    if (!map || !enabled) return;

    const markers: maplibregl.Marker[] = [];
    endpoints.forEach((endpoint, index) => {
      if (endpoint.type !== "Coordinate") return;
      const marker = new maplibregl.Marker({
        draggable: true,
        anchor: "center",
      })
        .setLngLat([endpoint.lon, endpoint.lat])
        .addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLngLat();
        onMoveRef.current(index, {
          lat: Math.round(lat * 100) / 100,
          lon: Math.round(lng * 100) / 100,
        });
      });
      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [map, endpoints, enabled]);
}
