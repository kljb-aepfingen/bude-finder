import type {NextPage} from 'next'
import Link from 'next/link'
import {useEffect} from 'react'

import Back from '@/components/Back'

const Info: NextPage = () => {
  useEffect(() => {
    const {hash} = window.location
    if (hash) {
      window.location.hash = hash
    }
  }, [])

  return <div className="flex flex-col h-full">
    <main className="flex flex-col flex-1 p-4 overflow-auto scroll-p-4">
      <h1 className="text-2xl">Info</h1>
      <div className="h-px bg-slate-600 my-4">&nbsp;</div>
      <ol className="counter-dec">
        <li>
          <h2 id="warum">Warum diese App?</h2>
          <p>
            Wir haben das Problem, dass wir bei Flyertouren nie wissen, wo sich Buden/Landjugenden
            befinden. Deshalb haben wir diese App entwickelt, sodass sich jede Bude/Landjugend
            eintragen kann. Wenn ihr eine Bude habt einfach mit Google anmelden und
            eure Bude/Landjugend auf der Karte markieren. Ganz einfach
          </p>
        </li>
        <li>
          <h2 id="feedback">Feedback</h2>
          <p>
            Wenn ihr irgendwelche Fehler in unserer App entdeckt, egal ob Schreibfehler oder nicht funktionierende Funktionen,
            meldet euch gerne bei uns. Unsere Kontaktdaten findet ihr im Impressum.
          </p>
        </li>
        <li>
          <h2 id="daten">Eure Daten</h2>
          <p>Welche Daten speichern wir und welche nicht:</p>
          <ol className="counter-alph">
            <li>
              <h3 id="daten-standort">Dein Standort</h3> wird
              nur local auf deinem Handy gespeichert und wird dazu genutzt dir deinen Standort auf
              der Karte anzeigen zu lassen. Wir senden <b>keine</b> Standorte zu unseren Servern und
              speichern sie somit auch <b>nicht</b>.
            </li>
            <li>
              <h3 id="daten-anmeldung">Deine Anmelde Daten</h3> bekommen wir von
              Google und speichern somit deine Google Email, dein Google Name und den Link zu
              deinem Google Profilbild, falls du eins hast. Die wird allerdings nirgends auf
              unserer Seite angezeigt und ist nur für unseren Admin sichtbar.
            </li>
            <li>
              <h3 id="daten-bude">Deine Bude Daten</h3> speichern wir natürlich
              komplet auf unseren Servern. Dabei ist wichtig dass deine angegebene Kontaktinformation
              <b>nicht</b> für andere sichtbar ist, außer für unseren Admin. Ihr werdet
              eventuel darüber kontaktiert, falls eure Bude/Landjugend gemeldet wird.
            </li>
            <li>
              <h3 id="daten-bewertung">Deine Bewertungen</h3> sind natürlich für alle
              sichtbar, es sieht aber keine wer diese Bewertungen gemacht hat, außer unser Admin.
            </li>
            <li>
              <h3 id="daten-meldung">Deine Meldungen</h3> sind <b>nicht</b> anonym.
              Die gemeldete Bude/Landjugend kann allerdings nicht sehen von wem sie gemeldet wurde.
              Lediglich unser Admin sieht wer du bist, zuminderst sieht er dein Google Name.
              Dies wird aus mehreren Gründen gemacht:
              <ul className="list-disc ml-3">
                <li>Um zu verhindern dass jemand die gleiche Bude/Landjugen mehrmals meldet</li>
                <li>Um zu sehen ob jemand wahrlos Buden/Landjugenden meldet</li>
                <li>Um die Möglichkeit zu bieten eigene Meldungen wieder zu löschen</li>
              </ul>
              Auch die angegebenen Daten in einer Meldung kann nur unser Admin sehen und setzt sich dann gegebenenfalls
              mit dem Melder und/oder der gemeldeten Bude/Landjugend in verbindung.
            </li>
          </ol>
        </li>
      </ol>
    </main>
    <div className="flex p-4 gap-8 justify-center">
      <Link href="/impressum" className="underline text-sky-400">Impressum</Link>
      <Link href="/datenschutz" className="underline text-sky-400">Datenschutzerklärung</Link>
    </div>
    <Back/>
  </div>
}
export default Info