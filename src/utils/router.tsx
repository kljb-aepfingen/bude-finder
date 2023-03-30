import {createContext, useContext, useEffect, useRef} from 'react'
import {useRouter as useRouterNext} from 'next/router'
import type {ParsedUrlQuery} from 'querystring'

export type RouterContext = {
  back: () => void,
  push: (url: string) => void,
  replace: (url: string) => void,
  query: ParsedUrlQuery
}
const routerContext = createContext<RouterContext>({} as RouterContext)
export const useRouter = () => useContext(routerContext)

export const RouterProvider = ({children}: {children: React.ReactNode}) => {
  const router = useRouterNext()
  const history = useRef([router.asPath])

  const back = () => {
    if (history.current.length >= 2) {
      router.back()
    } else {
      router.push('/')
    }
  }
  const push = (url: string) => {
    router.push(url)
  }
  const replace = (url: string) => {
    router.replace(url)
  }

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const previous = history.current.at(-2)
      if (previous === url) {
        history.current.splice(-1, 1)
      } else {
        history.current.push(url)
      }
      console.log(history.current)
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  return <routerContext.Provider value={{
    back,
    push,
    replace,
    query: router.query
  }}>
    {children}
  </routerContext.Provider>
}