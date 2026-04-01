import { useRef, useState } from 'react'

export default function UploadZone({ type, file, url, onFile }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const isHigh = type === 'high'
  const hasFile = !!file

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) onFile(f)
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
          {isHigh ? '고성과 소재' : '저성과 소재'}
        </div>
        <span className="zone-icon">{isHigh ? '📈' : '📉'}</span>
        <div className="zone-sub">클릭하거나 파일을 드래그하세요</div>
        {url && <img className="zone-preview" src={url} alt="preview" />}
        {file && <div className="zone-filename">{file.name}</div>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  )
}
