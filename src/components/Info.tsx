import {useState, useRef, useEffect, useCallback} from 'react'
import {useSession} from 'next-auth/react'

import {SpinnerSVG} from '@/svg'
import {trpc, cacheControl} from '@/utils/trpc'

export interface InfoProps {
  info: null | {
    name: string,
    description: string,
    id: string
  }
}

const Info = ({info}: InfoProps) => {
  const [loader, setLoader] = useState(false)
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [previous, setPrevious] = useState<InfoProps['info']>(null)

  useEffect(() => {
    if (!outerRef.current) {
      return
    }

    const outer = outerRef.current
    if (info) {
      outer.style.display = 'block'
      return
    }

    outer.style.height = ''
  }, [info])

  const handleTransitionEnd = useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
    if (outerRef.current && !info) {
      outerRef.current.style.display = ''
    }
  }, [info])

  useEffect(() => {
    if (!innerRef.current) {
      return
    }

    const observer = new ResizeObserver(entries => {
      entries.forEach(entrie => {
        if (outerRef.current && info) {
          outerRef.current.style.height = `${entrie.contentRect.height}px`
        }
      })
    })
    observer.observe(innerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [info])

  return <div
    ref={outerRef}
    onTransitionEnd={handleTransitionEnd}
    className="overflow-hidden hidden h-0 fixed bottom-0 left-0 right-0 bg-slate-800 transition-[height]"
  >
    <div ref={innerRef}>
      <div className="flex flex-col p-4 gap-4">
        <InfoDisplay info={info} previous={previous} setPrevious={setPrevious}/>
        {previous && <Evaluation id={info?.id ?? previous.id} setLoader={setLoader}/>}
      </div>
    </div>
  </div>
}

export default Info


interface InfoDisplayProps {
  info: InfoProps['info'],
  previous: InfoProps['info'],
  setPrevious: (value: InfoProps['info']) => void
}

const infoDisplayClasses = 'flex-col gap-4 col-start-1 row-start-1 transition-opacity'
const InfoDisplay = ({info, previous, setPrevious}: InfoDisplayProps) => {
  const baseRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!baseRef.current || !transitionRef.current || !info) {
      return
    }

    if (!previous) {
      setPrevious(info)
      return
    }

    if (previous !== info) {
      baseRef.current.style.opacity = '0'
      baseRef.current.style.transition = 'none'
      baseRef.current.getBoundingClientRect()
      baseRef.current.style.transition = ''
      baseRef.current.style.opacity = '1'
      transitionRef.current.style.display = 'flex'
      transitionRef.current.style.opacity = '1'
      transitionRef.current.getBoundingClientRect()
      transitionRef.current.style.opacity = '0'
    }
  }, [info, previous, setPrevious])

  const handleTransitionEnd = useCallback(() => {
    if (transitionRef.current && info && info !== previous) {
      setPrevious(info)
      transitionRef.current.style.display = 'none'
    }
  }, [info, previous, setPrevious])

  useEffect(() => {
    if (!baseRef.current) {
      return
    }

    const observer = new ResizeObserver(entries => {
      entries.forEach(entrie => {
        if (wrapperRef.current) {
          wrapperRef.current.style.height = `${entrie.contentRect.height}px`
        }
      })
    })
    observer.observe(baseRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return <div ref={wrapperRef} className="grid h-0 overflow-hidden items-start transition-[height]">
    <div
      ref={baseRef}
      className={`flex ${infoDisplayClasses}`}
    >
      <h1 className="text-4xl flex flex-wrap">{info?.name ?? previous?.name}</h1>
      <div>{info?.description ?? previous?.description}</div>
    </div>
    <div
      ref={transitionRef}
      onTransitionEnd={handleTransitionEnd}
      className={`hidden ${infoDisplayClasses}`}
    >
      <h1 className="text-4xl flex flex-wrap">{previous?.name}</h1>
      <div>{previous?.description}</div>
    </div>
  </div>
}


interface EvaluationProps {
  id: string,
  setLoader: (value: boolean) => void
}

const formater = Intl.NumberFormat('de', {
  notation: 'compact'
})
const likeClasses = (selected: boolean) => {
  let names = 'border border-slate-600 p-2 rounded-full text-center'
  if (selected) {
    names += ' bg-slate-600'
  }
  return names
}

const Evaluation = ({id, setLoader}: EvaluationProps) => {
  const session = useSession()
  const evaluation = trpc.eval.get.useQuery({id})
  const options = {onSuccess: () => {
    setLoader(false)
    cacheControl.noCache = false
  }}
  const setEvaluation = trpc.eval.set.useMutation(options)
  const updateEvaluation = trpc.eval.update.useMutation(options)
  const deleteEvaluation = trpc.eval.delete.useMutation(options)

  const handleClick = useCallback((like: boolean) => () => {
    if (!evaluation.data) {
      return
    }

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
    setEvaluation,
    deleteEvaluation,
    updateEvaluation,
    setLoader,
    id
  ])

  if (!evaluation.data) {
    return <SpinnerSVG/>
  }

  const {dislikes, likes, own} = evaluation.data

  if (session.status !== 'authenticated') {
    return <div className="grid grid-cols-2 gap-2">
      <div className={likeClasses(false)}>
        {likes._count === 0 ? '' : formater.format(likes._count)}
        👍
      </div>
      <div className={likeClasses(false)}>
        {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
        👎
      </div>
    </div>
  }

  const disabled =
    evaluation.isLoading ||
    setEvaluation.isLoading ||
    updateEvaluation.isLoading ||
    deleteEvaluation.isLoading

  return <div className="grid grid-cols-2 gap-2">
    <button
      disabled={disabled}
      onClick={handleClick(true)}
      className={likeClasses(own?.like === true)}
    >
      {likes._count === 0 ? '' : formater.format(likes._count)}
      👍
    </button>
    <button
      disabled={disabled}
      onClick={handleClick(false)}
      className={likeClasses(own?.like === false)}
    >
      {dislikes._count === 0 ? '' : formater.format(dislikes._count)}
      👎
    </button>
  </div>
}