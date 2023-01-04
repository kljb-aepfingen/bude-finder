import { type AppType } from "next/app";
import { type Session } from "next-auth";
import {SessionProvider} from "next-auth/react";
import {Wrapper} from '@googlemaps/react-wrapper'

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

import {env} from "@/env/client.mjs"
import {mapContext} from '@/utils/map'
import {useState, useCallback, useEffect, useRef} from 'react'
import {BudeProvider} from '@/utils/bude'

const defaultPosition = {
  latLng: {lat: 50, lng: 10.2},
  zoom: 7
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [position, setPosition] = useState<typeof defaultPosition | null>(null)
  const livePosition = useRef<google.maps.Marker | null>(null)

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
      styles: [
        {
          featureType: 'poi',
          stylers: [{visibility: 'off'}]
        }
      ]
    }))
  }, [map])

  useEffect(() => {
    if (!map || !position) {
      return
    }
    map.setCenter(position.latLng)
    map.setZoom(position.zoom)
  }, [map, position])

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

  useEffect(() => {
    if (!map) {
      return
    }

    const watch = navigator.geolocation.watchPosition(({coords}) => {
      const position = {
        lat: coords.latitude,
        lng: coords.longitude
      }
      if (livePosition.current) {
        livePosition.current.setPosition(position)
        return
      }
      livePosition.current = new google.maps.Marker({
        map,
        position
      })
    })

    return () => {
      navigator.geolocation.clearWatch(watch)
      if (livePosition.current) {
        livePosition.current.setMap(null)
        livePosition.current = null
      }
    }
  }, [map])

  return (
    <SessionProvider session={session}>
      <Wrapper apiKey={env.NEXT_PUBLIC_MAPS_KEY}>
        <div className="flex flex-col h-full">
          <ins
            className="adsbygoogle"
            style={{display: 'block'}}
            data-ad-client="ca-pub-8241943697814118"
            data-ad-slot="7494837909"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
          <script>
              (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
          <div ref={ref} className="flex-1"/>
          {map && <mapContext.Provider value={{map}}>
            <BudeProvider>
              <Component {...pageProps} />
            </BudeProvider>
          </mapContext.Provider>}
        </div>
      </Wrapper>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
