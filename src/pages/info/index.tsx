import BackToMap from '@/components/BackToMap'

import type {NextPage} from 'next'

const Info: NextPage = () => {
  return <div className="flex flex-col h-full">
    <main className="flex flex-col p-4">
      <h1 className="text-2xl">Info</h1>
      <div className="h-px bg-slate-600 my-4"/>
      <h2 className="text-lg font-semibold">Warum diese App?</h2>
      <div className="p-1"/>
      <div className="flex flex-col gap-3">
         Wir haben das Problem dass wir bei Flyertouren nie wissen wo sich Buden/Landjugenden
         befinden. Deshalb haben wir diese App entwickelt, sodass sich jede Bude/Landjugend
         eintragen kann. Wenn ihr eine Bude habt einfach mit Google anmelden und
         eure Bude/Landjugend auf der Karte markieren. Ganz einfach
      </div>
    </main>
    <BackToMap/>
  </div>
}
export default Info