import { useState } from 'react'
import { getStatus } from '../../constants.js'
import CreativesRow from './CreativesRow.jsx'
import DonutSection from './DonutSection.jsx'
import ItemCards from './ItemCards.jsx'
import ActionPlan from './ActionPlan.jsx'
import KPTGrid from './KPTGrid.jsx'

function ScoreSummaryBar({ avgHigh, avgLow }) {
  const shHigh = getStatus(avgHigh)
  const shLow  = getStatus(avgLow)
  const gap    = avgHigh - avgLow
  const gapColor = gap >= 20 ? 'var(--green)' : gap >= 10 ? 'var(--amber)' : 'var(--text2)'

  return (
    <div className="score-summary-bar">
      <div className="score-summary-cell">
        <span className="score-summary-label" style={{ color: 'var(--green)' }}>고성과 소재</span>
        <span className="score-summary-num" style={{ color: 'var(--green)' }}>{avgHigh}</span>
        <span className="score-summary-status" style={{ background: shHigh.bg, color: shHigh.color }}>
          {shHigh.label}
        </span>
      </div>
      <div className="score-summary-divider">
        <div className="score-summary-diff" style={{ color: gapColor }}>
          {gap >= 0 ? '+' : ''}{gap}점 차이
        </div>
      </div>
      <div className="score-summary-cell">
        <span className="score-summary-label" style={{ color: 'var(--red)' }}>저성과 소재</span>
        <span className="score-summary-num" style={{ color: 'var(--red)' }}>{avgLow}</span>
        <span className="score-summary-status" style={{ background: shLow.bg, color: shLow.color }}>
          {shLow.label}
        </span>
      </div>
    </div>
  )
}

export default function ResultSection({ result, urlHigh, urlLow, onReset }) {
  const [selectedIdx, setSelectedIdx] = useState(null)

  const items   = result.items || []
  const avgHigh = Math.round(items.reduce((s, i) => s + (i.score_high || 0), 0) / items.length)
  const avgLow  = Math.round(items.reduce((s, i) => s + (i.score_low  || 0), 0) / items.length)

  return (
    <div>
      <div className="result-header">
        <h2>분석 결과</h2>
        <button className="btn-reset" onClick={onReset}>↩ 새 소재 분석하기</button>
      </div>

      <ScoreSummaryBar avgHigh={avgHigh} avgLow={avgLow} />

      <CreativesRow urlHigh={urlHigh} urlLow={urlLow} avgHigh={avgHigh} avgLow={avgLow} />

      <DonutSection items={items} selectedIdx={selectedIdx} onSelectIdx={setSelectedIdx} />

      <ItemCards items={items} />

      <ActionPlan actions={result.actions} />

      <KPTGrid kpt={result.kpt} />
    </div>
  )
}
