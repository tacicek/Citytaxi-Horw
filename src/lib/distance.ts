import type { Coordinates } from '@/types/location'

const EARTH_RADIUS_KM = 6371

/** Haversine formula — straight-line distance in km */
export function haversineDistance(from: Coordinates, to: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a))
}

/** Estimate arrival time in minutes given distance and average speed */
export function estimateArrival(distanceKm: number, avgSpeedKmh = 30): number {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60)
}

/** Sort an array of items with coordinates by distance from a given point */
export function sortByDistance<T extends { coordinates: Coordinates }>(
  origin: Coordinates,
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) =>
      haversineDistance(origin, a.coordinates) - haversineDistance(origin, b.coordinates)
  )
}
