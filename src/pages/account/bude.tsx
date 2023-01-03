import {type NextPage} from 'next'
import Link from 'next/link'
import {useEffect, useCallback, useRef, useState} from 'react'
import {useRouter} from 'next/router'
import {useSession} from 'next-auth/react'

import {useMap} from '@/utils/map'
import {LeftSVG, RightSVG, DownSVG} from '@/svg'
import {trpc, cacheControl} from '@/utils/trpc'

type Stage = 'position' | 'info'

import {useBude} from '@/utils/bude'

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
  const mutation = trpc.bude.add.useMutation({
    onSuccess: async () => {
      cacheControl.noCache = true
      const test = await Promise.all([
        bude.refetch(),
        allBude.refetch()
      ])
      console.log('finished refetch', test)
      cacheControl.noCache = false
      router.push('/')
    },
  })

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

    if (!marker)
      return

    const position = marker.getPosition()
    if (!position)
      return

    mutation.mutate({
      name,
      description,
      lat: position.lat(),
      lng: position.lng()
    })
  }, [stage, setStage, name, description, marker, mutation])

  return <>
    <Info {...{stage, setStage, name, setName, description, setDescription, submitted}}/>
    <Navbar disableNext={!marker} onNext={handleNext}/>
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current)
      return
    const div = ref.current
    if (stage === 'info') {
      div.style.display = ' block'
      return
    }
    div.style.display = ''
  }, [stage])

  const handleDown = useCallback(() => {
    setStage('position')
  }, [setStage])

  const handleChange = useCallback((set: (value: string) => void) => (event: React.ChangeEvent<{value: string}>) => {
    set(event.currentTarget.value)
  }, [])

  return <div ref={ref} className="hidden">
    <div className="grid grid-cols-1">
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
  </div>
}



interface NavbarProps {
  disableNext: boolean,
  onNext: () => void
}

const Navbar = ({disableNext, onNext}: NavbarProps) => {
  return <div className="h-16 grid grid-cols-2 items-center">
    <Link href="/account" className="flex items-center text-xl">
      <LeftSVG/>
      <span className="-translate-y-0.5">Zurück</span>
    </Link>
    <button
      disabled={disableNext}
      onClick={onNext}
      className="text-xl flex justify-end items-center"
    >
      <span className="-translate-y-0.5">{disableNext ? 'Plaziere einen Marker' : 'Weiter'}</span>
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
      setMarker(new google.maps.Marker({map, position}))
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
    setMarker(new google.maps.Marker({map, position: latLng}))
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