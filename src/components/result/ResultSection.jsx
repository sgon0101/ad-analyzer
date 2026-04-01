import { useState } from 'react'
import CreativesRow from './CreativesRow.jsx'
import DonutSection from './DonutSection.jsx'
import ItemCards from './ItemCards.jsx'
import ActionPlan from './ActionPlan.jsx'
import KPTGrid from './KPTGrid.jsx'

export default function ResultSection({ result, urlHigh, urlLow, onReset }) {
  const [selectedIdx, setSelectedIdx] = useState(null)

  const items = result.items || []
  const avgHigh = Math.round(items.reduce((s, i) => s + (i.score_high || 0), 0) / items.length)
  const avgLow = Math.round(items.reduce((s, i) => s + (i.score_low || 0), 0) / items.length)

  return (
    <div>
      <div className="result-header">
        <h2>분석 결과</h2>
        <button className="btn-reset" onClick={onReset}>↩ 새 소재 분석하기</button>
      </div>

      <CreativesRow urlHigh={urlHigh} urlLow={urlLow} avgHigh={avgHigh} avgLow={avgLow} />

      <DonutSection items={items} selectedIdx={selectedIdx} onSelectIdx={setSelectedIdx} />

      <ItemCards items={items} />

      <ActionPlan actions={result.actions} />

      <KPTGrid kpt={result.kpt} />
    </div>
  )
}
