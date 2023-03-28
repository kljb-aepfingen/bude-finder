import {type NextPage} from 'next'
import {useEffect, useCallback, useState, useMemo} from 'react'
import {useRouter} from 'next/router'
import {useSession} from 'next-auth/react'

import {useMap} from '@/utils/map'
import {LeftSVG, RightSVG, DownSVG, SpinnerSVG} from '@/svg'
import {trpc, cacheControl, type RouterOutputs} from '@/utils/trpc'

type Stage = 'position' | 'info'

import {useBude} from '@/utils/bude'
import {editingBudeMarker} from '@/utils/marker'

import {contactValidator} from '@/utils/validators'
import {toast} from 'react-hot-toast'

const caps = {
  name: 100,
  description: 400,
  contact: 100
}

const AddBude: NextPage = () => {
  const session = useSession()
  const router = useRouter()

  const {marker, stage, setStage} = useAddBude()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState({name: false, description: false, contact: false})

  const bude = useBude()

  const handleChange = useCallback((setter: (value: string) => void, max: number) => (event: React.ChangeEvent<{value: string}>) => {
    if (event.currentTarget.value.length <= max) {
      setter(event.currentTarget.value)
    }
  }, [])
  const handleNameChange = useMemo(() => handleChange(setName, caps.name), [handleChange])
  const handleDescriptionChange = useMemo(() => handleChange(setDescription, caps.description), [handleChange])
  const handleContactChange = useMemo(() => handleChange(setContact, caps.contact), [handleChange])

  useEffect(() => {
    if (bude.data) {
      setName(bude.data.name)
      setDescription(bude.data.description)
      setContact(bude.data.contact)
    }
  }, [bude.data])

  const allBude = trpc.bude.all.useQuery()
  const options = {onSuccess: async (data: RouterOutputs['bude']['add']) => {
    cacheControl.noCache = true
    await Promise.all([
      bude.refetch(),
      allBude.refetch()
    ])
    cacheControl.noCache = false
    router.push(`/?budeId=${data.id}`)
  }}
  const addBude = trpc.bude.add.useMutation(options)
  const updateBude = trpc.bude.update.useMutation(options)

  useEffect(() => {
    if (session.status === 'loading')
      return
    if (session.status !== 'authenticated')
      router.push('/')
  }, [session, router])

  const handleNextPosition = useCallback(() => {
    if (!marker) {
      toast.error('Tippe auf die Stelle wo eure Bude / Landjugend ist')
      return
    }

    setStage('info')
  }, [marker, setStage])

  const handleNextInfo = useCallback(() => {
    if (!marker) {
      toast.error('Etwas ist schief gegangen')
      return
    }

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
    
    if (!contactValidator.safeParse(contact).success) {
      setError(error => ({...error, contact: true}))
      toast.error('Kontakt muss eine Email oder eine Nummer sein')
      return
    }
    setError(error => ({...error, contact: false}))

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
  }, [marker, updateBude, addBude, bude.data, name, description, contact])

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
  }, [setStage])

  return <>
    <Info {...{
      stage,
      back,
      setStage,
      name,
      handleNameChange,
      description,
      handleDescriptionChange,
      contact,
      handleContactChange,
      error
    }}/>
    <Navbar stage={stage} loading={addBude.isLoading || updateBude.isLoading} handleNext={handleNext}/>
  </>
}

export default AddBude


interface InfoProps {
  stage: Stage,
  back: () => void,
  name: string,
  handleNameChange: React.ChangeEventHandler<{value: string}>
  description: string,
  handleDescriptionChange: React.ChangeEventHandler<{value: string}>
  contact: string,
  handleContactChange: React.ChangeEventHandler<{value: string}>
  error: {name: boolean, description: boolean, contact: boolean}
}

const Info = ({
  back,
  stage,
  name,
  handleNameChange,
  description,
  handleDescriptionChange,
  contact,
  handleContactChange,
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
      <label htmlFor="name" className="flex gap-1 items-center">
        Name der Bude/Landjugend
        <span className="text-sm opacity-70">({name.length}/{caps.name})</span>
      </label>
      <input
        type="text"
        name="name"
        id="name"
        value={name}
        className={`${error.name && 'border-red-600'}`}
        onChange={handleNameChange}
      />
      <div className="p-1"/>
      <label htmlFor="description" className="flex gap-1 items-center">
        Beschreibt euch ein wenig
        <span className="text-sm opacity-70">({description.length}/{caps.description})</span>
      </label>
      <textarea
        name="description"
        rows={6}
        id="description"
        value={description}
        className={`${error.description && 'border-red-600'}`}
        onChange={handleDescriptionChange}
      ></textarea>
      <div className="p-1"/>
      <label htmlFor="contact" className="flex gap-1 items-center">
        Kontakt (Email oder Nummer)
        <span className="text-sm opacity-70">({contact.length}/{caps.contact})</span>
      </label>
      <input
        type="text"
        name="contact"
        id="contact"
        value={contact}
        className={`${error.contact && 'border-red-600'}`}
        onChange={handleContactChange}
      />
    </div>
  </div>
}

interface NavbarProps {
  handleNext: () => void,
  stage: Stage,
  loading: boolean
}

const Navbar = ({stage, handleNext, loading}: NavbarProps) => {
  const router = useRouter()
  return <div className="h-16 grid grid-cols-2 items-center text-xl">
    <button onClick={() => router.back()} className="flex items-center">
      <LeftSVG/>
      <span className="-translate-y-0.5">Zurück</span>
    </button>
    <button
      onClick={handleNext}
      className="flex justify-end items-center disabled:opacity-40"
    >
      {loading && <SpinnerSVG/>}
      <span className="-translate-y-0.5">{stage == 'info' ? 'Speichern' : 'Weiter'}</span>
      <RightSVG/>
    </button>
  </div>
}



const useAddBude = () => {
  const {map, markers} = useMap()
  const [stage, setStage] = useState<Stage>('position')
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const bude = useBude()

  useEffect(() => {
    let prevMarker: google.maps.Marker | null = null
    if (bude.data) {
      const position = {lat: bude.data.lat, lng: bude.data.lng}
      setMarker(editingBudeMarker(map, position))
      setStage('info')
      map.setCenter(position)
      map.setZoom(19)
      prevMarker = markers.get(bude.data.id) ?? null
      prevMarker?.setVisible(false)
    }

    return () => {
      prevMarker?.setVisible(true)
      setMarker(prev => {
        prev?.setMap(null)
        return null
      })
    }
  }, [bude.data, map, markers])

  const handleClick = useCallback(({latLng}: {latLng: google.maps.LatLng}) => {
    if (stage !== 'position')
      return
    if (marker) {
      marker.setPosition(latLng)
      return
    }
    setMarker(editingBudeMarker(map, latLng))
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