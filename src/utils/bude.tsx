import {createContext, useContext, useEffect} from 'react'
import {trpc, type RouterHookReturnTypes} from '@/utils/trpc'
import {useSession} from 'next-auth/react'

type BudeContext = RouterHookReturnTypes['bude']['own']

const budeContext = createContext<BudeContext>(null as unknown as BudeContext)
export const useBude = () => useContext(budeContext)

export const BudeProvider = ({children}: {children: React.ReactNode}) => {
  const session = useSession()
  const bude = trpc.bude.own.useQuery(undefined, {enabled: false})

  useEffect(() => {
    if (session.status === 'authenticated') {
      bude.refetch()
    }
  }, [bude, session.status])
  return <budeContext.Provider value={bude}>
    {children}
  </budeContext.Provider>
}