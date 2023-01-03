import { router } from "../trpc"
import {budeRouter} from './bude'
import {evalRouter} from './evaluation'

export const appRouter = router({
  bude: budeRouter,
  eval: evalRouter
})

// export type definition of API
export type AppRouter = typeof appRouter
