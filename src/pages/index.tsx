import { type NextPage } from "next"
import Head from "next/head"
import {useEffect, useState, useRef} from 'react'

import Navbar from '@/components/Navbar'

const Home: NextPage = () => {
  return <>
    <Head>
      <title>Bude Finder</title>
    </Head>
    <div className="flex flex-col h-full">
      <main className="h-full">
        <Map/>
      </main>
      <Navbar/>
    </div>
  </>
}

export default Home


const Map = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map>()

  useEffect(() => {
    if (ref.current && !map) {
      setMap(new google.maps.Map(ref.current, {
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        center: {lat: 51, lng: 10},
        zoom: 7,
        styles: [
          {
            featureType: 'poi',
            stylers: [
              {visibility: 'off'}
            ]
          }
        ]
      }))
    }
  }, [ref, map])

  useEffect(() => {
    if (!map)
      return

    navigator.geolocation.getCurrentPosition(({coords}) => {
      map.setCenter({
        lat: coords.latitude,
        lng: coords.longitude
      })
      map.setZoom(12)
    })


    google.maps.event.clearListeners(map, 'click')
    
    map.addListener('click', ({latLng}: {latLng: {lat: () => number, lng: () => number}}) => {
      const lat = latLng.lat()
      const lng = latLng.lng()
      const marker = new google.maps.Marker({map, position: {lat, lng}})
    })
  }, [map])

  return <>
    <div ref={ref} className="h-full"/>
  </>
}