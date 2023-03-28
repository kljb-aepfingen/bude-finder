import { router } from "../trpc"
import {budeRouter} from './bude'
import {evalRouter} from './evaluation'
import {reportRouter} from './report'

export const appRouter = router({
  bude: budeRouter,
  eval: evalRouter,
  report: reportRouter
})

// export type definition of API
export type AppRouter = typeof appRouter
