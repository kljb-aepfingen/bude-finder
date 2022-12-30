import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import {Wrapper} from '@googlemaps/react-wrapper'

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

import {env} from "@/env/client.mjs"
import {mapContext} from '@/utils/map'
import {useState, useCallback} from 'react'

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const ref = useCallback((ref: HTMLDivElement | null) => {
    if (!ref) {
      return setMap(null)
    }
    setMap(new google.maps.Map(ref, {
      center: {lat: 40, lng: 40},
      zoom: 10,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      styles: [
        {
          featureType: 'poi',
          stylers: [{visibility: 'off'}]
        }
      ]
    }))
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
