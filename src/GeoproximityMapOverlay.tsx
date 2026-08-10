// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import { GeoproximityMapData } from "./types";
import maplibregl, { Offset, PopupOptions } from "maplibre-gl";

import {
  computeGeoproximityRegionsForGrid,
  generateEndPointArray,
  generateGeoJsonBorder,
  generateGeoJsonEndpoints,
  generateGeoJsonPolygon,
  generateTestPointGrid,
  GEOPROXIMITY_CONSTANTS,
  getLowerLineMidpoint,
  getMidpointCalculationConstants,
  getUpperLineMidpoint,
  updateLowerRightPolygonVertex,
  updateUpperRightPolygonVertex,
  validateInput,
} from "./utils/generateGeoJson";
import {
  getColorAtIndex,
  getTextColorAtIndex,
} from "./utils/getGeoproximityMapColors";

interface GeoproximityMapOverlayProps {
  map: maplibregl.Map;
  data: GeoproximityMapData;
}

const OPACITY_ON_HOVER = 0.4; // Defines the opacity of the geoproximity polygons when they are hovered over
const DEFAULT_OPACITY = 0.25; // Defines the opacity of the geoproximity polygons when they are not hovered over
const ANTIMERIDIAN_SHIFT = 1.5; // MapLibre doesn't handle drawing around the 180th meridian well, so we add some extra length to the left side of the first polygon in each row to create a seamless transition
const BORDER_WIDTH = 3; // Defines the width of the geoproximity region borders
const BORDER_COLOR = "#555"; // Defines the color of the geoproximity region borders
const DRAW_ACROSS_MERIDIAN_THRESHOLD = 320; // MapLibre has no inherent way of telling whether it should draw a horizontal line around the globe, or if it should cross the meridian. This defines a minimum length at which MapLibre should always draw across the meridian
const NO_OUTLINE_COLOR = "rgba(0, 0, 0, 0)"; // Defines that the outlines of each individual polygon shouldn't be visible
const ENDPOINT_LABEL_SETTINGS: PopupOptions = {
  // Constant settings that should be applied when endpoint label is created
  closeButton: false,
  closeOnClick: false,
  anchor: "center" as const, // Defines where the numeric label gets anchored to the endpoint on the map. Options are defined in the MapLibre GL JS documentation
  offset: [-10, 0] as Offset, // Defines how the label is offset from the endpoint in [x, y] pixels (- is left/up)
};

export const GeoproximityMapOverlay = ({
  map,
  data,
}: GeoproximityMapOverlayProps) => {
  const { lats, lons, biases, endpointLabels } = data;

  const geoProxPolygons = useRef(new Map());
  const geoProxPolygonBorders = useRef(new Map());
  const layerIds = useRef(new Map()); // Map that contains all of the ids of layers (endpoints, polygons, borders, etc.) on the map for quick access
  const hoveredRegion = useRef(new Map());
  const endpointLabelsMap = useRef(new Map());

  /**
   * Generate the geoproximity regions to be displayed on the map
   */
  const initOverlays = (endpoints: any[]) => {
    // Create a grid of points to test and determine which region each point in the grid belongs to
    const testPoints = generateTestPointGrid();
    const tempEndpoints = generateEndPointArray(endpoints);
    computeGeoproximityRegionsForGrid(testPoints, tempEndpoints);

    // Combine adjacent grid squares of the same color horizontally to reduce rendering times
    // Also perform more precise calculations on border points to smooth the shape of the polygons
    let currentPolygonId = testPoints[0][0].endpointId;
    let leftLngNewLine =
      testPoints[0][0].lng - GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    let upperLeftLat =
      testPoints[0][0].lat + GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    let upperLeft = new maplibregl.LngLat(leftLngNewLine, upperLeftLat);
    let lowerLeftLat =
      testPoints[0][0].lat - GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
    let lowerLeft = new maplibregl.LngLat(leftLngNewLine, lowerLeftLat);

    let lowerRight = updateLowerRightPolygonVertex(0, 0, testPoints);
    let upperRight = updateLowerRightPolygonVertex(0, 0, testPoints);
    let shift;
    let overreachFactor;
    let midpointCalculationConstants;
    let approximatePolygonLengthDegrees;
    let approximatePolygonLengthGridUnits;
    let idAtSquareIJ;
    let idAcrossAntimeridian;
    let corners;
    let linePoints;
    for (let i = 0; i < testPoints.length; i++) {
      for (let j = 0; j < testPoints[i].length; j++) {
        idAtSquareIJ = testPoints[i][j].endpointId;
        if (j === 0) {
          // Since we are on a new latitude, draw the current polygon and start creating a new one. For simplicity of drawing the polygons, they are only combined into horizontal strips using 4 vertices in this implementation
          corners = {
            upperLeft: upperLeft,
            upperRight: upperRight,
            lowerRight: lowerRight,
            lowerLeft: lowerLeft,
          };
          generateGeoJsonPolygon(
            corners,
            currentPolygonId,
            geoProxPolygons.current,
          );
          // Reinitialize the vertices to be the corners of the current grid point
          leftLngNewLine =
            testPoints[i][j].lng -
            ANTIMERIDIAN_SHIFT * GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH;
          upperLeftLat =
            testPoints[i][j].lat +
            GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
          upperLeft = new maplibregl.LngLat(leftLngNewLine, upperLeftLat);
          lowerLeftLat =
            testPoints[i][j].lat -
            GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH / 2;
          lowerLeft = new maplibregl.LngLat(leftLngNewLine, lowerLeftLat);
          upperRight = updateUpperRightPolygonVertex(i, j, testPoints);
          lowerRight = updateLowerRightPolygonVertex(i, j, testPoints);
          // If the color is different on the other side of the antimeridian, draw a border between the two
          idAcrossAntimeridian =
            testPoints[i][testPoints[i].length - 1].endpointId;
          linePoints = {
            upperPoint: upperLeft,
            lowerPoint: lowerLeft,
          };
          if (idAtSquareIJ !== idAcrossAntimeridian) {
            generateGeoJsonBorder(
              linePoints,
              [idAtSquareIJ, idAcrossAntimeridian],
              geoProxPolygonBorders.current,
            );
          }
          currentPolygonId = idAtSquareIJ;
        } else if (idAtSquareIJ !== currentPolygonId) {
          // Since it is at a border point where the color is changing, determine the precise transition point, draw the polygon, and start a new one
          // Estimate the length of the polygon that is being generated to approximate how steep the surrounding polygon borders are. Estimation is approximate number of grid squares to the midpoint of the polygon
          approximatePolygonLengthDegrees = Math.min(
            upperRight.lng - upperLeft.lng,
            lowerRight.lng - lowerLeft.lng,
          );
          approximatePolygonLengthGridUnits = Math.floor(
            approximatePolygonLengthDegrees /
              (2 * GEOPROXIMITY_CONSTANTS.GRID_SQUARE_LENGTH),
          );
          // Use the approximate length to compute how far the left testpoint should be from the right testpoint, and how far the midpoint calculation should search beyond the right testpoint
          midpointCalculationConstants = getMidpointCalculationConstants(
            i,
            j,
            testPoints,
            approximatePolygonLengthGridUnits,
          );
          shift = midpointCalculationConstants.shift;
          overreachFactor = midpointCalculationConstants.overreachFactor;
          // Get the points where the upper line of the polygon changes color and the where the lower line of the polygon changes color; use the defined endpoints to draw a polygon and border
          lowerRight = getLowerLineMidpoint(
            i,
            j,
            shift,
            overreachFactor,
            testPoints,
          );
          upperRight = getUpperLineMidpoint(
            i,
            j,
            shift,
            overreachFactor,
            testPoints,
          );
          corners = {
            upperLeft: upperLeft,
            upperRight: upperRight,
            lowerRight: lowerRight,
            lowerLeft: lowerLeft,
          };
          linePoints = {
            upperPoint: upperRight,
            lowerPoint: lowerRight,
          };
          generateGeoJsonPolygon(
            corners,
            currentPolygonId,
            geoProxPolygons.current,
          );
          generateGeoJsonBorder(
            linePoints,
            [currentPolygonId, idAtSquareIJ],
            geoProxPolygonBorders.current,
          );
          // Reinitialize the vertices for the next polygon, using the right border of the last polygon as the left border of the new polygon
          upperLeft = upperRight;
          lowerLeft = lowerRight;
          upperRight = updateUpperRightPolygonVertex(i, j, testPoints);
          lowerRight = updateLowerRightPolygonVertex(i, j, testPoints);
          currentPolygonId = idAtSquareIJ;
        } else {
          // Otherwise, update the current best estimate of the right side of the polygon and don't draw anything
          upperRight = updateUpperRightPolygonVertex(i, j, testPoints);
          lowerRight = updateLowerRightPolygonVertex(i, j, testPoints);
        }
      }
    }

    // Draw the endpoints, the geoproximity polygons, and the borders of the geoproximity polygons
    drawEndpoints(endpoints);
    drawGeoProximityPolygons();
    generateTopGeoproximityBorders();
    drawGeoProximityBorders();
  };

  /**
   * Draw the endpoints that have been input by the user
   */
  const drawEndpoints = (endpoints: any[]) => {
    for (const endpoint of endpoints) {
      map.addLayer(endpoint);
      const labelTextColor = getTextColorAtIndex(endpoint.id - 1);
      ENDPOINT_LABEL_SETTINGS.className = labelTextColor;
      const popup = new maplibregl.Popup(ENDPOINT_LABEL_SETTINGS)
        .setText(endpoint.label)
        .setLngLat(endpoint.source.data.geometry.coordinates)
        .addTo(map);
      endpointLabelsMap.current.set(endpoint.id, popup);
    }
  };

  /**
   * Draw the polygons that make up the different geoproximity regions on the map
   */
  const drawGeoProximityPolygons = () => {
    geoProxPolygons.current.forEach((value, endpointId) => {
      const sourceName = "GeoProxPolygon" + endpointId;
      const color = getColorAtIndex(Number(endpointId) - 1);
      layerIds.current.set(sourceName, true);
      map.addSource(sourceName, geoProxPolygons.current.get(endpointId));
      map.addLayer({
        id: sourceName,
        type: "fill",
        source: sourceName,
        paint: {
          "fill-color": color,
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            OPACITY_ON_HOVER,
            DEFAULT_OPACITY,
          ],
          "fill-outline-color": NO_OUTLINE_COLOR,
        },
      });

      // Configure the geoproximity polygons so that they will be highlighted when the user hovers over them
      map.on("mousemove", sourceName, (e) => {
        const features = map.queryRenderedFeatures(e.point);
        // add for now to remove the noise warnings
        if (features.length == 0) return;
        if (features[0].id == null) return;
        hoveredRegion.current.forEach((value, endpointId) => {
          map.setFeatureState(
            { source: endpointId, id: value },
            { hover: false },
          );
        });
        map.setFeatureState(
          { source: features[0].source, id: features[0].id },
          { hover: true },
        );
        hoveredRegion.current.set(features[0].source, features[0].id);
      });
    });
  };

  /**
   * Draw the borders for each geoproximity polygon on the map
   */
  const drawGeoProximityBorders = () => {
    geoProxPolygonBorders.current.forEach((value, endpointId) => {
      const sourceName = "Borders" + endpointId;
      layerIds.current.set(sourceName, true);
      map.addSource(sourceName, geoProxPolygonBorders.current.get(endpointId));
      map.addLayer({
        id: sourceName,
        type: "line",
        source: sourceName,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": BORDER_COLOR,
          "line-width": BORDER_WIDTH,
          // "line-dasharray": LINE_DASH_PATTERN,
        },
      });
    });
  };

  /**
   * Generates a border line for the top and bottom of any shape that requires one. This will always occur between the last and second
   * to last border line segments (top line), and the first and and second border line segments (bottom line)
   * Note that because of the way border lines are constructed, the first point is always the point at the greater latitude
   * This means that when we check for a top line, we check to see if both of the first points are on the same latitude
   * Likewise, since the second point is always at the lower latitude, we check the second points when looking for a bottom line
   */
  const generateTopGeoproximityBorders = () => {
    geoProxPolygonBorders.current.forEach((value, endpointId) => {
      const borders = value.data.features;
      const initialNumberOfBorders = borders.length;
      let lastBorderPoint;
      let secondTolastBorderPoint;
      let firstBorderPoint;
      let secondBorderPoint;
      let linePoints;
      if (initialNumberOfBorders > 1) {
        const lastBorderPointLat =
          borders[initialNumberOfBorders - 1].geometry.coordinates[0][1];
        const secondToLastBorderPointLat =
          borders[initialNumberOfBorders - 2].geometry.coordinates[0][1];

        // If the second to last border segment and the last border segment have a point on the same latitude
        if (lastBorderPointLat === secondToLastBorderPointLat) {
          lastBorderPoint = new maplibregl.LngLat(
            borders[initialNumberOfBorders - 1].geometry.coordinates[0][0],
            lastBorderPointLat,
          );
          secondTolastBorderPoint = new maplibregl.LngLat(
            borders[initialNumberOfBorders - 2].geometry.coordinates[0][0],
            secondToLastBorderPointLat,
          );

          // Checks to see if the line should be drawn across the antimeridian
          if (
            lastBorderPoint.lng <= GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE &&
            secondTolastBorderPoint.lng - lastBorderPoint.lng >
              DRAW_ACROSS_MERIDIAN_THRESHOLD
          ) {
            lastBorderPoint.lng =
              lastBorderPoint.lng + 2 * GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE;
          } else if (
            secondTolastBorderPoint.lng <=
              GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE &&
            lastBorderPoint.lng - secondTolastBorderPoint.lng >
              DRAW_ACROSS_MERIDIAN_THRESHOLD
          ) {
            secondTolastBorderPoint.lng =
              secondTolastBorderPoint.lng +
              2 * GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE;
          }

          linePoints = {
            upperPoint: secondTolastBorderPoint,
            lowerPoint: lastBorderPoint,
          };
          generateGeoJsonBorder(
            linePoints,
            [endpointId],
            geoProxPolygonBorders.current,
          );
        }

        const firstBorderPointLat = borders[0].geometry.coordinates[1][1];
        const secondBorderPointLat = borders[1].geometry.coordinates[1][1];
        // If the first and the second border segment have a point on the same latitude
        if (firstBorderPointLat === secondBorderPointLat) {
          firstBorderPoint = new maplibregl.LngLat(
            borders[0].geometry.coordinates[1][0],
            firstBorderPointLat,
          );
          secondBorderPoint = new maplibregl.LngLat(
            borders[1].geometry.coordinates[1][0],
            secondBorderPointLat,
          );

          // Checks to see if the line should be drawn across the antimeridian
          if (
            firstBorderPoint.lng <= GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE &&
            secondBorderPoint.lng - firstBorderPoint.lng >
              DRAW_ACROSS_MERIDIAN_THRESHOLD
          ) {
            firstBorderPoint.lng =
              firstBorderPoint.lng + 2 * GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE;
          } else if (
            secondBorderPoint.lng <= GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE &&
            firstBorderPoint.lng - secondBorderPoint.lng >
              DRAW_ACROSS_MERIDIAN_THRESHOLD
          ) {
            secondBorderPoint.lng =
              secondBorderPoint.lng + 2 * GEOPROXIMITY_CONSTANTS.MAX_LONGITUDE;
          }
          linePoints = {
            upperPoint: secondBorderPoint,
            lowerPoint: firstBorderPoint,
          };
          generateGeoJsonBorder(
            linePoints,
            [endpointId],
            geoProxPolygonBorders.current,
          );
        }
      }
    });
  };

  useEffect(() => {
    if (validateInput(lats, lons, biases)) {
      // Remove all layers and geojson sources that may already exist on the map
      map.getStyle().layers.forEach((layer) => {
        if (layerIds.current.has(layer.id)) {
          map.removeLayer(layer.id);
        }
      });
      layerIds.current.forEach((value, layerId) => {
        map.removeSource(layerId);
      });
      endpointLabelsMap.current.forEach((endpointLabel, endpointId) => {
        endpointLabel.remove();
      });

      // Reset all of the variables that are needed to create a geoproximity map
      geoProxPolygons.current = new Map();
      hoveredRegion.current = new Map();
      geoProxPolygonBorders.current = new Map();
      layerIds.current = new Map();
      endpointLabelsMap.current = new Map();

      // Only try to draw polygons on the map if there is data entered
      if (lats.length !== 0 && lons.length !== 0 && biases.length !== 0) {
        const endpoints = generateGeoJsonEndpoints(
          lats,
          lons,
          biases,
          endpointLabels,
          geoProxPolygons.current,
          geoProxPolygonBorders.current,
          layerIds.current,
        );
        initOverlays(endpoints);
      }
    }
  }, [data]);

  return null;
};
