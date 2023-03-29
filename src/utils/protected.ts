import {useRouter} from 'next/router'
import {useSession} from 'next-auth/react'
import {useEffect} from 'react'
import {toast} from 'react-hot-toast'

export const useProtected = () => {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session.status !== 'loading' && session.status !== 'authenticated') {
      toast.error('Du musst angemeldet sein um diesen Inhalt sehen zu können')
      router.push('/')
    }
  }, [session.status, router])
}