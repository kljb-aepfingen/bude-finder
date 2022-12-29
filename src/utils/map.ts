import {createContext, useContext} from 'react'

interface MapContext {
  map: google.maps.Map
}

export const mapContext = createContext<MapContext>({} as MapContext)
export const useMap = () => useContext(mapContext)