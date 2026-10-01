export interface HubDefinition {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const DEFAULT_HUBS: HubDefinition[] = [
  {
    name: "Chandigarh Central Hub",
    city: "Chandigarh",
    lat: 30.7333,
    lng: 76.7794,
  },
  {
    name: "Delhi Mega Logistics Hub",
    city: "Delhi",
    lat: 28.6139,
    lng: 77.2090,
  },
  {
    name: "Ludhiana Industrial Hub",
    city: "Ludhiana",
    lat: 30.9010,
    lng: 75.8573,
  },
  {
    name: "Amritsar Golden Gateway Hub",
    city: "Amritsar",
    lat: 31.6340,
    lng: 74.8723,
  },
];
