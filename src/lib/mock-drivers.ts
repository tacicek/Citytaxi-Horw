import type { NearbyDriver } from '@/types/location'

/**
 * Mock taxi drivers in the Horw / Luzern area.
 * Replace with a real API endpoint in production.
 */
export const MOCK_DRIVERS: NearbyDriver[] = [
  {
    id: 'driver-1',
    name: 'Fahrzeug 1',
    coordinates: { lat: 47.0136, lng: 8.3083 }, // Horw Zentrum
    distanceKm: 0.4,
    estimatedArrivalMin: 2,
    isAvailable: true,
  },
  {
    id: 'driver-2',
    name: 'Fahrzeug 2',
    coordinates: { lat: 47.0502, lng: 8.3093 }, // Luzern Bahnhof
    distanceKm: 4.2,
    estimatedArrivalMin: 8,
    isAvailable: true,
  },
  {
    id: 'driver-3',
    name: 'Fahrzeug 3',
    coordinates: { lat: 47.0289, lng: 8.2814 }, // Kriens
    distanceKm: 2.9,
    estimatedArrivalMin: 6,
    isAvailable: true,
  },
  {
    id: 'driver-4',
    name: 'Fahrzeug 4',
    coordinates: { lat: 47.0292, lng: 8.3754 }, // Meggen
    distanceKm: 3.5,
    estimatedArrivalMin: 7,
    isAvailable: false,
  },
  {
    id: 'driver-5',
    name: 'Fahrzeug 5',
    coordinates: { lat: 47.0655, lng: 8.3411 }, // Ebikon
    distanceKm: 6.1,
    estimatedArrivalMin: 12,
    isAvailable: true,
  },
]
