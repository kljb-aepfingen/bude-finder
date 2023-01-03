import { type NextPage } from "next"
import Head from "next/head"
import {useEffect, useState, useRef, useCallback} from 'react'

import {useMap} from '@/utils/map'
import {cacheControl, trpc} from '@/utils/trpc'

const Home: NextPage = () => {
  const {map} = useMap()
  const {data} = trpc.bude.all.useQuery()
  const [info, setInfo] = useState<InfoProps['info'] | null>(null)

  useEffect(() => {
    if (!data)
      return

    const markers = data.map(({lat, lng, name, description, id}) => {
      const marker = new google.maps.Marker({map, position: {lat, lng}, title: name})
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
    description: string,
    id: string
  }
}


const Info = ({info}: InfoProps) => {
  const [previous, setPrevious] = useState<InfoProps['info']>(null)
  const ref = useRef<HTMLDivElement>(null)
  const lastHeight = useRef(0)
  const [loader, setLoader] = useState(false)

  useEffect(() => {
    if (!ref.current)
      return
    if (info) {
      setPrevious(info)
      ref.current.style.display = 'block'
      ref.current.style.height = 'auto'
      const {height} = ref.current.getBoundingClientRect()
      if (lastHeight.current === 0) {
        ref.current.style.height = '0px'
        ref.current.getBoundingClientRect()
      }
      ref.current.style.height = `${height}px`
      lastHeight.current = height
    } else {
      lastHeight.current = 0
      ref.current.style.height = '0px'
    }
  }, [info])

  const handleTransitionEnd = useCallback(() => {
    if (ref.current && !info) {
      ref.current.style.display = 'none'
    }
  }, [info])
  
  return <div ref={ref} onTransitionEnd={handleTransitionEnd} className="overflow-hidden fixed bottom-0 left-0 right-0 bg-slate-800 transition-[height] hidden">
    <div className="grid grid-cols-1 p-4 gap-4">
      <h1 className="text-4xl flex flex-wrap">
        {loader && <SpinnerSVG/>}
        {info?.name ?? previous?.name}
      </h1>
      <div className="text-lg">{info?.description ?? previous?.description}</div>
      {info && <Eval id={info.id} setLoader={setLoader}/>}
    </div>
  </div>
}

import {SpinnerSVG} from '@/svg'

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

const Eval = ({id, setLoader}: {id: string, setLoader: (value: boolean) => void}) => {
  const evaluation = trpc.eval.get.useQuery({id}, {
    onSuccess: () => {
      cacheControl.noCache = false
      setLoader(false)
    }
  })
  const options = {
    onSuccess: () => {
      cacheControl.noCache = true
      evaluation.refetch()
    }
  }
  const setEvaluation = trpc.eval.set.useMutation(options)
  const updateEvaluation = trpc.eval.update.useMutation(options)
  const deleteEvaluation = trpc.eval.delete.useMutation(options)

  const session = useSession()

  const handleClick = useCallback((like: boolean) => () => {
    if (!evaluation.data)
      return
    setLoader(true)
    if (!evaluation.data.own) {
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
    setLoader,
    id
  ])

  if (!evaluation.data) {
    return <SpinnerSVG/>
  }

  const {dislikes, likes, own} = evaluation.data
  const disabled =
    evaluation.isLoading ||
    setEvaluation.isLoading ||
    updateEvaluation.isLoading ||
    deleteEvaluation.isLoading

  if (session.status !== 'authenticated') {
    return <div className="grid grid-cols-2 gap-2">
      <div className={likeClassNames(false)}>
        {likes._count === 0 ? '' : formater.format(likes._count)}
        👍
      </div>
      <div className={likeClassNames(false)}>
        {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
        👎
      </div>
    </div>
  }
  
  return <div className="grid grid-cols-2 gap-2">
    <button
      disabled={disabled}
      onClick={handleClick(true)}
      className={likeClassNames(own?.like === true)}
    >
      {likes._count === 0 ? '' : formater.format(likes._count)}
      👍
    </button>
    <button
      disabled={disabled}
      onClick={handleClick(false)}
      className={likeClassNames(own?.like === false)}
    >
      {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
      👎
    </button>
  </div>
}