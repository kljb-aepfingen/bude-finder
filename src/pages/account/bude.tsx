import {type NextPage} from 'next'
import Link from 'next/link'
import {useEffect, useCallback, useState} from 'react'
import {useRouter} from 'next/router'
import {useSession} from 'next-auth/react'

import {useMap} from '@/utils/map'
import {LeftSVG, RightSVG, DownSVG} from '@/svg'
import {trpc, cacheControl} from '@/utils/trpc'

type Stage = 'position' | 'info'

import {useBude} from '@/utils/bude'
import {budeMarker} from '@/utils/marker'

const AddBude: NextPage = () => {
  const session = useSession()
  const router = useRouter()

  const {marker, stage, setStage} = useAddBude()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const bude = useBude()

  useEffect(() => {
    if (bude.data) {
      setName(bude.data.name)
      setDescription(bude.data.description)
    }
  }, [bude])

  const allBude = trpc.bude.all.useQuery()
  const options = {onSuccess: async () => {
    cacheControl.noCache = true
    await Promise.all([
      bude.refetch(),
      allBude.refetch()
    ])
    cacheControl.noCache = false
    router.push('/')
  }}
  const addBude = trpc.bude.add.useMutation(options)
  const updateBude = trpc.bude.update.useMutation(options)

  useEffect(() => {
    if (session.status === 'loading')
      return
    if (session.status !== 'authenticated')
      router.push('/')
  }, [session, router])

  const handleNext = useCallback(() => {
    if (stage === 'position') {
      setStage('info')
      return
    }
    if (name === '' || description === '') {
      setSubmitted(true)
      return
    }

    if (!marker) {
      return
    }

    const position = marker.getPosition()
    if (!position) {
      return
    }

    const data = {
      name,
      description,
      lat: position.lat(),
      lng: position.lng()
    }

    if (bude.data) {
      updateBude.mutate(data)
      return
    }

    addBude.mutate(data)
  }, [
    stage,
    setStage,
    name,
    description,
    marker,
    addBude,
    updateBude,
    bude
  ])

  return <>
    <Info {...{stage, setStage, name, setName, description, setDescription, submitted}}/>
    <Navbar stage={stage} disableNext={!marker} onNext={handleNext}/>
  </>
}

export default AddBude


interface InfoProps {
  stage: Stage,
  setStage: (stage: Stage) => void,
  name: string,
  setName: (value: string) => void,
  description: string,
  setDescription: (value: string) => void,
  submitted: boolean
}

const Info = ({setStage, stage, description, name, setDescription, setName, submitted}: InfoProps) => {
  const handleDown = useCallback(() => {
    setStage('position')
  }, [setStage])

  const handleChange = useCallback((set: (value: string) => void) => (event: React.ChangeEvent<{value: string}>) => {
    set(event.currentTarget.value)
  }, [])

  if (stage == 'position') {
    return <div className="text-xl p-4">
      Klicke auf die Karte
    </div>
  }

  return <div className="grid grid-cols-1">
    <button onClick={handleDown} className="bg-slate-700 grid place-items-center">
      <DownSVG/>
    </button>
    <div className="grid grid-cols-1 p-4">
      <label htmlFor="name">Name der Bude/Landjugend</label>
      <input
        onChange={handleChange(setName)}
        type="text"
        name="name"
        id="name"
        value={name}
        className={`${submitted && name === '' && 'border-red-600'}`}
      />
      <div className="p-1"/>
      <label htmlFor="description">Beschreibt euch ein wenig</label>
      <textarea
        onChange={handleChange(setDescription)}
        name="description"
        rows={6}
        id="description"
        value={description}
        className={`${submitted && description === '' && 'border-red-600'}`}
      ></textarea>
    </div>
  </div>
}



interface NavbarProps {
  disableNext: boolean,
  onNext: () => void,
  stage: Stage
}

const Navbar = ({disableNext, stage, onNext}: NavbarProps) => {
  return <div className="h-16 grid grid-cols-2 items-center text-xl">
    <Link href="/account" className="flex items-center">
      <LeftSVG/>
      <span className="-translate-y-0.5">Zurück</span>
    </Link>
    <button
      disabled={disableNext}
      onClick={onNext}
      className="flex justify-end items-center disabled:opacity-40"
    >
      <span className="-translate-y-0.5">{stage == 'info' ? 'Speichern' : 'Weiter'}</span>
      <RightSVG/>
    </button>
  </div>
}



const useAddBude = () => {
  const {map} = useMap()
  const [stage, setStage] = useState<Stage>('position')
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const bude = useBude()

  useEffect(() => {
    if (bude.data) {
      const position = {lat: bude.data.lat, lng: bude.data.lng}
      setMarker(budeMarker(map, position))
      setStage('info')
      map.setCenter(position)
      map.setZoom(19)
    }

    return () => {
      setMarker(prev => {
        prev?.setMap(null)
        return null
      })
    }
  }, [bude, map])

  const handleClick = useCallback(({latLng}: {latLng: google.maps.LatLng}) => {
    if (stage !== 'position')
      return
    if (marker) {
      marker.setPosition(latLng)
      return
    }
    setMarker(budeMarker(map, latLng))
  }, [map, marker, stage])

  useEffect(() => {
    const listener = map.addListener('click', handleClick)
    return () => google.maps.event.removeListener(listener)
  }, [map, handleClick])

  useEffect(() => {
    return () => marker?.setMap(null)
  }, [marker])

  return {
    stage,
    setStage,
    marker
  }
}