import {createContext, useContext} from 'react'

import type {UseTRPCQueryResult} from '@trpc/react-query/shared'
import type {TRPCClientErrorLike} from '@trpc/react-query'
import type {AppRouter} from '@/server/trpc/router/_app'
import type {RouterOutputs} from '@/utils/trpc'

type Bude = RouterOutputs['bude']['all']
type AllBudes = UseTRPCQueryResult<Bude, TRPCClientErrorLike<AppRouter>>
type Position = {
  latLng: {lat: number, lng: number},
  zoom: number
}

export interface MapContext {
  map: google.maps.Map,
  budes: Omit<AllBudes, 'data'> & {data: NonNullable<AllBudes['data']>},
  position: Position | null,
  addListener: <K extends keyof MapContextEvents>(name: K, listener: MapContextEvents[K]) => void,
  removeListener: <K extends keyof MapContextEvents>(name: K, listener: MapContextEvents[K]) => void
}

export type MapContextEvents = {
  select: (bude: Bude[number]) => void,
  deselect: () => void
}

const mapContext = createContext<MapContext>({} as MapContext)
export const useMap = () => useContext(mapContext)

export const MapProvider = ({children, value}: {children: React.ReactNode, value: MapContext}) => {
  

  return <mapContext.Provider value={value}>
    {children}
  </mapContext.Provider>
}