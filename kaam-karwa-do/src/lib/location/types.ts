// Shared location types used across onboarding, settings, and address forms.

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ResolvedAddress {
  formatted: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  coordinates?: Coordinates;
  source: "DEVICE_GPS" | "MANUAL";
}

export type LocationPermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";
