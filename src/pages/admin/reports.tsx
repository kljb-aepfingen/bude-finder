import type {NextPage} from 'next'
import Link from 'next/link'
import {useRouter} from 'next/router'
import {useSearchParams} from 'next/navigation'
import {toast} from 'react-hot-toast'
import {useCallback} from 'react'

import {trpc, type RouterHookReturnTypes} from '@/utils/trpc'
import {SpinnerSVG} from '@/svg'

type Query = RouterHookReturnTypes['report']['all']
type Report = Exclude<Query['data'], undefined>[number]
type SQLState = Report['state']
type State = Lowercase<SQLState>
type ModifySearchParams = (modify: (params: URLSearchParams) => void) => void

const Reports: NextPage = () => {
  return <div className="h-screen p-4">
    <h1 className="text-4xl">Reports</h1>
    <div className="p-2"/>
    <Info/>
  </div>
}

const groupSelectClassNames = (selected: boolean) => {
  let names = 'border border-l-0 first-of-type:border-l border-slate-600 first-of-type:rounded-l-lg last-of-type:rounded-r-lg'
  if (selected) {
    names += ' bg-slate-600'
  }
  return names
}

const Info = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const spState = searchParams.get('state')
  const state = (spState && /^unread|read|marked$/.test(spState) ? spState : 'unread') as State
  const budeId = searchParams.get('budeId') ?? undefined
  const userId = searchParams.get('userId') ?? undefined
  const open = searchParams.get('open')

  const reports = trpc.report.all.useQuery({state: state.toUpperCase() as SQLState, budeId, userId}, {
    onError: () => {
      toast.error('Du bist kein Admin')
      router.push('/')
    }
  })

  const modifySearchParams = useCallback<ModifySearchParams>(modify => {
    const newSearchParams = new URLSearchParams(searchParams as unknown as URLSearchParams)
    modify(newSearchParams)
    router.replace(`?${newSearchParams.toString()}`)
  }, [searchParams, router])
  const setState = useCallback(
    (state: State) => modifySearchParams(params => params.set('state', state)),
    [modifySearchParams]
  )
  const handleClick = useCallback((key: string) => () => modifySearchParams(params => {
    if (open === key) {
      params.delete('open')
    } else {
      params.set('open', key)
    }
  }), [modifySearchParams, open])
  const removeBudeFilter = useCallback(() => modifySearchParams(params => params.delete('budeId')), [modifySearchParams])
  const removeUserFilter = useCallback(() => modifySearchParams(params => params.delete('userId')), [modifySearchParams])

  const stateMutation = trpc.report.setState.useMutation({onSuccess: async () => reports.refetch()})

  return <>
    <div className="flex gap-2 items-center">
      <div>Filter</div>
      <ul className="flex">
        {(['unread', 'read', 'marked'] as const).map(s => <li key={s} className={groupSelectClassNames(state === s)}>
          <button className="p-2" onClick={() => setState(s)}>{s[0]?.toUpperCase()}{s.slice(1)}</button>
        </li>)}
      </ul>
      {budeId && <button onClick={removeBudeFilter} className="border border-slate-600 rounded-lg p-2">Bude</button>}
      {userId && <button onClick={removeUserFilter} className="border border-slate-600 rounded-lg p-2">User</button>}
    </div>
    <div className="p-2"/>
    {reports.data == undefined ?
      <SpinnerSVG size={50}/> :
      reports.data.length === 0 ?
        <div>Keine Reports vorhanden.</div> :
        <div className="grid gap-2">{reports.data.map(report => {
          const key = report.budeId + report.userId
          return <Report
            key={key}
            report={report}
            open={open === key}
            handleClick={handleClick(key)}
            modifySearchParams={modifySearchParams}
            stateMutation={stateMutation}/>
          })}
        </div>
    }
  </>
}

type ReportProps = {
  report: Report,
  open: boolean,
  handleClick: () => void,
  modifySearchParams: ModifySearchParams,
  stateMutation: RouterHookReturnTypes['report']['setState']
}
const Report = ({report, open, handleClick, modifySearchParams, stateMutation}: ReportProps) => {
  const filterBudeId = useCallback(() => modifySearchParams(params => {
    params.set('budeId', report.budeId)
  }), [modifySearchParams, report])
  const filterUserId = useCallback(() => modifySearchParams(params => {
    params.set('userId', report.userId)
  }), [modifySearchParams, report])
  const setState = useCallback((state: State) => {
    const sqlState = state.toUpperCase() as SQLState
    if (sqlState === report.state) {
      return
    }
    stateMutation.mutate({
      budeId: report.budeId,
      userId: report.userId,
      state: sqlState
    })
  }, [stateMutation, report])

  return <div className={`border border-slate-600 rounded-lg overflow-hidden`}>
    <div className="grid grid-cols-[auto_auto_1fr_auto] w-full" title={report.bude.name}>
      <button onClick={handleClick} className="p-2 bg-slate-600">{report.createdAt.toLocaleDateString()}</button>
      <span className="p-2 whitespace-nowrap">{report.type.name}</span>
      <span
        className={`whitespace-nowrap text-ellipsis p-2 overflow-hidden justify-self-end ${report.bude.active ? 'text-emerald-400' : 'text-red-600'}`}>
        {report.bude.name}
      </span>
      <button onClick={filterBudeId} className="p-2 bg-slate-600">Filter</button>
    </div>
    {open && <div className="p-2 border-t border-slate-600 grid grid-cols-[auto_1fr] gap-y-1 gap-x-3">
      {report.type.description && <>
        <div className="text-right">Beschreibung</div>
        <div>{report.description}</div>
      </>}
      {report.type.contact && <>
        <div className="text-right">Kontakt</div>
        <div>{report.contact}</div>
      </>}
      <div className="text-right">Bude</div>
      <div>{report.bude.contact}</div>
      <div className="text-right">Gemeldet Von</div>
      <div>
        {report.user.name}
        <button onClick={filterUserId} className="border ml-2 px-2 border-slate-600 rounded-lg">Filter</button>
      </div>
      <div className="col-span-2 py-2 flex gap-3">
        <Link className="border p-2 border-slate-600 rounded-lg" href={`/?budeId=${report.budeId}`}>Auf Karte Zeigen</Link>
        <ul className="flex">
          {(['unread', 'read', 'marked'] as const).map(s => <li key={s} className={groupSelectClassNames(report.state.toLowerCase() === s)}>
            <button className="p-2" onClick={() => setState(s)}>{s[0]?.toUpperCase()}{s.slice(1)}</button>
          </li>)}
        </ul>
      </div>
    </div>}
  </div>
}

export default Reports