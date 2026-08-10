// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Constant list of colors that gets cycled through in order to assign colors to geoproximity regions
 */
// TODO - adjust colors for dark mode
const GEOPROXIMITY_COLORS = [
  { color: "#0000FF", textColor: "popup-white" }, // blue
  { color: "#800000", textColor: "popup-white" }, // maroon
  { color: "#FFD700", textColor: "popup-black" }, // gold
  { color: "#008080", textColor: "popup-white" }, // teal
  { color: "#BDB76B", textColor: "popup-white" }, // darkkhaki
  { color: "#7FFFD4", textColor: "popup-black" }, // aquamarine
  { color: "#000000", textColor: "popup-white" }, // black
  { color: "#008000", textColor: "popup-white" }, // green
  { color: "#00FF00", textColor: "popup-black" }, // lime
  { color: "#00BFFF", textColor: "popup-white" }, // deep sky blue
  { color: "#8B4513", textColor: "popup-white" }, // brown
  { color: "#FF00FF", textColor: "popup-white" }, // fuchsia
  { color: "#FFA500", textColor: "popup-white" }, // orange
  { color: "#4682B4", textColor: "popup-white" }, // steel blue
  { color: "#00FFFF", textColor: "popup-black" }, // aqua
];

export const getColorAtIndex = (boxIndex: number) => {
  return GEOPROXIMITY_COLORS[boxIndex % GEOPROXIMITY_COLORS.length].color;
};

export const getTextColorAtIndex = (boxIndex: number) => {
  return GEOPROXIMITY_COLORS[boxIndex % GEOPROXIMITY_COLORS.length].textColor;
};
