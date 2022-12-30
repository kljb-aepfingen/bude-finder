import { type NextPage } from "next"
import Head from "next/head"

const Home: NextPage = () => {
  return <>
    <Head>
      <title>Bude Finder</title>
    </Head>
    <Account/>
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