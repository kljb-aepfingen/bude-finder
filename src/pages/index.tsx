import { type NextPage } from "next"
import Head from "next/head"
import {useEffect, useState, useCallback} from 'react'

import {useMap} from '@/utils/map'
import {cacheControl, trpc} from '@/utils/trpc'

import {budeMarker} from '@/utils/marker'

interface Info {
  id: string,
  name: string,
  description: string
}

const Home: NextPage = () => {
  const {map} = useMap()
  const {data} = trpc.bude.all.useQuery()
  const [info, setInfo] = useState<Info | null>(null)

  useEffect(() => {
    if (!data)
      return

    const markers = data.map(({lat, lng, name, description, id}) => {
      const marker = budeMarker(map, {lat, lng}, name)
      google.maps.event.addListener(marker, 'click', () => {
        setInfo({name, description, id})
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
    <Info/>
    <Account/>
    {info &&
      <div className="grid grid-cols-1 p-4 gap-4">
        <h1 className="text-4xl flex flex-wrap">{info.name}</h1>
        <div className="text-lg">{info.description}</div>
        <Evaluation id={info.id}/>
      </div>
    }
  </>
}

export default Home


import Link from 'next/link'
import {signIn, useSession} from 'next-auth/react'
import {toast} from 'react-hot-toast'

import {AccountSVG, SignUpSVG, InfoSVG, SpinnerSVG} from '@/svg'

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
  let names = 'border border-slate-600 p-2 rounded-full text-center'
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
    return <div className="grid grid-cols-2 gap-2 h-12">
      <div onClick={loginMessage} className={likeClassNames(false)}>
        {likes._count === 0 ? '' : formater.format(likes._count)}
        👍
      </div>
      <div onClick={loginMessage} className={likeClassNames(false)}>
        {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
        👎
      </div>
    </div>
  }
  
  return <div className="grid grid-cols-2 gap-2 h-12">
    <button
      disabled={disabled}
      onClick={handleClick(true)}
      className={likeClassNames(own?.like === true)}
    >
      {spinner === true && <SpinnerSVG size={20}/>}
      {likes._count === 0 ? '' : formater.format(likes._count)}
      👍
    </button>
    <button
      disabled={disabled}
      onClick={handleClick(false)}
      className={likeClassNames(own?.like === false)}
    >
      {spinner === false && <SpinnerSVG size={20}/>}
      {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
      👎
    </button>
  </div>
}


const Info = () => {
  return <Link href="/info" className={`${classNames} left-4 p-3`}>
    <InfoSVG/>
  </Link>
}