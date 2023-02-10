import Link from 'next/link'
import {LeftSVG} from '@/svg'

const BackToMap = () => {
  return <Link href="/" className="mt-auto h-16 flex items-center text-xl p-1 bg-white/10">
    <LeftSVG/>
    <span className="-translate-y-0.5">Zurück zur Karte</span>
  </Link>
}

export default BackToMap