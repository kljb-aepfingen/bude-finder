import { type NextPage } from "next"
import {useRouter} from '@/utils/router'
import {signIn, useSession} from 'next-auth/react'
import Head from "next/head"
import {useEffect, useState, useCallback, useRef} from 'react'

import {useMap, type MapContextEvents} from '@/utils/map'
import {cacheControl, trpc} from '@/utils/trpc'

const notAuthenticated = () => {
  toast.error('Du musst angemeldet sein um eine Bewertungen abgeben zu können')
}

interface Info {
  id: string,
  name: string,
  description: string,
  lat: number,
  lng: number
}

const Home: NextPage = () => {
  const session = useSession()
  const router = useRouter()
  const {addListener, removeListener, budes, map, position} = useMap()
  const firstPosition = useRef(position)
  const budeId = useRef(typeof router.query.budeId === 'string' ? router.query.budeId : null)
  const [info, setInfo] = useState<{
    bude: null | Parameters<MapContextEvents['select']>[0],
    id: null | string
  }>({bude: null, id: budeId.current})

  if (info.id && !info.bude) {
    const bude = budes.data.find(({id}) => id === info.id)
    if (bude) {
      setInfo({bude, id: bude.id})
      map.setCenter(bude)
      map.setZoom(19)
    } else {
      router.replace('/')
    }
  }

  useEffect(() => {
    if (position && !firstPosition.current && !budeId.current) {
      map.setCenter(position.latLng)
      map.setZoom(position.zoom)
    }
  }, [position, map])
  
  useEffect(() => {
    const select: MapContextEvents['select'] = (bude) => {
      router.replace(`/?budeId=${bude.id}`)
      setInfo({bude, id: bude.id})
      map.setCenter(bude)
      const zoom = map.getZoom()
      if (zoom === 19) {
        map.setZoom(19.1)
      } else {
        map.setZoom(19)
      }
    }
    const deselect: MapContextEvents['deselect'] = () => {
      router.replace('/')
      setInfo({bude: null, id: null})
    }
    addListener('select', select)
    addListener('deselect', deselect)

    return () => {
      removeListener('select', select)
      removeListener('deselect', deselect)
    }
  }, [addListener, removeListener, router, map])

  return <>
    <Head>
      <title>Bude Finder</title>
    </Head>
    <div className="fixed bottom-0 left-0 right-0 -z-10">
      <div className="max-w-2xl w-full mx-auto relative">
        <Info/>
        <Account/>
      </div>
    </div>
    {info.bude &&
      <div className="col-start-1 row-start-1 grid grid-cols-[1fr_auto] p-4 gap-4">
        <h1 className="text-4xl flex flex-wrap">{info.bude.name}</h1>
        {session.status === 'authenticated' &&
          <Link href={`/melden/${info.bude.id}`} className="border border-slate-600 p-2 rounded-lg self-start">Melden</Link>}
        {session.status !== 'authenticated' &&
          <button onClick={notAuthenticated} className="border border-slate-600 p-2 rounded-lg self-start">Melden</button>}
        <div className="text-lg col-span-2">{info.bude.description}</div>
        <Evaluation id={info.bude.id}/>
      </div>
    }
  </>
}

export default Home


import Link from 'next/link'
import {toast} from 'react-hot-toast'

import {SpinnerSVG, ThumbDownSVG, ThumbUpSVG} from '@/svg'

const classNames = "ml-auto absolute bottom-6 rounded-lg text-xl bg-slate-800 shadow-2xl px-4 py-2"

const Account = () => {
  const {status} = useSession()

  if (status === 'authenticated') {
    return <Link href="/account" className={`${classNames} right-4`}>
      Account
    </Link>
  }

  return <button onClick={() => signIn('google')} className={`${classNames} right-4`}>
    Anmelden
  </button>
}


const formater = Intl.NumberFormat('de', {
  notation: 'compact'
})
const likeClassNames = (selected: boolean) => {
  let names = 'border border-slate-600 p-2 rounded-full text-center flex justify-center items-center gap-1'
  if (selected) {
    names += ' bg-slate-600'
  }
  return names
}

const Evaluation = ({id}: {id: string}) => {
  const evaluation = trpc.eval.get.useQuery({id}, {onError: () => {
    toast.error('Bewertungen konnten nicht geladen werden')
  }})
  const options = {onSuccess: async () => {
    cacheControl.noCache = true
    await evaluation.refetch()
    cacheControl.noCache = false
    setSpinner(null)
  }, onError: () => {
    toast.error('Bewertung konnte nicht gespeichert werden')
  }}
  const setEvaluation = trpc.eval.set.useMutation(options)
  const updateEvaluation = trpc.eval.update.useMutation(options)
  const deleteEvaluation = trpc.eval.delete.useMutation(options)

  const session = useSession()
  const [spinner, setSpinner] = useState<null | boolean>(null)

  const handleClick = useCallback((like: boolean) => () => {
    if (!evaluation.data || !evaluation.data.own)
      return
    setSpinner(like)
    if (evaluation.data.own.like === null) {
      setEvaluation.mutate({id, like})
      return
    }
    if (evaluation.data.own.like === like) {
      deleteEvaluation.mutate({id})
      return
    }
    updateEvaluation.mutate({id, like})
  }, [
    evaluation,
    updateEvaluation,
    setEvaluation,
    deleteEvaluation,
    id
  ])

  const {dislikes, likes, own} = evaluation.data ?? {dislikes: {_count: 0}, likes: {_count: 0}, own: null}
  const disabled =
    evaluation.isLoading ||
    setEvaluation.isLoading ||
    updateEvaluation.isLoading ||
    deleteEvaluation.isLoading

  if (session.status === 'authenticated' && !own) {
    cacheControl.noCache = true
    evaluation.refetch()
      .then(() => {
        cacheControl.noCache = false
      })
  }

  if (evaluation.isLoading) {
    return <div className="grid h-12 col-span-2 place-items-center">
      <SpinnerSVG/>
    </div>
  }

  if (session.status !== 'authenticated') {
    return <div className="grid grid-cols-2 col-span-2 gap-2 h-12">
      <div onClick={notAuthenticated} className={likeClassNames(false)}>
        {likes._count === 0 ? '' : formater.format(likes._count)}
        <ThumbUpSVG/>
      </div>
      <div onClick={notAuthenticated} className={likeClassNames(false)}>
        {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
        <ThumbDownSVG/>
      </div>
    </div>
  }
  
  return <div className="grid grid-cols-2 col-span-2 gap-2 h-12">
    <button
      disabled={disabled}
      onClick={handleClick(true)}
      className={likeClassNames(own?.like === true)}
    >
      {likes._count === 0 ? '' : formater.format(likes._count)}
      <ThumbUpSVG/>
      {spinner === true && <SpinnerSVG size={20}/>}
    </button>
    <button
      disabled={disabled}
      onClick={handleClick(false)}
      className={likeClassNames(own?.like === false)}
    >
      {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
      <ThumbDownSVG/>
      {spinner === false && <SpinnerSVG size={20}/>}
    </button>
  </div>
}


const Info = () => {
  return <Link href="/info" className={`${classNames} left-4`}>
    Infos
  </Link>
}