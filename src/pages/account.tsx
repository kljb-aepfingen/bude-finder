import {type NextPage} from 'next'
import {signOut} from 'next-auth/react'

const Home: NextPage = () => {
  return <main className="text-white flex flex-col h-screen bg-slate-800">
    <button onClick={() => signOut({callbackUrl: '/'})}>Sign Out</button>
  </main>
}

export default Home