'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates, GeolocationOptions } from '@/types/location'

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
}

export type GeolocationResult = {
  coordinates: Coordinates | null
  accuracy: number | null
  heading: number | null
  speed: number | null
  error: string | null
  isLoading: boolean
  isWatching: boolean
  permissionStatus: PermissionState
  requestLocation: () => void
  startWatching: () => void
  stopWatching: () => void
}

function geoErrorToMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Konum izni reddedildi. Tarayıcı ayarlarından açabilirsiniz.'
    case err.POSITION_UNAVAILABLE:
      return 'Konum bilgisi alınamadı. Lütfen tekrar deneyin.'
    case err.TIMEOUT:
      return 'Konum isteği zaman aşımına uğradı. Lütfen tekrar deneyin.'
    default:
      return 'Bilinmeyen bir konum hatası oluştu.'
  }
}

/**
 * Browser Geolocation API hook.
 * Supports single-shot location requests and continuous watching.
 * Handles SSR (navigator is undefined on server).
 */
export function useGeolocation(options: GeolocationOptions = DEFAULT_OPTIONS): GeolocationResult {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const [speed, setSpeed] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt')

  const watchIdRef = useRef<number | null>(null)

  // Check permission status on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        setPermissionStatus(result.state)
        result.onchange = () => setPermissionStatus(result.state)
      })
      .catch(() => {
        // Some browsers don't support permissions.query for geolocation
      })
  }, [])

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    setAccuracy(pos.coords.accuracy)
    setHeading(pos.coords.heading)
    setSpeed(pos.coords.speed)
    setError(null)
    setIsLoading(false)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(geoErrorToMessage(err))
    setIsLoading(false)
  }, [])

  /** Single-shot location request */
  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Ihr Browser unterstützt keine Standortermittlung.')
      return
    }
    setIsLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options)
  }, [handleSuccess, handleError, options])

  /** Start continuous location watching */
  const startWatching = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Ihr Browser unterstützt keine Standortermittlung.')
      return
    }
    if (watchIdRef.current !== null) return
    setIsLoading(true)
    setError(null)
    setIsWatching(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    )
  }, [handleSuccess, handleError, options])

  /** Stop continuous watching */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current === null) return
    navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = null
    setIsWatching(false)
    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    coordinates,
    accuracy,
    heading,
    speed,
    error,
    isLoading,
    isWatching,
    permissionStatus,
    requestLocation,
    startWatching,
    stopWatching,
  }
}
