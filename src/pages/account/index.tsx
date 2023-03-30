import {type NextPage} from 'next'
import {useRouter} from '@/utils/router'
import {signOut, useSession} from 'next-auth/react'
import {useCallback, useEffect} from 'react'
import Link from 'next/link'
import {toast} from 'react-hot-toast'

import {cacheControl, trpc} from '@/utils/trpc'
import {useBude} from '@/utils/bude'
import {useMap} from '@/utils/map'
import Back from '@/components/Back'
import {SpinnerSVG} from '@/svg'

const button = 'text-center text-lg border border-slate-600 rounded-xl px-4 py-2'

const Account: NextPage = () => {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session.status === 'loading')
      return
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
    <Back/>
  </div> 
}

export default Account

const Bude = () => {
  const bude = useBude()
  const {budes} = useMap()
  const deleteBude = trpc.bude.delete.useMutation({
    onSuccess: async () => {
      cacheControl.noCache = true
      await Promise.all([
        bude.refetch(),
        budes.refetch()
      ])
      cacheControl.noCache = false
    }, onError: () => {
      toast.error('Bude/Landjugend konnte nicht gelöscht werden')
    }
  })

  const handleDelete = useCallback(() => {
    deleteBude.mutate()
  }, [deleteBude])

  if (bude.isLoading || deleteBude.isLoading) {
    return <div className="grid place-items-center">
      <SpinnerSVG/>
    </div>
  }

  if (!bude.data || !bude.data.active) {
    return <Link href="/account/bude" className={button}>
      Bude oder Landjugend hinzufügen
    </Link>
  }

  return <div className="flex flex-col gap-1">
    <h2 className="text-xl">{bude.data.name}</h2>      
    <div className="ml-4">{bude.data.description}</div>
    <div className="p-1"/>
    <div className="grid grid-cols-2 gap-2">
      <Link href={`/account/bude`} className={button}>
        Bearbeiten
      </Link>
      <button onClick={handleDelete} className={button}>
        Löschen
      </button>
    </div>
  </div>
}