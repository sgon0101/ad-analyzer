import { useState, useEffect, useRef } from 'react'
import Header from './components/Header.jsx'
import UploadSection from './components/UploadSection.jsx'
import LoadingSection from './components/LoadingSection.jsx'
import ResultSection from './components/result/ResultSection.jsx'
import { toBase64 } from './constants.js'

const PHASE = { UPLOAD: 'upload', LOADING: 'loading', RESULT: 'result' }

export default function App() {
  const [phase, setPhase] = useState(PHASE.UPLOAD)
  const [fileHigh, setFileHigh] = useState(null)
  const [fileLow, setFileLow]   = useState(null)
  const [urlHigh, setUrlHigh]   = useState(null)
  const [urlLow, setUrlLow]     = useState(null)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const stepTimer = useRef(null)

  function handleFileHigh(file) {
    if (urlHigh) URL.revokeObjectURL(urlHigh)
    setFileHigh(file)
    setUrlHigh(URL.createObjectURL(file))
  }
  function handleFileLow(file) {
    if (urlLow) URL.revokeObjectURL(urlLow)
    setFileLow(file)
    setUrlLow(URL.createObjectURL(file))
  }

  async function startAnalysis() {
    setError(null)
    setStepIndex(0)
    setPhase(PHASE.LOADING)

    stepTimer.current = setInterval(() => {
      setStepIndex(prev => Math.min(prev + 1, 3))
    }, 1800)

    try {
      const [imageHigh, imageLow] = await Promise.all([toBase64(fileHigh), toBase64(fileLow)])

      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageHigh,
          imageLow,
          mediaTypeHigh: fileHigh.type || 'image/jpeg',
          mediaTypeLow:  fileLow.type  || 'image/jpeg',
        }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `API 오류 (${resp.status})`)

      clearInterval(stepTimer.current)
      setStepIndex(4)
      setTimeout(() => {
        setResult(data)
        setPhase(PHASE.RESULT)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 500)
    } catch (err) {
      clearInterval(stepTimer.current)
      setError('오류: ' + err.message + ' — API 키와 크레딧을 확인해 주세요.')
      setPhase(PHASE.UPLOAD)
    }
  }

  function resetAll() {
    if (urlHigh) URL.revokeObjectURL(urlHigh)
    if (urlLow)  URL.revokeObjectURL(urlLow)
    setFileHigh(null); setFileLow(null)
    setUrlHigh(null);  setUrlLow(null)
    setResult(null); setError(null)
    setStepIndex(0)
    setPhase(PHASE.UPLOAD)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => () => clearInterval(stepTimer.current), [])

  return (
    <div className="app">
      <Header />
      {phase === PHASE.UPLOAD && (
        <UploadSection
          fileHigh={fileHigh} fileHighUrl={urlHigh}
          fileLow={fileLow}   fileLowUrl={urlLow}
          onFileHigh={handleFileHigh}
          onFileLow={handleFileLow}
          onAnalyze={startAnalysis}
          error={error}
        />
      )}
      {phase === PHASE.LOADING && <LoadingSection stepIndex={stepIndex} />}
      {phase === PHASE.RESULT && result && (
        <ResultSection
          result={result}
          urlHigh={urlHigh}
          urlLow={urlLow}
          onReset={resetAll}
        />
      )}
    </div>
  )
}
