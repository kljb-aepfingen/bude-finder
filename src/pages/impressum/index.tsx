import type {NextPage} from 'next'
import {useEffect} from 'react'

import Back from '@/components/Back'

const Imprint: NextPage = () => {
  useEffect(() => {
    const {hash} = window.location
    if (hash) {
      window.location.hash = hash
    }
  }, [])

  return <div className="flex flex-col h-full">
    <main className="flex flex-col p-4 flex-1 overflow-auto scroll-p-4">
      <h1 className="text-2xl">Impressum</h1>
      <div className="h-px bg-slate-600 my-4">&nbsp;</div>
      <h2 className="text-lg font-semibold target:text-red-400" id="contact">Kontaktdaten (nach § 5 TMG)</h2>
      <div className="ml-3">
        <p><b>Elias Gerster</b></p>
        <p>Schulstraße 6</p>
        <p>88437 Maselheim</p>
        <p>Deutschland</p>
        <div className="p-1"/>
        <p>Email: <a href="mailto:elias.gerster@outlook.de" className="underline text-sky-400">elias.gerster@outlook.de</a></p>
        <p>Tel: +49 1525 9669987</p>
        <div className="p-1"/>
        <p>
          Plattform der EU zur außergerichtlichen Online-Streitbeilegung <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank" rel="noreferrer"
            className="underline text-sky-400"
          >https://ec.europa.eu/consumers/odr/</a>
        </p>
        <p>Wir sind weder bereit noch verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </div>
    </main>
    <Back/>
  </div>
}
export default Imprint