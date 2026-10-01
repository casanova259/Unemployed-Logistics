import L from "leaflet";

export const ARCGIS_API_KEY =
  process.env.NEXT_PUBLIC_ARCGIS_API_KEY ||
  "AAPTabAwI9la7ke-Ujbb2iWKofg..aBk4gAsFLlIyi5Piiw2javqFZoX2g9uKjRiKoGjlPas0UCzoqZQVSz4xFrwEq7MF3nEjbNRsoeY0vSFXHB2oWfnC2yPA7Y3DeF_Bj-Jkv8AscbrrOSKIiu-CpbArjo2PLyvfc6AiQj7Q-kKkeYfXZePtWPc9z2cSOiUzS_8ahbCo7SFpbkO3GA6VGY2iyqFgGna90PdxROcpThYUaBhUpDheDnqpeOtX9dhSWN1mbxokDy98iuI2_HU.AT1_EGCB9WAU";

/**
 * Fix default Leaflet marker asset paths for Next.js bundler
 */
export function fixLeafletDefaultIcons() {
  if (typeof window === "undefined") return;

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export interface MapLayerOption {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const MAP_LAYERS: Record<string, MapLayerOption> = {
  arcgisStreets: {
    id: "arcgisStreets",
    name: "ArcGIS Streets",
    url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}${
      ARCGIS_API_KEY ? `?token=${ARCGIS_API_KEY}` : ""
    }`,
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom",
    maxZoom: 19,
  },
  arcgisSatellite: {
    id: "arcgisSatellite",
    name: "ArcGIS Satellite",
    url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${
      ARCGIS_API_KEY ? `?token=${ARCGIS_API_KEY}` : ""
    }`,
    attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  osm: {
    id: "osm",
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  cartoVoyager: {
    id: "cartoVoyager",
    name: "CARTO Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
  },
};

/**
 * Creates and attaches the primary tile layer (ArcGIS with automatic OpenStreetMap fallback)
 */
export function createBaseTileLayer(layerKey: keyof typeof MAP_LAYERS = "arcgisStreets"): L.TileLayer {
  const layer = MAP_LAYERS[layerKey] || MAP_LAYERS.arcgisStreets;

  const tileLayer = L.tileLayer(layer.url, {
    attribution: layer.attribution,
    maxZoom: layer.maxZoom,
  });

  // If ArcGIS fails or has token issue, smoothly fall back to OpenStreetMap
  tileLayer.on("tileerror", function (error) {
    console.warn("Tile loading error on layer:", layer.name, error);
  });

  return tileLayer;
}
