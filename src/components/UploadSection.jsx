import UploadZone from './UploadZone.jsx'

export default function UploadSection({ fileHigh, fileHighUrl, thumbHigh, fileLow, fileLowUrl, thumbLow, onFileHigh, onFileLow, onAnalyze, error }) {
  const canAnalyze = !!fileHigh && !!fileLow

  let btnText = '두 소재 모두 업로드하면 분석이 시작돼요'
  if (canAnalyze) btnText = '✦ AI 분석 시작하기'

  return (
    <div>
      <div className="note-box">
        📎 <strong>이미지</strong>(JPG · PNG · GIF · WEBP)와 <strong>영상</strong>(MP4 · MOV · WEBM)을 모두 지원해요. 이미지는 Claude, 영상 포함 시 Gemini로 자동 분석합니다.
      </div>
      <div className="upload-grid">
        <UploadZone type="high" file={fileHigh} url={fileHighUrl} thumb={thumbHigh} onFile={onFileHigh} />
        <UploadZone type="low" file={fileLow} url={fileLowUrl} thumb={thumbLow} onFile={onFileLow} />
      </div>
      <button
        className="btn-analyze"
        disabled={!canAnalyze}
        onClick={onAnalyze}
      >
        {btnText}
      </button>
      {error && <div className="error-box">{error}</div>}
    </div>
  )
}
