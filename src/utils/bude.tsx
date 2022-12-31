import {createContext, useContext} from 'react'
import {trpc} from '@/utils/trpc'

import {type UseTRPCQueryResult} from '@trpc/react-query/shared'
import {type inferRouterOutputs} from '@trpc/server'
import {type TRPCClientErrorLike} from '@trpc/react-query'
import {type AppRouter} from '@/server/trpc/router/_app'

type BudeContext = UseTRPCQueryResult<inferRouterOutputs<AppRouter>['bude']['own'], TRPCClientErrorLike<AppRouter>>

const budeContext = createContext<BudeContext>(null as unknown as BudeContext)
export const useBude = () => useContext(budeContext)

export const BudeProvider = ({children}: {children: React.ReactNode}) => {
  const bude = trpc.bude.own.useQuery()
  return <budeContext.Provider value={bude}>
    {children}
  </budeContext.Provider>
}