import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

import {Wrapper} from '@googlemaps/react-wrapper'

import {env} from '@/env/client.mjs'

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <Wrapper apiKey={env.NEXT_PUBLIC_MAPS_KEY} render={() => <h1>Test</h1>}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </Wrapper>
  );
};

export default trpc.withTRPC(MyApp);
