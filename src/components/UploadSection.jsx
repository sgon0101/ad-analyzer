import UploadZone from './UploadZone.jsx'

export default function UploadSection({ fileHigh, fileHighUrl, fileLow, fileLowUrl, onFileHigh, onFileLow, onAnalyze, error }) {
  const canAnalyze = !!fileHigh && !!fileLow

  let btnText = '두 소재 모두 업로드하면 분석이 시작돼요'
  if (canAnalyze) btnText = '✦ AI 분석 시작하기'

  return (
    <div>
      <div className="note-box">
        ⚠️ 현재 버전은 <strong>이미지 파일</strong>을 지원해요 (JPG, PNG, GIF, WEBP). 영상 소재는 핵심 장면을 캡처해서 업로드해 주세요.
      </div>
      <div className="upload-grid">
        <UploadZone type="high" file={fileHigh} url={fileHighUrl} onFile={onFileHigh} />
        <UploadZone type="low" file={fileLow} url={fileLowUrl} onFile={onFileLow} />
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
