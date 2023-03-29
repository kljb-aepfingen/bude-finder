import { httpLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'

import type {inferRouterOutputs, inferRouterInputs} from '@trpc/server'
import type {AppRouter} from '@/server/trpc/router/_app'

const getBaseUrl = () => {
  if (typeof window !== "undefined") return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export const cacheControl = {noCache: false}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (cacheControl.noCache) {
              return {
                'cache-control': 'no-cache'
              }
            }
            return {}
          },
        }),
      ],
    };
  },
  ssr: false
})

/**
 * Inference helper for inputs
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>
/**
 * Inference helper for outputs
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>


import type {UseTRPCMutationResult, UseTRPCQueryResult} from '@trpc/react-query/shared'
import type {TRPCClientErrorLike} from '@trpc/react-query'
import type {AnyRouter, AnyProcedure, inferProcedureInput, inferProcedureOutput} from '@trpc/server'

export type RouterHookReturnTypes<
  TRouter extends AnyRouter = AppRouter
> = {
  [TKey in keyof TRouter['_def']['record']]: TRouter['_def']['record'][TKey] extends infer TRouterOrProcedure
    ? TRouterOrProcedure extends AnyRouter
      ? RouterHookReturnTypes<TRouterOrProcedure>
      : TRouterOrProcedure extends AnyProcedure
        ? TRouterOrProcedure['_type'] extends 'mutation'
          ? UseTRPCMutationResult<
              inferProcedureOutput<TRouterOrProcedure>,
              TRPCClientErrorLike<AppRouter>,
              inferProcedureInput<TRouterOrProcedure>,
              unknown
            >
          : TRouterOrProcedure['_type'] extends 'query'
            ? UseTRPCQueryResult<inferProcedureOutput<TRouterOrProcedure>, TRPCClientErrorLike<AppRouter>>
            : never
        : never
    : never
}