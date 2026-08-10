// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import type maplibregl from "maplibre-gl";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import CodeView from "@cloudscape-design/code-view/code-view";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Toggle from "@cloudscape-design/components/toggle";
import typescriptHighlight from "@cloudscape-design/code-view/highlight/typescript";
import "@cloudscape-design/global-styles/index.css";
import { GeoproximityMap } from "geoproximity-map";
import type { EndpointInput } from "geoproximity-map";
import { useDragToMove } from "./hooks/useDragToMove";
import { useMapClick } from "./hooks/useMapClick";
import { EndpointInfo } from "./components/EndpointInfo";
import { EndpointList } from "./components/EndpointList";
import { AddEndpointModal } from "./components/AddEndpointModal";
import { exportEndpoints } from "./utils/exportEndpoints";
import "./demo.css";

const apiKey = import.meta.env.VITE_AMAZON_LOCATION_KEY;
const region = import.meta.env.VITE_AWS_REGION ?? "us-east-1";
const mapStyle = import.meta.env.VITE_MAP_STYLE ?? "Monochrome";

if (!apiKey) {
  throw new Error(
    "Missing VITE_AMAZON_LOCATION_KEY. Create demo/.env with VITE_AMAZON_LOCATION_KEY=<your-key>.",
  );
}

const styleUrl = `https://maps.geo.${region}.amazonaws.com/v2/styles/${mapStyle}/descriptor?key=${apiKey}&color-scheme=Light`;

/** Renders a single endpoint as a line inside the generated `endpoints` array. */
function formatEndpoint(endpoint: EndpointInput): string {
  const bias = endpoint.bias ?? 0;
  if (endpoint.type === "Coordinate") {
    return `      { type: "Coordinate", lat: ${endpoint.lat}, lon: ${endpoint.lon}, bias: ${bias} },`;
  }
  return `      { type: "${endpoint.type}", name: "${endpoint.name}", bias: ${bias} },`;
}

/**
 * Builds a copy-pasteable `<GeoproximityMap>` snippet that mirrors the
 * endpoints currently configured in the demo, matching the usage examples in
 * the package README.
 */
function generateCode(endpoints: EndpointInput[]): string {
  const endpointsBlock =
    endpoints.length === 0
      ? "      endpoints={[]}"
      : `      endpoints={[\n${endpoints.map(formatEndpoint).join("\n")}\n    ]}`;
  return [
    'import { GeoproximityMap } from "geoproximity-map";',
    "",
    "// Replace with your Amazon Location Service style URL",
    "// See: https://docs.aws.amazon.com/location/latest/developerguide/map-concepts.html",
    'const styleUrl = "https://maps.geo.<region>.amazonaws.com/v2/styles/<style>/descriptor?key=<your-key>";',
    "",
    "export default () => {",
    "  return (",
    "    <GeoproximityMap",
    "      styleUrl={styleUrl}",
    endpointsBlock,
    "    />",
    "  );",
    "};",
  ].join("\n");
}

function App() {
  const [endpoints, setEndpoints] = useState<EndpointInput[]>([]);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [dragToMove, setDragToMove] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedEndpoint = useMapClick(map, endpoints, clickToAdd, (endpoint) =>
    setEndpoints((prev) => [...prev, endpoint]),
  );

  useDragToMove(map, endpoints, dragToMove, (index, coord) =>
    setEndpoints((prev) =>
      prev.map((endpoint, i) =>
        i === index
          ? { ...endpoint, lat: coord.lat, lon: coord.lon }
          : endpoint,
      ),
    ),
  );

  const code = useMemo(() => generateCode(endpoints), [endpoints]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", padding: 24 }}>
      <ContentLayout
        header={
          <Header
            variant="h1"
            description="Interactive sandbox for the geoproximity-map React component. Edit the endpoints below to see them rendered live, alongside the equivalent component code."
          >
            GeoproximityMap
          </Header>
        }
      >
        <Grid gridDefinition={[{ colspan: 4 }, { colspan: 8 }]}>
          <SpaceBetween size="l">
            <Container header={<Header variant="h2">Configuration</Header>}>
              <ColumnLayout columns={2} variant="text-grid">
                <SpaceBetween size="s">
                  <Box variant="h4">Endpoints</Box>
                  <div style={{ maxHeight: 260, overflow: "auto" }}>
                    <EndpointList
                      endpoints={endpoints}
                      onDelete={(index) =>
                        setEndpoints((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    />
                  </div>
                  <SpaceBetween size="xs" direction="horizontal">
                    <Button
                      iconName="add-plus"
                      onClick={() => setModalVisible(true)}
                    >
                      Add endpoint
                    </Button>
                    <Button
                      iconName="download"
                      disabled={endpoints.length === 0}
                      onClick={() => exportEndpoints(endpoints)}
                    >
                      Export
                    </Button>
                  </SpaceBetween>
                </SpaceBetween>
                <SpaceBetween size="s">
                  <Box variant="h4">Map interactions</Box>
                  <Toggle
                    checked={clickToAdd}
                    onChange={({ detail }) => setClickToAdd(detail.checked)}
                  >
                    Click map to add endpoint
                  </Toggle>
                  <Toggle
                    checked={dragToMove}
                    onChange={({ detail }) => setDragToMove(detail.checked)}
                  >
                    Drag endpoints to reposition
                  </Toggle>
                </SpaceBetween>
              </ColumnLayout>
            </Container>

            <Container
              header={
                <Header
                  variant="h2"
                  actions={
                    <Button
                      iconName={copied ? "check" : "copy"}
                      onClick={handleCopy}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  }
                >
                  Code
                </Header>
              }
            >
              <CodeView content={code} highlight={typescriptHighlight} />
            </Container>
          </SpaceBetween>

          <Container header={<Header variant="h2">Preview</Header>}>
            <div style={{ position: "relative" }}>
              <GeoproximityMap
                styleUrl={styleUrl}
                endpoints={endpoints}
                onMapReady={setMap}
              />
              {selectedEndpoint &&
                endpoints[selectedEndpoint.index] &&
                createPortal(
                  <EndpointInfo
                    endpoint={endpoints[selectedEndpoint.index]}
                    onBiasChange={(bias) =>
                      setEndpoints((prev) =>
                        prev.map((endpoint, i) =>
                          i === selectedEndpoint.index
                            ? { ...endpoint, bias }
                            : endpoint,
                        ),
                      )
                    }
                  />,
                  selectedEndpoint.container,
                )}
            </div>
          </Container>
        </Grid>
      </ContentLayout>
      <AddEndpointModal
        visible={modalVisible}
        onAdd={(endpoint) => setEndpoints((prev) => [...prev, endpoint])}
        onClose={() => setModalVisible(false)}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
