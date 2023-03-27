import {type NextPage} from 'next'
import Link from 'next/link'
import {useEffect, useCallback, useState, useRef} from 'react'
import {useRouter} from 'next/router'
import {useSession} from 'next-auth/react'

import {useMap} from '@/utils/map'
import {LeftSVG, RightSVG, DownSVG} from '@/svg'
import {trpc, cacheControl} from '@/utils/trpc'

type Stage = 'position' | 'info'

import {useBude} from '@/utils/bude'
import {budeMarker} from '@/utils/marker'

import {contactValidator} from '@/utils/validators'
import {toast} from 'react-hot-toast'

const AddBude: NextPage = () => {
  const session = useSession()
  const router = useRouter()

  const {marker, stage, setStage} = useAddBude()
  const [name, setName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState('')
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [contact, setContact] = useState('')
  const contactRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState({name: false, description: false, contact: false})

  const bude = useBude()

  useEffect(() => {
    if (bude.data) {
      setName(bude.data.name)
      setDescription(bude.data.description)
      setContact(bude.data.contact)
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

  const setInfo = useCallback(() => {
    if (!nameRef.current || !descriptionRef.current || !contactRef.current) {
      return
    }

    const name = nameRef.current.value
    setName(name)
    const description = descriptionRef.current.value
    setDescription(description)
    const contact = contactRef.current.value
    setContact(contact)

    return {
      name,
      description,
      contact
    }
  }, [])

  const handleNextPosition = useCallback(() => {
    if (!marker) {
      toast.error('Tippe auf die Stelle wo eure Bude / Landjugend ist')
      return
    }

    setStage('info')
  }, [marker, setStage])

  const handleNextInfo = useCallback(() => {
    const info = setInfo()
    if (!info || !marker) {
      toast.error('Etwas ist schief gegangen')
      return
    }

    const {name, description, contact} = info
    if (name === '') {
      setError(error => ({...error, name: true}))
      toast.error('Es fehlt ein Name')
      return
    }
    setError(error => ({...error, name: false}))

    if (description === '') {
      setError(error => ({...error, description: true}))
      toast.error('Es fehlt eine kurze Beschreibung')
      return
    }
    setError(error => ({...error, description: false}))

    if (contact === '') {
      setError(error => ({...error, contact: true}))
      toast.error('Es fehlt die Kontaktinformation')
      return
    }
    setError(error => ({...error, contact: false}))

    if (!contactValidator.safeParse(contact).success) {
      toast.error('Kontakt muss eine Email oder eine Nummer sein')
      return
    }

    const position = marker.getPosition()
    if (!position) {
      toast.error('Etwas ist schief gegangen')
      return
    }

    const data = {
      name, description, contact,
      lat: position.lat(),
      lng: position.lng()
    }

    if (bude.data) {
      updateBude.mutate(data)
      return
    }

    addBude.mutate(data)
  }, [setInfo, marker, updateBude, addBude, bude.data])

  const handleNext = useCallback(() => {
    if (stage === 'position') {
      handleNextPosition()
    } else if (stage === 'info') {
      handleNextInfo()
    }
  }, [
    handleNextPosition,
    handleNextInfo,
    stage
  ])

  const back = useCallback(() => {
    setStage('position')
    setInfo()
  }, [setStage, setInfo])

  return <>
    <Info {...{stage, back, setStage, name, nameRef, description, descriptionRef, contact, contactRef, error}}/>
    <Navbar stage={stage} onNext={handleNext}/>
  </>
}

export default AddBude


interface InfoProps {
  stage: Stage,
  back: () => void,
  name: string,
  nameRef: React.RefObject<HTMLInputElement>,
  description: string,
  descriptionRef: React.RefObject<HTMLTextAreaElement>,
  contact: string,
  contactRef: React.RefObject<HTMLInputElement>,
  error: {name: boolean, description: boolean, contact: boolean}
}

const Info = ({
  back,
  stage,
  name,
  nameRef,
  description,
  descriptionRef,
  contact,
  contactRef,
  error
}: InfoProps) => {
  if (stage == 'position') {
    return <div className="text-xl p-4">
      Klicke auf die Karte
    </div>
  }

  return <div className="grid grid-cols-1">
    <button onClick={back} className="bg-slate-700 grid place-items-center">
      <DownSVG/>
    </button>
    <div className="grid grid-cols-1 p-4">
      <label htmlFor="name">Name der Bude/Landjugend</label>
      <input
        type="text"
        name="name"
        id="name"
        defaultValue={name}
        className={`${error.name && 'border-red-600'}`}
        ref={nameRef}
      />
      <div className="p-1"/>
      <label htmlFor="description">Beschreibt euch ein wenig</label>
      <textarea
        name="description"
        rows={6}
        id="description"
        defaultValue={description}
        className={`${error.description && 'border-red-600'}`}
        ref={descriptionRef}
      ></textarea>
      <div className="p-1"/>
      <label htmlFor="contact">Kontakt (Email oder Nummer)</label>
      <input
        type="text"
        name="contact"
        id="contact"
        defaultValue={contact}
        className={`${error.contact && 'border-red-600'}`}
        ref={contactRef}
      />
    </div>
  </div>
}



interface NavbarProps {
  onNext: () => void,
  stage: Stage
}

const Navbar = ({stage, onNext}: NavbarProps) => {
  return <div className="h-16 grid grid-cols-2 items-center text-xl">
    <Link href="/account" className="flex items-center">
      <LeftSVG/>
      <span className="-translate-y-0.5">Zurück</span>
    </Link>
    <button
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