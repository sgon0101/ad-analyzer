import { useState, useEffect, useRef } from 'react'
import Header from './components/Header.jsx'
import UploadSection from './components/UploadSection.jsx'
import LoadingSection from './components/LoadingSection.jsx'
import ResultSection from './components/result/ResultSection.jsx'
import { toBase64 } from './constants.js'

const PHASE = { UPLOAD: 'upload', UPLOADING: 'uploading', LOADING: 'loading', RESULT: 'result' }

export default function App() {
  const [phase, setPhase]           = useState(PHASE.UPLOAD)
  const [fileHigh, setFileHigh]     = useState(null)
  const [fileLow, setFileLow]       = useState(null)
  const [urlHigh, setUrlHigh]       = useState(null)
  const [urlLow, setUrlLow]         = useState(null)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  const [stepIndex, setStepIndex]   = useState(0)
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

  const hasVideo = fileHigh?.type?.startsWith('video/') || fileLow?.type?.startsWith('video/')

  // ── 영상 → Cloudinary 직접 업로드 (Vercel 통과 없음) ──────────────────────
  async function uploadVideoToCloudinary(file, sig) {
    const form = new FormData()
    form.append('file',      file)
    form.append('api_key',   sig.apiKey)
    form.append('timestamp', String(sig.timestamp))
    form.append('signature', sig.signature)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`,
      { method: 'POST', body: form }
    )
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message || `Cloudinary 업로드 실패 (${res.status})`)
    }
    return res.json()
  }

  async function startAnalysis() {
    setError(null)
    setStepIndex(0)

    const isVideoHigh = fileHigh?.type?.startsWith('video/')
    const isVideoLow  = fileLow?.type?.startsWith('video/')

    let body

    if (isVideoHigh || isVideoLow) {
      // ── Phase 1: 영상 직접 업로드 ────────────────────────────────────────
      setPhase(PHASE.UPLOADING)

      try {
        const sigRes = await fetch('/api/cloudinary-signature')
        if (!sigRes.ok) {
          const e = await sigRes.json()
          throw new Error(e.error || 'Cloudinary 서명 발급 실패')
        }
        const sig = await sigRes.json()

        const [uploadHigh, uploadLow] = await Promise.all([
          isVideoHigh ? uploadVideoToCloudinary(fileHigh, sig) : null,
          isVideoLow  ? uploadVideoToCloudinary(fileLow,  sig) : null,
        ])

        const [b64High, b64Low] = await Promise.all([
          isVideoHigh ? null : toBase64(fileHigh),
          isVideoLow  ? null : toBase64(fileLow),
        ])

        body = {
          publicIdHigh:  uploadHigh?.public_id  ?? null,
          durationHigh:  uploadHigh?.duration   ?? null,
          publicIdLow:   uploadLow?.public_id   ?? null,
          durationLow:   uploadLow?.duration    ?? null,
          base64High:    b64High,
          base64Low:     b64Low,
          mediaTypeHigh: fileHigh.type,
          mediaTypeLow:  fileLow.type,
        }
      } catch (err) {
        setError('업로드 오류: ' + err.message)
        setPhase(PHASE.UPLOAD)
        return
      }
    } else {
      // ── 이미지: 기존 flow ─────────────────────────────────────────────────
      const [dataHigh, dataLow] = await Promise.all([toBase64(fileHigh), toBase64(fileLow)])
      body = {
        imageHigh:    dataHigh,
        imageLow:     dataLow,
        mediaTypeHigh: fileHigh.type || 'image/jpeg',
        mediaTypeLow:  fileLow.type  || 'image/jpeg',
      }
    }

    // ── Phase 2: 분석 ────────────────────────────────────────────────────────
    setPhase(PHASE.LOADING)

    stepTimer.current = setInterval(() => {
      setStepIndex(prev => Math.min(prev + 1, 3))
    }, 1800)

    try {
      const endpoint = hasVideo ? '/api/analyze-video-cloudinary' : '/api/analyze'
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      {phase === PHASE.UPLOADING && (
        <div className="loading">
          <div className="loading-spinner" />
          <div style={{ fontSize: 15, fontWeight: 500 }}>영상을 Cloudinary에 업로드 중...</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
            영상이 클라우드로 직접 전송됩니다. 파일 크기에 따라 시간이 소요될 수 있어요.
          </div>
        </div>
      )}
      {phase === PHASE.LOADING && <LoadingSection stepIndex={stepIndex} hasVideo={hasVideo} />}
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
