import { type AppType } from "next/app";
import { type Session } from "next-auth";
import {SessionProvider} from "next-auth/react";
import {Wrapper} from '@googlemaps/react-wrapper'

import {trpc} from "@/utils/trpc";

import "../styles/globals.css";

import {env} from "@/env/client.mjs"
import {MapProvider, type MapContextEvents, type MapContext} from '@/utils/map'
import {useState, useCallback, useEffect, useRef} from 'react'
import {BudeProvider} from '@/utils/bude'
import {budeMarker} from '@/utils/marker'

import {Toaster} from 'react-hot-toast'

const defaultPosition = {
  latLng: {lat: 50, lng: 10.2},
  zoom: 7
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [position, setPosition] = useState<MapContext['position']>(null)
  const positionMarker = useRef<google.maps.Marker | null>(null)
  const budes = trpc.bude.all.useQuery()
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
      center: defaultPosition.latLng,
      zoom: defaultPosition.zoom,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      mapTypeControl: true,
      mapTypeId: 'satellite',
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

    const markers = budes.data.map(bude => {
      const marker = budeMarker(map, {lat: bude.lat, lng: bude.lng}, bude.name)
      google.maps.event.addListener(marker, 'click', () => {
        listeners.current.select.forEach(listener => listener(bude))
      })
      return marker
    })
  
    const listener = map.addListener('click', () => {
      listeners.current.deselect.forEach(listener => listener())
    })
  
    return () => {
      markers.forEach(marker => marker.setMap(null))
      google.maps.event.removeListener(listener)
    }
  }, [map, budes.data])

  return (
    <SessionProvider session={session}>
      <Wrapper apiKey={env.NEXT_PUBLIC_MAPS_KEY}>
        <Toaster position="top-center"/>
        <div className="grid h-full">
          <div ref={ref} className="col-start-1 row-start-1"/>
          <div className="relative isolate pointer-events-none flex flex-col-reverse col-start-1 row-start-1">
            <div className="info-container pointer-events-auto max-w-2xl bg-slate-800 w-full mx-auto overflow-auto">
              {map && budes.data && <MapProvider value={{map, budes, addListener, removeListener, position}}>
                <BudeProvider>
                  <Component {...pageProps} />
                </BudeProvider>
              </MapProvider>}
            </div>
          </div>
        </div>
      </Wrapper>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
