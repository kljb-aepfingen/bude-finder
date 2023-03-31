import {LeftSVG} from '@/svg'
import {useRouter} from '@/utils/router'

const Back = (props: {fallback?: string}) => {
  const router = useRouter()

  return <button onClick={() => router.back(props.fallback)} className="mt-auto h-16 flex items-center text-xl w-full">
    <LeftSVG/>
    <span className="-translate-y-0.5">Zurück</span>
  </button>
}

export default Back