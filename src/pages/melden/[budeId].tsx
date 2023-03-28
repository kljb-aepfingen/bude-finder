import type {NextPage} from 'next'
import {useRouter} from 'next/router'
import {useState, useCallback, useRef} from 'react'
import {toast} from 'react-hot-toast'

import Back from '@/components/Back'
import {LeftSVG, RightSVG, SpinnerSVG} from '@/svg'
import {trpc} from '@/utils/trpc'
import type {RouterOutputs} from '@/utils/trpc'
import {useMap} from '@/utils/map'

import {contactValidator} from '@/utils/validators'

type ReportType = NonNullable<RouterOutputs['report']['types']['types']>[number]
const Melden: NextPage = () => {
  const router = useRouter()
  const {budes, map} = useMap()
  const reportTypes = trpc.report.types.useQuery()
  const addReport = trpc.report.add.useMutation({onSuccess: () => {
    router.push(`/?budeId=${router.query.budeId}`)
  }, onError: () => {
    toast.error('Etwas ist schief gegangen')
    router.push(`/budeId=${router.query.budeId}`)
  }})

  const {budeId} = router.query
  if (typeof budeId !== 'string') {
    router.replace('/')
  } else {
    const bude = budes.data.find(({id}) => id === budeId)
    if (bude) {
      map.setCenter(bude)
      map.setZoom(19)
    } else {
      router.replace('/')
    }
  }

  const [reportType, setReportType] = useState<null | ReportType>(null)
  const [description, setDescription] = useState('')
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [contact, setContact] = useState('')
  const contactRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState({description: false, contact: false})

  const selectReport = useCallback((type: ReportType) => () => {
    setReportType(type)
  }, [])

  const setInfo = useCallback(() => {
    const info: Partial<Record<'description' | 'contact', string>> = {}

    if (descriptionRef.current) {
      info.description = descriptionRef.current.value
      setDescription(info.description)
    }
    if (contactRef.current) {
      info.contact = contactRef.current.value
      setContact(info.contact)
    }

    return info
  }, [])

  const handleBack = useCallback(() => {
    setInfo()
    setReportType(null)
  }, [setInfo])

  const handleSave = useCallback(() => {
    const info = setInfo()
    if (!info || !reportType || !router.query.budeId || typeof router.query.budeId !== 'string') {
      toast.error('Etwas ist schief gegangen')
      return
    }

    const {description, contact} = info
    if (reportType.description && description === '') {
      setError(error => ({...error, description: true}))
      toast.error('Es fehlt eine Beschreibung')
      return
    }
    setError(error => ({...error, description: false}))

    if (reportType.contact && contact === '') {
      setError(error => ({...error, contact: true}))
      toast.error('Es fehlt die Kontaktinformation')
      return
    }
    
    if (reportType.contact && !contactValidator.safeParse(contact).success) {
      toast.error('Kontakt muss eine Email oder eine Nummer sein')
      return
    }
    setError(error => ({...error, contact: false}))


    const data = {
      description,
      contact,
      budeId: router.query.budeId,
      typeId: reportType.id
    }
    addReport.mutate(data)
  }, [setInfo, reportType, router, addReport])

  if (!reportTypes.data) {
    return <>
      <div className="p-4 grid justify-center">
        <SpinnerSVG/>
      </div>
      <Back/>
    </>
  }

  if (!reportTypes.data.types) {
    return <>
      <div className="p-4 grid justify-center text-xl">Du hast diese Bude/Landjugend bereits gemeldet</div>
      <Back/>
    </>
  }

  if (reportType === null) {
    return <>
      <div className="p-4">
        <h1 className="text-4xl">Melden</h1>
        <div className="h-px bg-slate-600 my-4"/>
        <div>Wähle einen Grund</div>
        <div className="p-1"/>
        <ul className="grid grid-cols-1 gap-1">
          {reportTypes.data.types.map(type => <li key={type.id}>
            <button
              onClick={selectReport(type)}
              className="border border-slate-600 p-2 rounded-lg w-full"
            >{type.name}</button>
          </li>)}
        </ul>
      </div>
      <Back/>
    </>
  }

  return <>
    <div className="p-4">
      <h1 className="text-2xl">{reportType.name}</h1>
      <div className="h-px bg-slate-600 my-4"/>
      <div className="grid grid-cols-1">
        {reportType.description && <>
          <label htmlFor="description">Beschreibung</label>
          <textarea
            defaultValue={description}
            name="description"
            id="description"
            rows={6}
            className={`${error.description && 'border-red-600'}`}
            ref={descriptionRef}
          ></textarea>
        </>}
        {reportType.description && reportType.contact && <div className="p-1"/>}
        {reportType.contact && <>
          <label htmlFor="contact">Kontakt</label>
          <input
            defaultValue={contact}
            type="text"
            name="contact"
            id="contact"
            className={`${error.contact && 'border-red-600'}`}
            ref={contactRef}
          />
        </>}
      </div>
    </div>
    <div className="h-16 grid grid-cols-2 items-center text-xl">
      <button onClick={handleBack} className="flex items-center">
        <LeftSVG/>
        <span className="-translate-y-0.5">Zurück</span>
      </button>
      <button
        onClick={handleSave}
        className="flex justify-end items-center disabled:opacity-40"
        disabled={addReport.isLoading}
      >
        {addReport.isLoading && <SpinnerSVG/>}
        <span className="-translate-y-0.5">Speichern</span>
        <RightSVG/>
      </button>
    </div>
  </>
}

export default Melden