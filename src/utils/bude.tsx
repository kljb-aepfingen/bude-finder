import {createContext, useContext} from 'react'
import {trpc, type RouterHookReturnTypes} from '@/utils/trpc'

type BudeContext = RouterHookReturnTypes['bude']['own']

const budeContext = createContext<BudeContext>(null as unknown as BudeContext)
export const useBude = () => useContext(budeContext)

export const BudeProvider = ({children}: {children: React.ReactNode}) => {
  const bude = trpc.bude.own.useQuery()
  return <budeContext.Provider value={bude}>
    {children}
  </budeContext.Provider>
}