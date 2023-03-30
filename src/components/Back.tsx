import {LeftSVG} from '@/svg'
import {useRouter} from '@/utils/router'

const Back = () => {
  const router = useRouter()

  return <button onClick={() => router.back()} className="mt-auto h-16 flex items-center text-xl w-full">
    <LeftSVG/>
    <span className="-translate-y-0.5">Zurück</span>
  </button>
}

export default Back