// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { EndpointInput } from "geoproximity-map";
import { findNearestEndpoint } from "../utils/findNearestEndpoint";

/**
 * Routes a map click by position so inspect and add never conflict. Clicking an
 * endpoint opens (or switches to) its info popup; clicking empty map closes an
 * open popup, or adds a Coordinate endpoint when `addEnabled`. Returns the
 * selected endpoint's index and popup container for the caller to portal into.
 */
export function useMapClick(
  map: maplibregl.Map | null,
  endpoints: EndpointInput[],
  addEnabled: boolean,
  onAdd: (endpoint: EndpointInput) => void,
) {
  const [selected, setSelected] = useState<{
    index: number;
    container: HTMLElement;
  } | null>(null);

  const endpointsRef = useRef(endpoints);
  const onAddRef = useRef(onAdd);
  useEffect(() => {
    endpointsRef.current = endpoints;
    onAddRef.current = onAdd;
  }, [endpoints, onAdd]);

  useEffect(() => {
    if (!map) return;

    let popup: maplibregl.Popup | null = null;

    const clearPopup = () => {
      popup?.remove();
      popup = null;
      setSelected(null);
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const hit = findNearestEndpoint(map, endpointsRef.current, e.point);

      // Empty map with a popup open: this click only dismisses it.
      if (!hit && popup) {
        clearPopup();
        return;
      }

      // Empty map, nothing open: add an endpoint when add mode is on.
      if (!hit) {
        if (addEnabled) {
          onAddRef.current({
            type: "Coordinate",
            lat: Math.round(e.lngLat.lat * 100) / 100,
            lon: Math.round(e.lngLat.lng * 100) / 100,
          });
        }
        return;
      }

      // Clicked an endpoint: open (or switch to) its info popup.
      popup?.remove();
      const container = document.createElement("div");
      popup = new maplibregl.Popup({
        className: "endpoint-info-popup",
        closeButton: true,
        closeOnClick: false,
        offset: 12,
      })
        .setLngLat(hit.lngLat)
        .setDOMContent(container)
        .addTo(map);
      popup.on("close", () => setSelected(null));
      setSelected({ index: hit.index, container });
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
      clearPopup();
    };
  }, [map, addEnabled]);

  return selected;
}
