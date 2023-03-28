import {createContext, useContext, useState, useCallback, useRef, useEffect} from 'react'

import type {UseTRPCQueryResult} from '@trpc/react-query/shared'
import type {TRPCClientErrorLike} from '@trpc/react-query'
import type {AppRouter} from '@/server/trpc/router/_app'
import {trpc, type RouterOutputs} from '@/utils/trpc'
import {budeMarker} from '@/utils/marker'

type Bude = RouterOutputs['bude']['all']
type AllBudes = UseTRPCQueryResult<Bude, TRPCClientErrorLike<AppRouter>>
type Position = {
  latLng: {lat: number, lng: number},
  zoom: number
}

export interface MapContext {
  map: google.maps.Map,
  budes: Omit<AllBudes, 'data'> & {data: NonNullable<AllBudes['data']>},
  position: Position | null,
  markers: Map<string, google.maps.Marker>,
  addListener: <K extends keyof MapContextEvents>(name: K, listener: MapContextEvents[K]) => void,
  removeListener: <K extends keyof MapContextEvents>(name: K, listener: MapContextEvents[K]) => void
}

export type MapContextEvents = {
  select: (bude: Bude[number]) => void,
  deselect: () => void
}

const mapContext = createContext<MapContext>({} as MapContext)
export const useMap = () => useContext(mapContext)

export const MapProvider = ({children}: {children: React.ReactNode}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [position, setPosition] = useState<MapContext['position']>(null)
  const positionMarker = useRef<google.maps.Marker | null>(null)
  const budes = trpc.bude.all.useQuery()
  const budeMarkers = useRef(new Map<string, google.maps.Marker>())
  const listeners = useRef<{
    [K in keyof MapContextEvents]: Set<MapContextEvents[K]>
  }>({select: new Set(), deselect: new Set()})

  const ref = useCallback((ref: HTMLDivElement | null) => {
    if (!ref)
      return
    if (map) {
      return
    }
    setMap(new google.maps.Map(ref, {
      center: {lat: 50, lng: 10.2},
      zoom: 7,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      mapTypeControl: true,
      mapTypeId: 'hybrid',
      styles: [
        {
          featureType: 'poi',
          stylers: [{visibility: 'off'}]
        }
      ]
    }))
    window
  }, [map])

  const addListener = useCallback<MapContext['addListener']>((name, listener) => {
    listeners.current[name].add(listener)
  }, [])
  const removeListener = useCallback<MapContext['removeListener']>((name, listener) => {
    listeners.current[name].delete(listener)
  }, [])

  useEffect(() => {
    if (!map) {
      return
    }

    navigator.geolocation.getCurrentPosition(({coords}) => {
      setPosition({
        latLng: {
          lat: coords.latitude,
          lng: coords.longitude
        },
        zoom: 17
      })
    })

    const watch = navigator.geolocation.watchPosition(({coords}) => {
      const position = {
        lat: coords.latitude,
        lng: coords.longitude
      }
      if (positionMarker.current) {
        positionMarker.current.setPosition(position)
        return
      }
      console.log('create marker')
      positionMarker.current = new google.maps.Marker({
        map,
        position: position
      })
    })

    return () => {
      navigator.geolocation.clearWatch(watch)
      if (positionMarker.current) {
        positionMarker.current.setMap(null)
        positionMarker.current = null
      }
    }
  }, [map])

  useEffect(() => {
    if (!budes.data || !map) {
      return
    }

    const bm = budeMarkers.current

    const markers = budes.data.map(bude => {
      const marker = budeMarker(map, {lat: bude.lat, lng: bude.lng}, bude.name)
      bm.set(bude.id, marker)
      google.maps.event.addListener(marker, 'click', () => {
        listeners.current.select.forEach(listener => listener(bude))
      })
      return bude.id
    })
  
    const listener = map.addListener('click', () => {
      listeners.current.deselect.forEach(listener => listener())
    })
  
    return () => {
      markers.forEach(id => {
        const marker = bm.get(id)
        marker?.setMap(null)
        bm.delete(id)
      })
      google.maps.event.removeListener(listener)
    }
  }, [map, budes.data])

  return <div className="grid h-full">
    <div ref={ref} className="col-start-1 row-start-1"/>
    <div className="relative isolate pointer-events-none flex flex-col-reverse col-start-1 row-start-1">
      <div className="info-container pointer-events-auto max-w-2xl bg-slate-800 w-full mx-auto overflow-auto">
        {map && budes.data && <mapContext.Provider value={{
          map,
          budes,
          addListener,
          removeListener,
          position,
          markers: budeMarkers.current}
        }>
          {children}
        </mapContext.Provider>}
      </div>
    </div>
  </div>
}