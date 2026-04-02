import { useState } from 'react'
import { COLORS, getStatus } from '../../constants.js'

function TriggerContent({ text }) {
  const parts = text.split(/(\([^)]+\))/)
  return (
    <p className="trigger-content">
      {parts.map((part, i) =>
        /^\([^)]+\)$/.test(part)
          ? <span key={i} style={{ color: 'var(--purple)', fontWeight: 500 }}>{part}</span>
          : part
      )}
    </p>
  )
}

function ItemCard({ item }) {
  const [open, setOpen] = useState(false)
  const c  = COLORS[item.id]
  const sh = getStatus(item.score_high || 0)
  const sl = getStatus(item.score_low  || 0)
  const gap = Math.abs((item.score_high || 0) - (item.score_low || 0))

  return (
    <div className={`item-card${gap >= 20 ? ' item-card-highlight' : ''}`}>
      <div className="item-header" onClick={() => setOpen(v => !v)}>
        <div className="item-id" style={{ background: c.bg, color: c.text }}>{item.id}</div>
        <span className="item-name">{item.label}</span>
        <div className="item-score-chip">
          <span className="item-score-num" style={{ color: 'var(--green)' }}>{item.score_high ?? '-'}</span>
          <span className="item-score-vs">vs</span>
          <span className="item-score-num" style={{ color: 'var(--red)' }}>{item.score_low ?? '-'}</span>
        </div>
        <svg
          className={`chevron${open ? ' open' : ''}`}
          width={14} height={14} viewBox="0 0 14 14" fill="none"
        >
          <path d="M2 4.5L7 9.5L12 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {open && (
        <div className="item-body">
          <div className="compare-grid">
            <div className="compare-cell">
              <div className="compare-cell-header">
                <div className="compare-cell-dot" style={{ background: 'var(--green)' }} />
                <span className="compare-cell-label" style={{ color: 'var(--green)' }}>고성과 소재</span>
                <span className="compare-score-badge" style={{ background: sh.bg, color: sh.color }}>{item.score_high}점</span>
              </div>
              <p className="compare-section-text">{item.high_analysis || ''}</p>
            </div>
            <div className="compare-cell">
              <div className="compare-cell-header">
                <div className="compare-cell-dot" style={{ background: 'var(--red)' }} />
                <span className="compare-cell-label" style={{ color: 'var(--red)' }}>저성과 소재</span>
                <span className="compare-score-badge" style={{ background: sl.bg, color: sl.color }}>{item.score_low}점</span>
              </div>
              <p className="compare-section-text">{item.low_analysis || ''}</p>
            </div>
          </div>

          <div className="trigger-box">
            <div className="trigger-box-header">
              <div className="trigger-box-icon">🧠</div>
              <span className="trigger-box-title">심리 트리거 분석</span>
            </div>
            <TriggerContent text={item.trigger || ''} />
          </div>

          <div className="action-footer">
            <div className="action-footer-content">
              <div className="action-footer-title">활용 방안</div>
              <p className="action-footer-text">{item.action || ''}</p>
            </div>
            <div className="conf-wrap">
              <div className="conf-label">확신도</div>
              <div className="conf-dots">
                {[1, 2, 3, 4, 5].map(n => (
                  <div
                    key={n}
                    className="conf-dot"
                    style={{ background: n <= (item.confidence || 0) ? c.color : 'var(--border2)' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ItemCards({ items }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="section-num section-num-blue">2</div>
          <span className="section-title">항목별 상세 분석</span>
          <span className="section-tag">실무자용</span>
        </div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text3)' }}>클릭하여 펼치기</span>
      </div>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </div>
  )
}
