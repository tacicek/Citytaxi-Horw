/** GPS coordinate pair */
export type Coordinates = {
  lat: number
  lng: number
}

/** Full state returned by useGeolocation */
export type LocationState = {
  coordinates: Coordinates | null
  accuracy: number | null
  heading: number | null
  speed: number | null
  error: string | null
  isLoading: boolean
  permissionStatus: PermissionState
}

/** Options passed to navigator.geolocation */
export type GeolocationOptions = {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

/** A nearby driver (real or mock) */
export type NearbyDriver = {
  id: string
  name: string
  coordinates: Coordinates
  distanceKm: number
  estimatedArrivalMin: number
  isAvailable: boolean
}
