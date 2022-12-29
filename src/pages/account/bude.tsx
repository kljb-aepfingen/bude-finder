import {type NextPage} from 'next'
import Link from 'next/link'
import {useState, useEffect} from 'react'

import {useMap} from '@/utils/map'

const AddPosition: NextPage = () => {
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const {map} = useMap()

  useEffect(() => {
    map.addListener('click', ({latLng}: {latLng: google.maps.LatLng}) => {
      if (marker) {
        marker.setPosition(latLng)
        return
      }
      setMarker(new google.maps.Marker({map, position: latLng}))
    })

    return () => {
      google.maps.event.clearListeners(map, 'click')
      marker?.setMap(null)
    }
  }, [map, marker])

  return <nav className="h-16 flex">
    <Link href="/account" className="mt-auto h-16 flex items-center text-xl p-1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor" className="h-12 w-12">
        <path d="M28.05 36 16 23.95 28.05 11.9l2.15 2.15-9.9 9.9 9.9 9.9Z"/>
      </svg>
    </Link>
  </nav>
}

export default AddPosition
