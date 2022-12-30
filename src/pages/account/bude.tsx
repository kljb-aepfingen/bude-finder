import {type NextPage} from 'next'
import {type ParsedUrlQuery} from 'querystring'
import Link from 'next/link'
import {useEffect, useCallback, useRef, useState, useMemo} from 'react'
import {useRouter} from 'next/router'

import {useMap} from '@/utils/map'
import {LeftSVG, RightSVG, DownSVG} from '@/svg'
import {trpc} from '@/utils/trpc'

type Stage = 'position' | 'info'

const extractInfo = (query: ParsedUrlQuery): null | {name: string, description: string, position: {lat: number, lng: number}} => {
  if (!query.info || Array.isArray(query.info))
    return null

  try {
    const info = JSON.parse(query.info)
    if (
      typeof info.name === 'string' &&
      typeof info.description === 'string' &&
      typeof info.lat === 'number' &&
      typeof info.lng === 'number'
    ) {
      return {
        name: info.name,
        description: info.description,
        position: {
          lat: info.lat,
          lng: info.lng
        }
      }
    }
    return null
  } catch (e) {
    return null
  }
}

const AddBude: NextPage = () => {
  const router = useRouter()

  const info = useMemo(() => extractInfo(router.query), [router.query])

  const {marker, stage, setStage} = useAddBude(info?.position)
  const [name, setName] = useState(info?.name ?? '')
  const [description, setDescription] = useState(info?.description ?? '')
  const [submitted, setSubmitted] = useState(false)

  const mutation = trpc.bude.add.useMutation({
    onSuccess: () => {
      router.push('/')
    },
  })

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
      div.style.display = 'block'
      div.style.height = 'auto'
      const {height} = div.getBoundingClientRect()
      div.style.height = '0px'
      div.getBoundingClientRect()
      div.style.height = `${height}px`
      return
    }
    div.style.height = '0px'
  }, [stage])

  const handleTransitionEnd = useCallback(() => {
    if (ref.current && stage === 'position') {
      ref.current.style.display = 'none'
    }
  }, [stage])

  const handleDown = useCallback(() => {
    setStage('position')
  }, [setStage])

  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.currentTarget.value)
  }, [setName])
  
  const handleDescriptionChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.currentTarget.value)
  }, [setDescription])

  return <div onTransitionEnd={handleTransitionEnd} ref={ref} className="overflow-hidden transition-[height] hidden">
    <div className="grid grid-cols-1">
      <button onClick={handleDown} className="bg-slate-700 grid place-items-center">
        <DownSVG/>
      </button>
      <div className="grid grid-cols-1 p-4">
        <label htmlFor="name">Name der Bude/Landjugend</label>
        <input
          onChange={handleNameChange}
          type="text"
          name="name"
          id="name"
          value={name}
          className={`${submitted && name === '' && 'border-red-600'}`}
        />
        <div className="p-1"/>
        <label htmlFor="description">Beschreibt euch ein wenig</label>
        <textarea
          onChange={handleDescriptionChange}
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



const useAddBude = (position?: {lat: number, lng: number}) => {
  const {map} = useMap()
  const [stage, setStage] = useState<Stage>(position ? 'info' : 'position')
  const [marker, setMarker] = useState<google.maps.Marker | null>(position ? new google.maps.Marker({map, position}) : null)

  if (position) {
    map.setCenter(position)
    map.setZoom(20)
  }

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