import { loadGoogleMaps } from "./googleMapsLoader";
import { Coordinates, ResolvedAddress } from "./types";

/**
 * Converts device coordinates into a readable Indian address using the
 * Google Maps Geocoding service (client-side, via the Maps JS SDK).
 *
 * NOTE: exact coordinates returned here should be stored server-side but
 * must NOT be rendered publicly — see Address model privacy note in the
 * Prisma schema.
 */
export async function reverseGeocode(
  coords: Coordinates
): Promise<ResolvedAddress> {
  await loadGoogleMaps();

  const geocoder = new google.maps.Geocoder();

  const response = await geocoder.geocode({
    location: { lat: coords.latitude, lng: coords.longitude },
  });

  const result = response.results[0];

  if (!result) {
    throw new Error("NO_GEOCODE_RESULT");
  }

  const components = result.address_components ?? [];

  const find = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name;

  return {
    formatted: result.formatted_address,
    area:
      find("sublocality_level_1") ??
      find("sublocality") ??
      find("neighborhood"),
    city: find("locality") ?? find("administrative_area_level_2"),
    state: find("administrative_area_level_1"),
    pincode: find("postal_code"),
    coordinates: coords,
    source: "DEVICE_GPS",
  };
}

/**
 * Wraps the Places Autocomplete service for manual city/area search.
 * Restricted to India (`componentRestrictions: { country: "in" }`).
 */
export async function searchPlaces(query: string) {
  await loadGoogleMaps();

  const service = new google.maps.places.AutocompleteService();

  return new Promise<google.maps.places.AutocompletePrediction[]>(
    (resolve, reject) => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "in" },
          types: ["(regions)"],
        },
        (predictions, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            resolve([]);
            return;
          }
          resolve(predictions);
        }
      );
    }
  );
}

/**
 * Resolves a Places prediction (from searchPlaces) into a full address,
 * used when the user manually picks a city/area instead of using GPS.
 */
export async function resolvePlaceById(
  placeId: string
): Promise<ResolvedAddress> {
  await loadGoogleMaps();

  const geocoder = new google.maps.Geocoder();
  const response = await geocoder.geocode({ placeId });
  const result = response.results[0];

  if (!result) {
    throw new Error("NO_PLACE_RESULT");
  }

  const components = result.address_components ?? [];
  const find = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name;

  const location = result.geometry?.location;

  return {
    formatted: result.formatted_address,
    area: find("sublocality_level_1") ?? find("sublocality"),
    city: find("locality") ?? find("administrative_area_level_2"),
    state: find("administrative_area_level_1"),
    pincode: find("postal_code"),
    coordinates: location
      ? { latitude: location.lat(), longitude: location.lng() }
      : undefined,
    source: "MANUAL",
  };
}
