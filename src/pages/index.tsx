import { type NextPage } from "next"
import Head from "next/head"
import {useEffect, useState, useRef, useCallback} from 'react'

import {useMap} from '@/utils/map'
import {trpc} from '@/utils/trpc'

const Home: NextPage = () => {
  const {map} = useMap()
  const {data} = trpc.bude.all.useQuery()
  const [info, setInfo] = useState<{name: string, description: string} | null>(null)

  useEffect(() => {
    if (!data)
      return

    const markers = data.map(({lat, lng, name, description}) => {
      const marker = new google.maps.Marker({map, position: {lat, lng}, title: name})
      google.maps.event.addListener(marker, 'click', () => {
        setInfo({name, description})
      })
      return marker
    })

    const listener = map.addListener('click', () => {
      setInfo(null)
    })

    return () => {
      markers.forEach(marker => marker.setMap(null))
      google.maps.event.removeListener(listener)
    }
  }, [data, map])

  return <>
    <Head>
      <title>Bude Finder</title>
    </Head>
    <Account/>
    <Info info={info}/>
  </>
}

export default Home


import Link from 'next/link'
import {signIn, useSession} from 'next-auth/react'

import {AccountSVG, SignUpSVG} from '@/svg'

const classNames = "h-16 w-16 rounded-full ml-auto fixed bottom-4 right-4 bg-slate-800"

const Account = () => {
  const {status} = useSession()

  if (status === 'authenticated') {
    return <Link href="/account" className={`${classNames} p-2`}>
      <AccountSVG/>
    </Link>
  }

  return <button onClick={() => signIn('google')} className={`${classNames} p-3`}>
    <SignUpSVG/>
  </button>
}


interface InfoProps {
  info: null | {
    name: string,
    description: string
  }
}

const Info = ({info}: InfoProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const prevoius = useRef<InfoProps['info'] | null>(null)

  useEffect(() => {
    if (!ref.current)
      return
    const div = ref.current
    if (info) {
      prevoius.current = info
      div.style.display = 'block'
      div.style.height = 'auto'
      const {height} = div.getBoundingClientRect()
      div.style.height = '0px'
      div.getBoundingClientRect()
      div.style.height = `${height}px`
      return
    }
    div.style.height = '0px'
  }, [info])

  const handleTransitionEnd = useCallback(() => {
    if (ref.current && !info) {
      ref.current.style.display = 'none'
    }
  }, [info])

  return <div onTransitionEnd={handleTransitionEnd} ref={ref} className="overflow-hidden fixed bottom-0 left-0 right-0 bg-slate-800 transition-[height] hidden">
    <div className="grid grid-cols-1 p-4 gap-4">
      <h1 className="text-4xl">{prevoius.current?.name}</h1>
      <div className="text-lg">{prevoius.current?.description}</div>
    </div>
  </div>
}