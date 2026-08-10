// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from "react";
import { EndpointInput, GeoproximityMapData } from "./types";
import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import "./GeoproximityMap.css";
import { GeoproximityMapOverlay } from "./GeoproximityMapOverlay";
import { processEndpoints } from "./utils/processEndpoints";
import { validateStyleUrl } from "./utils/validateStyleUrl";

interface GeoproximityMapInternalProps {
  data: GeoproximityMapData;
  styleUrl: string;
  onMapReady?: (map: maplibregl.Map) => void;
}

interface GeoproximityMapProps {
  endpoints: EndpointInput[];
  styleUrl: string;
  onMapReady?: (map: maplibregl.Map) => void;
}

const GeoproximityMapInternal = ({
  data,
  styleUrl,
  onMapReady,
}: GeoproximityMapInternalProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Kept out of the init effect's deps so an unstable (e.g. inline) callback
  // does not rebuild the whole map on every render.
  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: [0, 0],
        zoom: 1,
        maxZoom: 6,
        minZoom: 1,
        attributionControl: false,
      });

      mapRef.current.dragRotate.disable();
      mapRef.current.keyboard.disable();
      mapRef.current.addControl(
        new maplibregl.NavigationControl({
          showZoom: true,
          showCompass: false,
        }),
      );

      mapRef.current.on("load", () => {
        setIsMapLoaded(true);
        onMapReadyRef.current?.(mapRef.current!);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapLoaded(false);
      }
    };
  }, [styleUrl]);

  // call resize after map initialization to ensure that it takes the parent container's dimensions
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, [mapRef.current]);

  return (
    <div className="map-container">
      <div className="maplibregl-map" ref={mapContainerRef} />
      {isMapLoaded && mapRef.current && (
        <GeoproximityMapOverlay map={mapRef.current} data={data} />
      )}
    </div>
  );
};

export const GeoproximityMap = ({
  endpoints,
  styleUrl,
  onMapReady,
}: GeoproximityMapProps) => {
  // Memoized so the overlay (keyed on `data`) only redraws when endpoints
  // change, not on every parent re-render. Must run before the early return
  // to satisfy the rules of hooks.
  const data = useMemo(() => processEndpoints(endpoints), [endpoints]);
  const validatedUrl = validateStyleUrl(styleUrl);
  if (!validatedUrl) return null;
  return (
    <GeoproximityMapInternal
      data={data}
      styleUrl={validatedUrl}
      onMapReady={onMapReady}
    />
  );
};
