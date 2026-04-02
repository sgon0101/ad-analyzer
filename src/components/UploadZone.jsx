import { useRef, useState } from 'react'

const ACCEPT = 'image/*,video/mp4,video/quicktime,video/webm,video/x-msvideo'

export default function UploadZone({ type, file, url, onFile }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const isHigh  = type === 'high'
  const hasFile = !!file
  const isVideo = file?.type?.startsWith('video/')

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) onFile(f)
  }

  const zoneClass = [
    'upload-zone',
    isHigh ? 'high' : 'low',
    hasFile ? 'has-file' : '',
    dragOver ? 'drag-over' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div
        className={zoneClass}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className={`zone-label ${isHigh ? 'high' : 'low'}`}>
          {isHigh ? '📈 고성과 소재' : '📉 저성과 소재'}
        </div>

        {!hasFile && (
          <>
            <div className="zone-title">클릭하거나 파일을 드래그하세요</div>
            <div className="zone-sub">이미지 · 영상 모두 지원</div>
          </>
        )}

        {url && isVideo && (
          <video
            className="zone-preview"
            src={url}
            muted
            playsInline
            controls
            style={{ maxHeight: 180 }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {url && !isVideo && (
          <img className="zone-preview" src={url} alt="preview" style={{ maxHeight: 180 }} />
        )}
        {file && (
          <div className="zone-filename">
            {isVideo && '🎬 '}{file.name}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  )
}
