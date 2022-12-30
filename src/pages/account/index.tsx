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

import {LeftSVG} from '@/svg'

const BackToMap = () => {
  return <Link href="/" className="mt-auto h-16 flex items-center text-xl p-1 bg-white/10">
    <LeftSVG/>
    <span className="-translate-y-0.5">Zurück zur Karte</span>
  </Link>
}

const Bude = () => {
  const bude = trpc.bude.own.useQuery()

  if (bude.data) {
    return <div>{bude.data.name}</div>
  }

  return <Link href="/account/bude">
    Bude oder Landjugend hinzufügen
  </Link>
}