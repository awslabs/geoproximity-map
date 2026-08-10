// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import type { SelectProps } from "@cloudscape-design/components/select";
import type { EndpointInput } from "geoproximity-map";
import regionsData from "../data/regions.json";
import localZonesData from "../data/local-zones.json";

const LOCATION_TYPES: SelectProps.Option[] = [
  { label: "AWS Region", value: "Region" },
  { label: "AWS Local Zone", value: "LocalZoneGroup" },
  { label: "Coordinate", value: "Coordinate" },
];

const REGION_OPTIONS: SelectProps.Option[] = Object.keys(regionsData).map(
  (name) => ({ label: name, value: name }),
);
const LOCAL_ZONE_OPTIONS: SelectProps.Option[] = Object.keys(
  localZonesData,
).map((name) => ({ label: name, value: name }));

/**
 * Modal for adding a single endpoint:
 * pick a location type, then choose a name (Region / Local Zone) or enter
 * coordinates, plus a bias value.
 */
export function AddEndpointModal({
  visible,
  onAdd,
  onClose,
}: {
  visible: boolean;
  onAdd: (endpoint: EndpointInput) => void;
  onClose: () => void;
}) {
  const [locationType, setLocationType] = useState<SelectProps.Option>(
    LOCATION_TYPES[0],
  );
  const [name, setName] = useState<SelectProps.Option | null>(null);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [bias, setBias] = useState("0");

  const type = locationType.value as EndpointInput["type"];
  const isCoordinate = type === "Coordinate";
  const nameOptions = type === "Region" ? REGION_OPTIONS : LOCAL_ZONE_OPTIONS;

  const reset = () => {
    setLocationType(LOCATION_TYPES[0]);
    setName(null);
    setLat("");
    setLon("");
    setBias("0");
  };

  const close = () => {
    reset();
    onClose();
  };

  const biasValue = Number(bias);
  const biasValid =
    Number.isInteger(biasValue) && biasValue >= -99 && biasValue <= 99;
  const latValue = Number(lat);
  const latValid =
    lat.trim() !== "" &&
    Number.isFinite(latValue) &&
    latValue >= -90 &&
    latValue <= 90;
  const lonValue = Number(lon);
  const lonValid =
    lon.trim() !== "" &&
    Number.isFinite(lonValue) &&
    lonValue >= -180 &&
    lonValue <= 180;
  const canAdd =
    biasValid && (isCoordinate ? latValid && lonValid : name !== null);

  const handleAdd = () => {
    if (!canAdd) return;
    const endpoint: EndpointInput = isCoordinate
      ? {
          type: "Coordinate",
          lat: latValue,
          lon: lonValue,
          bias: biasValue,
        }
      : { type, name: name!.value as string, bias: biasValue };
    onAdd(endpoint);
    close();
  };

  return (
    <Modal
      visible={visible}
      onDismiss={close}
      header="Add endpoint"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!canAdd} onClick={handleAdd}>
              Add
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <FormField label="Location type">
          <Select
            selectedOption={locationType}
            onChange={({ detail }) => {
              setLocationType(detail.selectedOption);
              setName(null);
            }}
            options={LOCATION_TYPES}
          />
        </FormField>

        {isCoordinate ? (
          <>
            <FormField
              label="Latitude"
              errorText={
                lat !== "" && !latValid
                  ? "Latitude must be a number from -90 to 90"
                  : undefined
              }
            >
              <Input
                type="number"
                value={lat}
                onChange={({ detail }) => setLat(detail.value)}
                placeholder="-90 to 90"
              />
            </FormField>
            <FormField
              label="Longitude"
              errorText={
                lon !== "" && !lonValid
                  ? "Longitude must be a number from -180 to 180"
                  : undefined
              }
            >
              <Input
                type="number"
                value={lon}
                onChange={({ detail }) => setLon(detail.value)}
                placeholder="-180 to 180"
              />
            </FormField>
          </>
        ) : (
          <FormField label="Name">
            <Select
              selectedOption={name}
              onChange={({ detail }) => setName(detail.selectedOption)}
              options={nameOptions}
              filteringType="auto"
              placeholder="Choose a location"
              empty="No matches"
            />
          </FormField>
        )}

        <FormField
          label="Bias"
          errorText={
            bias !== "" && !biasValid
              ? "Bias must be an integer from -99 to 99"
              : undefined
          }
        >
          <Input
            type="number"
            value={bias}
            onChange={({ detail }) => setBias(detail.value)}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
