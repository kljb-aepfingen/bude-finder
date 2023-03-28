import { type NextPage } from "next"
import {useRouter} from 'next/router'
import Head from "next/head"
import {useEffect, useState, useCallback, useRef} from 'react'

import {useMap, type MapContextEvents} from '@/utils/map'
import {cacheControl, trpc} from '@/utils/trpc'

interface Info {
  id: string,
  name: string,
  description: string,
  lat: number,
  lng: number
}

const Home: NextPage = () => {
  const router = useRouter()
  const {addListener, removeListener, budes, map, position} = useMap()
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
    if (position && !budeId.current) {
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
    <Info/>
    <Account/>
    {info.bude &&
      <div className="grid grid-cols-[1fr_auto] p-4 gap-4">
        <h1 className="text-4xl flex flex-wrap">{info.bude.name}</h1>
        <Link href={`/melden/${info.bude.id}`} className="border border-slate-600 p-2 rounded-lg self-start">Melden</Link>
        <div className="text-lg col-span-2">{info.bude.description}</div>
        <Evaluation id={info.bude.id}/>
      </div>
    }
  </>
}

export default Home


import Link from 'next/link'
import {signIn, useSession} from 'next-auth/react'
import {toast} from 'react-hot-toast'

import {AccountSVG, SignUpSVG, InfoSVG, SpinnerSVG, ThumbDownSVG, ThumbUpSVG} from '@/svg'

const classNames = "h-16 w-16 rounded-full ml-auto fixed -z-10 bottom-4 bg-slate-800"

const Account = () => {
  const {status} = useSession()

  if (status === 'authenticated') {
    return <Link href="/account" className={`${classNames} right-4 p-2`}>
      <AccountSVG/>
    </Link>
  }

  return <button onClick={() => signIn('google')} className={`${classNames} right-4 p-3`}>
    <SignUpSVG/>
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
  const evaluation = trpc.eval.get.useQuery({id})
  const options = {onSuccess: async () => {
    cacheControl.noCache = true
    await evaluation.refetch()
    cacheControl.noCache = false
    setSpinner(null)
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

  const loginMessage = useCallback(() => {
    toast.error('Du musst angemeldet sein um eine Bewertungen abgeben zu können')
  }, [])

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

  if (session.status !== 'authenticated') {
    return <div className="grid grid-cols-2 col-span-2 gap-2 h-12">
      <div onClick={loginMessage} className={likeClassNames(false)}>
        {likes._count === 0 ? '' : formater.format(likes._count)}
        <ThumbUpSVG/>
      </div>
      <div onClick={loginMessage} className={likeClassNames(false)}>
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
  return <Link href="/info" className={`${classNames} left-4 p-3`}>
    <InfoSVG/>
  </Link>
}