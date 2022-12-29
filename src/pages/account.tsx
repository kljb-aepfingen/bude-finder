import {type NextPage} from 'next'
import {useRouter} from 'next/router'
import {signOut, useSession} from 'next-auth/react'
import {useEffect} from 'react'
import Link from 'next/link'

import {trpc} from '@/utils/trpc'

const Account: NextPage = () => {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session.status !== 'authenticated') {
      router.push('/')
    }
  }, [session, router])

  if (!session.data || !session.data.user)
    return null

  const {user} = session.data

  return <div className="flex flex-col h-full">
    <main className="flex flex-col p-4">
      <h1 className="text-2xl">{user.name ?? 'Kein Name'}</h1>
      <div className="h-px bg-white/40 my-4"/>
      <Bude/>
      <button onClick={() => signOut({callbackUrl: '/'})}>Sign Out</button>
    </main>
    <BackToMap/>
  </div> 
}

export default Account

const BackToMap = () => {
  return <Link href="/" className="mt-auto h-16 flex items-center text-xl p-1 bg-white/10">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor" className="h-12 w-12">
      <path d="M28.05 36 16 23.95 28.05 11.9l2.15 2.15-9.9 9.9 9.9 9.9Z"/>
    </svg>
    <span className="-translate-y-0.5">Zurück zur Karte</span>
  </Link>
}

const Bude = () => {
  const bude = trpc.bude.own.useQuery()

  if (bude.data) {
    return <div>{bude.data.name}</div>
  }

  return <Link href="">
    Bude oder Landjugend hinzufügen
  </Link>
}