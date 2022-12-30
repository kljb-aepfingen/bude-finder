import {type NextPage} from 'next'
import Link from 'next/link'
import {useEffect, useCallback, useRef, useState} from 'react'

import {useMap} from '@/utils/map'
import {LeftSVG, RightSVG, DownSVG} from '@/svg'

type Stage = 'position' | 'info'

const AddBude: NextPage = () => {
  const {marker, stage, setStage} = useAddBude()

  const handleNext = useCallback(() => {
    setStage('info')
  }, [setStage])

  return <>
    <Info stage={stage} setStage={setStage}/>
    <Navbar disableNext={!marker} onNext={handleNext}/>  
  </>
}

export default AddBude


interface InfoProps {
  stage: Stage,
  setStage: (stage: Stage) => void
}

const Info = ({setStage, stage}: InfoProps) => {
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

  return <div onTransitionEnd={handleTransitionEnd} ref={ref} className="overflow-hidden transition-[height] hidden">
    <div className="grid grid-cols-1">
      <button onClick={handleDown} className="bg-slate-700 grid place-items-center">
        <DownSVG/>
      </button>
      <form className="grid grid-cols-1 p-4">
        <label htmlFor="name">Name der Bude/Landjugend</label>
        <input type="text" name="name" id="name"/>
        <div className="p-1"/>
        <label htmlFor="description">Beschreibt euch ein wenig</label>
        <textarea name="description" rows={6} id="description"></textarea>
      </form>
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
    <button disabled={disableNext} onClick={onNext} className="text-xl flex justify-end items-center">
      <span className="-translate-y-0.5">{disableNext ? 'Plaziere einen Marker' : 'Weiter'}</span>
      <RightSVG/>
    </button>
  </div>
}



const useAddBude = () => {
  const {map} = useMap()
  const [stage, setStage] = useState<Stage>('position')
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)

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