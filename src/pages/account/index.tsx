import {type NextPage} from 'next'
import {useRouter} from 'next/router'
import {signOut, useSession} from 'next-auth/react'
import {useCallback, useEffect} from 'react'
import Link from 'next/link'

import {trpc} from '@/utils/trpc'

const button = 'text-center text-lg border border-slate-600 rounded-xl px-4 py-2'

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
      <div className="h-px bg-slate-600 my-4"/>
      <div className="flex flex-col gap-3">
        <Bude/>
        <button className={button} onClick={() => signOut({callbackUrl: '/'})}>Sign Out</button>
      </div>
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
  const mutation = trpc.bude.delete.useMutation({
    onSuccess: () => {
      bude.refetch()
    }
  })

  const handleDelete = useCallback(() => {
    mutation.mutate()
  }, [mutation])

  if (bude.data) {
    return <div className="flex flex-col gap-1">
      <h2 className="text-xl">{bude.data.name}</h2>      
      <div className="ml-4">{bude.data.description}</div>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/account/bude?info=${JSON.stringify(bude.data)}`} className={button}>
          Bearbeiten
        </Link>
        <button onClick={handleDelete} className={button}>
          Löschen
        </button>
      </div>
    </div>
  }

  return <Link href="/account/bude" className={button}>
    Bude oder Landjugend hinzufügen
  </Link>
}