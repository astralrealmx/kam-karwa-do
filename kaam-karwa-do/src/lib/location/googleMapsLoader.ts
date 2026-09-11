// Lazily loads the Google Maps JavaScript API (with the Places library)
// exactly once, and caches the loading promise so multiple components
// can call this safely.
//
// Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to be set. The key used here
// is a browser (public) key — restrict it in the Google Cloud Console to
// your site's domain(s) and to the Maps JavaScript API, Places API, and
// Geocoding API only.

let loaderPromise: Promise<void> | null = null;

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("GOOGLE_MAPS_SSR_NOT_SUPPORTED"));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(new Error("GOOGLE_MAPS_API_KEY_MISSING"));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("GOOGLE_MAPS_SCRIPT_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
