import { router } from "../trpc"
import {budeRouter} from './bude'

export const appRouter = router({
  bude: budeRouter
})

// export type definition of API
export type AppRouter = typeof appRouter
