import type {NextPage} from 'next'
import {useRouter, type NextRouter} from 'next/router'
import {useState, useCallback, useMemo} from 'react'
import {toast} from 'react-hot-toast'

import Back from '@/components/Back'
import {LeftSVG, RightSVG, SpinnerSVG} from '@/svg'
import {trpc} from '@/utils/trpc'
import type {RouterOutputs, RouterHookReturnTypes} from '@/utils/trpc'
import {useMap} from '@/utils/map'
import {useProtected} from '@/utils/protected'

import {contactValidator} from '@/utils/validators'

const caps = {
  description: 400,
  contact: 100
}

type Error = {
  description: boolean,
  contact: boolean
}
type ReportType = NonNullable<RouterOutputs['report']['types']['types']>[number]
const Melden: NextPage = () => {
  useProtected()
  const router = useRouter()
  const budeId = useFindBude(router)
  const reportTypes = trpc.report.types.useQuery(undefined, {onError: () => {
    toast.error('Melde Arten konnten nicht geladen werden')
  }})
  const deleteReport = trpc.report.delete.useMutation({onSuccess: () => {
    reportTypes.refetch()
  }, onError: () => {
    toast.error('Meldung konnte nicht gelöscht werden')
  }})

  const {
    handleSave,
    reportType,
    setReportType,
    description,
    setDescription,
    contact,
    setContact,
    error,
    setError,
    isLoading
  } = useSave(router, reportTypes)


  const handleChange = useCallback((setter: (value: string) => void, max: number) => (event: React.ChangeEvent<{value: string}>) => {
    if (event.currentTarget.value.length <= max) {
      setter(event.currentTarget.value)
    }
  }, [])
  const handleDescriptionChange = useMemo(() => handleChange(setDescription, caps.description), [handleChange, setDescription])
  const handleContactChange = useMemo(() => handleChange(setContact, caps.contact), [handleChange, setContact])

  const handleBack = () => {
    setReportType(null)
    setError({description: false, contact: false})
  }

  return <>
    <Info
      reportTypes={reportTypes.data}
      reportType={reportType}
      setReportType={setReportType}
      description={description}
      handleDescriptionChange={handleDescriptionChange}
      contact={contact}
      handleContactChange={handleContactChange}
      error={error}
      budeId={budeId}
      deleteReport={deleteReport}
    />
    <Navbar handleBack={handleBack} handleSave={handleSave} showSave={!!reportType} isLoading={isLoading} />
  </>
}

const useSave = (
  router: NextRouter,
  reportTypes: RouterHookReturnTypes['report']['types']
) => {
  const [reportType, setReportType] = useState<null | ReportType>(null)
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<Error>({description: false, contact: false})
  
  const addReport = trpc.report.add.useMutation({onSuccess: () => {
    router.push(`/?budeId=${router.query.budeId}`)
    reportTypes.refetch()
  }, onError: () => {
    toast.error('Meldung konnte nicht gespeichert werden')
    router.push(`/?budeId=${router.query.budeId}`)
  }})

  const handleSave = useCallback(() => {
    if (!reportType || !router.query.budeId || typeof router.query.budeId !== 'string') {
      toast.error('Etwas ist schief gegangen')
      return
    }

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
      description: reportType.description ? description : undefined,
      contact: reportType.contact ? contact : undefined,
      budeId: router.query.budeId,
      typeId: reportType.id
    }
    addReport.mutate(data)
  }, [addReport, description, contact, reportType, router.query.budeId])

  return {
    handleSave,
    reportType,
    setReportType,
    description,
    setDescription,
    contact,
    setContact,
    error,
    setError,
    isLoading: addReport.isLoading
  }
}
const useFindBude = (router: NextRouter) => {
  const {budes, map} = useMap()

  const {budeId} = router.query
  if (typeof budeId !== 'string') {
    router.replace('/')
    return ''
  }
  const bude = budes.data.find(({id}) => id === budeId)
  if (!bude) {
    router.replace('/')
    return ''
  }
  map.setCenter(bude)
  map.setZoom(19)
  return budeId
}

type InfoProps = {
  reportTypes: RouterOutputs['report']['types'] | undefined,
  reportType: ReportType | null,
  setReportType: (type: ReportType) => void,
  description: string,
  handleDescriptionChange: React.ChangeEventHandler<{value: string}>,
  contact: string,
  handleContactChange: React.ChangeEventHandler<{value: string}>,
  error: Error,
  budeId: string,
  deleteReport: RouterHookReturnTypes['report']['delete']
}
const Info = ({
  reportTypes,
  reportType,
  setReportType,
  description,
  handleDescriptionChange,
  contact,
  handleContactChange,
  error,
  budeId,
  deleteReport
}: InfoProps) => {
  if (!reportTypes || deleteReport.isLoading) {
    return <div className="p-4 grid justify-center">
      <SpinnerSVG/>
    </div>
  }

  if (!reportTypes.types) {
    return <div className="grid grid-cols-[1fr_auto] p-4 gap-4">
      <div className="text-xl self-center justify-self-center">Du hast diese Bude/Landjugend bereits gemeldet</div>
      <button onClick={() => deleteReport.mutate({budeId})} className="border border-slate-600 p-2 rounded-lg self-start">Löschen</button>
    </div>
  }

  if (reportType === null) {
    return <div className="p-4">
      <h1 className="text-4xl">Melden</h1>
      <div className="h-px bg-slate-600 my-4"/>
      <div>Wähle einen Grund</div>
      <div className="p-1"/>
      <ul className="grid grid-cols-1 gap-1">
        {reportTypes.types.map(type => <li key={type.id}>
          <button
            onClick={() => setReportType(type)}
            className="border border-slate-600 p-2 rounded-lg w-full"
          >{type.name}</button>
        </li>)}
      </ul>
    </div>
  }

  return <div className="p-4">
    <h1 className="text-2xl">{reportType.name}</h1>
    <div className="h-px bg-slate-600 my-4"/>
    <div className="grid grid-cols-1">
      {reportType.description && <>
        <label htmlFor="description" className="flex gap-1 items-center">
          Beschreibung
          <span className="text-sm opacity-70">({description.length}/{caps.description})</span>
        </label>
        <textarea
          value={description}
          name="description"
          id="description"
          rows={6}
          className={`${error.description && 'border-red-600'}`}
          onChange={handleDescriptionChange}
        ></textarea>
      </>}
      {reportType.description && reportType.contact && <div className="p-1"/>}
      {reportType.contact && <>
        <label htmlFor="contact" className="flex gap-1 items-center">
          Kontakt
          <span className="text-sm opacity-70">({contact.length}/{caps.contact})</span>
        </label>
        <input
          value={contact}
          type="text"
          name="contact"
          id="contact"
          className={`${error.contact && 'border-red-600'}`}
          onChange={handleContactChange}
        />
      </>}
    </div>
  </div>
}

type NavbarProps = {
  handleBack: () => void,
  handleSave: () => void,
  showSave: boolean,
  isLoading: boolean
}
const Navbar = ({handleBack, handleSave, isLoading, showSave}: NavbarProps) => {
  if (!showSave) {
    return <Back/>
  }

  return <div className="h-16 grid grid-cols-2 items-center text-xl">
    <button onClick={handleBack} className="flex items-center">
      <LeftSVG/>
      <span className="-translate-y-0.5">Zurück</span>
    </button>
    <button
      onClick={handleSave}
      className="flex justify-end items-center disabled:opacity-40"
      disabled={isLoading}
    >
      {isLoading && <SpinnerSVG/>}
      <span className="-translate-y-0.5">Speichern</span>
      <RightSVG/>
    </button>
  </div>
}

export default Melden