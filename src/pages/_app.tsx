import { type AppType } from "next/app";
import { type Session } from "next-auth";
import {SessionProvider} from "next-auth/react";
import {Wrapper} from '@googlemaps/react-wrapper'

import {trpc} from "@/utils/trpc";

import "../styles/globals.css";

import {env} from "@/env/client.mjs"
import {MapProvider} from '@/utils/map'
import {BudeProvider} from '@/utils/bude'
import {RouterProvider} from '@/utils/router'

import {Toaster} from 'react-hot-toast'

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Wrapper apiKey={env.NEXT_PUBLIC_MAPS_KEY}>
        <Toaster position="top-center"/>
        <MapProvider>
          <BudeProvider>
            <RouterProvider>
              <Component {...pageProps} />
            </RouterProvider>
          </BudeProvider>
        </MapProvider>
      </Wrapper>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
