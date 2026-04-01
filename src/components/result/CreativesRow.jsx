import { getStatus } from '../../constants.js'

export default function CreativesRow({ urlHigh, urlLow, avgHigh, avgLow }) {
  const sh = getStatus(avgHigh)
  const sl = getStatus(avgLow)

  return (
    <div className="creatives-row">
      <div className="creative-card">
        <div className="creative-card-header">
          <div className="creative-card-label">
            <div className="creative-card-dot" style={{ background: 'var(--green)' }} />
            <span style={{ color: 'var(--green)' }}>고성과 소재</span>
          </div>
          <span className="creative-card-score" style={{ background: sh.bg, color: sh.color }}>
            종합 {avgHigh}점
          </span>
        </div>
        <img src={urlHigh} alt="고성과 소재" />
      </div>
      <div className="creative-card">
        <div className="creative-card-header">
          <div className="creative-card-label">
            <div className="creative-card-dot" style={{ background: 'var(--red)' }} />
            <span style={{ color: 'var(--red)' }}>저성과 소재</span>
          </div>
          <span className="creative-card-score" style={{ background: sl.bg, color: sl.color }}>
            종합 {avgLow}점
          </span>
        </div>
        <img src={urlLow} alt="저성과 소재" />
      </div>
    </div>
  )
}
