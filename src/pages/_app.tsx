import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import {Wrapper} from '@googlemaps/react-wrapper'

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

import {env} from "@/env/client.mjs"
import {mapContext} from '@/utils/map'
import {useState, useCallback, useEffect} from 'react'

const defaultPosition = {
  latLng: {lat: 50, lng: 10.2},
  zoom: 7
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [position, setPosition] = useState(defaultPosition)
  
  const ref = useCallback((ref: HTMLDivElement | null) => {
    if (!ref)
      return
    if (map) {
      map.setCenter(position.latLng)
      map.setZoom(position.zoom)
      return
    }
    setMap(new google.maps.Map(ref, {
      center: position.latLng,
      zoom: position.zoom,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      mapTypeControl: true,
      styles: [
        {
          featureType: 'poi',
          stylers: [{visibility: 'off'}]
        }
      ]
    }))
  }, [position, map])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(({coords}) => {
      setPosition({
        latLng: {
          lat: coords.latitude,
          lng: coords.longitude
        },
        zoom: 13
      })
    })
  }, [])

  return (
    <SessionProvider session={session}>
      <Wrapper apiKey={env.NEXT_PUBLIC_MAPS_KEY}>
        <div className="flex flex-col h-full">
          <div ref={ref} className="flex-1"/>
          {map && <mapContext.Provider value={{map}}>
            <Component {...pageProps} />
          </mapContext.Provider>}
        </div>
      </Wrapper>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
