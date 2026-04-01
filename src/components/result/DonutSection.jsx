import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { COLORS, getStatus, hexToRgba } from '../../constants.js'

function DonutColumn({ canvasRef, items, scoreKey, label, color, dimColor, avgScore, centerLabel, centerScore, selectedIdx, onSelect }) {
  const st = getStatus(avgScore)

  return (
    <div className="donut-col">
      <div className="donut-col-header">
        <div className="donut-col-dot" style={{ background: color }} />
        <span className="donut-col-label" style={{ color }}>{label}</span>
        <span className="donut-col-score" style={{ background: st.bg, color: st.color }}>{avgScore}점</span>
      </div>
      <div className="donut-wrap">
        <canvas ref={canvasRef} width={180} height={180} />
        <div className="donut-center">
          <div className="donut-center-label">{centerLabel}</div>
          <div className="donut-center-score">{centerScore}</div>
        </div>
      </div>
      <div className="legend">
        {items.map((item, i) => {
          const score = item[scoreKey] || 0
          const s = getStatus(score)
          const c = COLORS[item.id]
          const isSelected = selectedIdx === i
          const isDimmed = selectedIdx !== null && !isSelected
          return (
            <div
              key={item.id}
              className="legend-row"
              style={{
                opacity: isDimmed ? 0.3 : 1,
                background: isSelected ? c.bg : undefined,
                borderColor: isSelected ? hexToRgba(c.color, 0.3) : 'transparent',
              }}
              onClick={() => onSelect(isSelected ? null : i)}
            >
              <div className="legend-dot" style={{ background: c.color }} />
              <span className="legend-name">{item.label}</span>
              <span className="legend-score" style={{ color: c.color }}>{score}</span>
              <span className="legend-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DonutSection({ items, selectedIdx, onSelectIdx }) {
  const highRef = useRef(null)
  const lowRef = useRef(null)
  const highChartRef = useRef(null)
  const lowChartRef = useRef(null)

  const avgHigh = Math.round(items.reduce((s, i) => s + (i.score_high || 0), 0) / items.length)
  const avgLow = Math.round(items.reduce((s, i) => s + (i.score_low || 0), 0) / items.length)

  const highCenter = selectedIdx === null
    ? { label: '종합', score: avgHigh }
    : { label: items[selectedIdx].label.length > 7 ? items[selectedIdx].label.slice(0, 7) + '…' : items[selectedIdx].label, score: items[selectedIdx].score_high || 0 }

  const lowCenter = selectedIdx === null
    ? { label: '종합', score: avgLow }
    : { label: items[selectedIdx].label.length > 7 ? items[selectedIdx].label.slice(0, 7) + '…' : items[selectedIdx].label, score: items[selectedIdx].score_low || 0 }

  function buildColors(scoreKey) {
    return items.map((item, i) =>
      selectedIdx === null
        ? COLORS[item.id].color
        : i === selectedIdx
          ? COLORS[item.id].color
          : hexToRgba(COLORS[item.id].color, 0.12)
    )
  }

  function buildOffsets() {
    return items.map((_, i) => (i === selectedIdx ? 10 : 0))
  }

  useEffect(() => {
    if (!highRef.current || !lowRef.current) return

    if (highChartRef.current) highChartRef.current.destroy()
    if (lowChartRef.current) lowChartRef.current.destroy()

    const makeChart = (canvas, scoreKey, onClick) => new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: items.map(i => i.label),
        datasets: [{
          data: items.map(i => i[scoreKey] || 0),
          backgroundColor: items.map(i => COLORS[i.id].color),
          borderWidth: 2,
          borderColor: '#161920',
          offset: items.map(() => 0),
          hoverOffset: 0,
        }],
      },
      options: {
        responsive: false,
        cutout: '62%',
        animation: { duration: 500 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        onClick,
      },
    })

    highChartRef.current = makeChart(highRef.current, 'score_high', (e) => {
      const pts = highChartRef.current.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
      if (pts.length) {
        const i = pts[0].index
        onSelectIdx(i === selectedIdx ? null : i)
      }
    })

    lowChartRef.current = makeChart(lowRef.current, 'score_low', (e) => {
      const pts = lowChartRef.current.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
      if (pts.length) {
        const i = pts[0].index
        onSelectIdx(i === selectedIdx ? null : i)
      }
    })

    return () => {
      highChartRef.current?.destroy()
      lowChartRef.current?.destroy()
    }
  }, [items])

  // Update chart colors and offsets when selection changes (without rebuilding)
  useEffect(() => {
    [highChartRef.current, lowChartRef.current].forEach((ch, ci) => {
      if (!ch) return
      const scoreKey = ci === 0 ? 'score_high' : 'score_low'
      ch.data.datasets[0].backgroundColor = buildColors(scoreKey)
      ch.data.datasets[0].offset = buildOffsets()
      ch.update('active')
    })
  }, [selectedIdx])

  return (
    <div className="donut-section">
      <div className="donut-pair">
        <DonutColumn
          canvasRef={highRef}
          items={items}
          scoreKey="score_high"
          label="고성과 소재"
          color="var(--green)"
          avgScore={avgHigh}
          centerLabel={highCenter.label}
          centerScore={highCenter.score}
          selectedIdx={selectedIdx}
          onSelect={onSelectIdx}
        />
        <div className="donut-divider" />
        <DonutColumn
          canvasRef={lowRef}
          items={items}
          scoreKey="score_low"
          label="저성과 소재"
          color="var(--red)"
          avgScore={avgLow}
          centerLabel={lowCenter.label}
          centerScore={lowCenter.score}
          selectedIdx={selectedIdx}
          onSelect={onSelectIdx}
        />
      </div>
    </div>
  )
}
