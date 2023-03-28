import {type NextPage} from 'next'
import {useEffect, useCallback, useState, useMemo} from 'react'
import {useRouter} from 'next/router'

import {useMap} from '@/utils/map'
import {LeftSVG, RightSVG, SpinnerSVG} from '@/svg'
import {trpc, cacheControl, type RouterOutputs} from '@/utils/trpc'
import {useProtected} from '@/utils/protected'

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

type Error = {
  name: boolean,
  description: boolean,
  contact: boolean
}

const AddBude: NextPage = () => {
  const router = useRouter()

  const {marker, stage, setStage} = useAddBude()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<Error>({name: false, description: false, contact: false})

  const handleChange = useCallback((setter: (value: string) => void, max: number) => (event: React.ChangeEvent<{value: string}>) => {
    if (event.currentTarget.value.length <= max) {
      setter(event.currentTarget.value)
    }
  }, [])
  const handleNameChange = useMemo(() => handleChange(setName, caps.name), [handleChange])
  const handleDescriptionChange = useMemo(() => handleChange(setDescription, caps.description), [handleChange])
  const handleContactChange = useMemo(() => handleChange(setContact, caps.contact), [handleChange])

  const {bude, isLoading, save} = useSave(marker, name, description, contact, setError)

  useEffect(() => {
    if (bude.data) {
      setName(bude.data.name)
      setDescription(bude.data.description)
      setContact(bude.data.contact)
    }
  }, [bude.data])

  useProtected()

  const handleNext = useCallback(() => {
    if (stage === 'position') {
      if (!marker) {
        toast.error('Tippe auf die Stelle wo eure Bude / Landjugend ist')
        return
      }
      setStage('info')
    } else if (stage === 'info') {
      save()
    }
  }, [marker, save, stage, setStage])

  const handleBack = useCallback(() => {
    if (stage === 'position') {
      router.back()
    } else {
      setStage('position')
    }
  }, [stage, setStage, router])

  return <>
    <Info {...{
      stage,
      setStage,
      name,
      handleNameChange,
      description,
      handleDescriptionChange,
      contact,
      handleContactChange,
      error
    }}/>
    <Navbar stage={stage} loading={isLoading} handleNext={handleNext} handleBack={handleBack}/>
  </>
}

export default AddBude


interface InfoProps {
  stage: Stage,
  name: string,
  handleNameChange: React.ChangeEventHandler<{value: string}>
  description: string,
  handleDescriptionChange: React.ChangeEventHandler<{value: string}>
  contact: string,
  handleContactChange: React.ChangeEventHandler<{value: string}>
  error: {name: boolean, description: boolean, contact: boolean}
}

const Info = ({
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
        Kontakt* (Email oder Nummer)
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
      <div className="p-1"/>
      <div>*Kontakt ist nicht öffentlich sichtbar</div>
    </div>
  </div>
}

interface NavbarProps {
  handleNext: () => void,
  handleBack: () => void,
  stage: Stage,
  loading: boolean
}

const Navbar = ({stage, handleNext, handleBack, loading}: NavbarProps) => {
  return <div className="h-16 grid grid-cols-2 items-center text-xl">
    <button onClick={handleBack} className="flex items-center">
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

const useSave = (
  marker: google.maps.Marker | null,
  name: string,
  description: string,
  contact: string,
  setError: (setter: (prev: Error) => Error) => void
) => {
  const router = useRouter()
  const bude = useBude()
  const {budes} = useMap()

  const options = {onSuccess: async (data: RouterOutputs['bude']['add']) => {
    cacheControl.noCache = true
    await Promise.all([
      budes.refetch(),
      bude.refetch()
    ])
    cacheControl.noCache = false
    router.push(`/?budeId=${data.id}`)
  }}
  const addBude = trpc.bude.add.useMutation(options)
  const updateBude = trpc.bude.update.useMutation(options)

  const save = useCallback(() => {
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
  }, [marker, updateBude, addBude, bude.data, name, description, contact, setError])

  return {
    save,
    isLoading: addBude.isLoading || updateBude.isLoading,
    bude
  }
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