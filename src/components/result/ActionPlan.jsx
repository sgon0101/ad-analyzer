import { IMPACT_STYLE } from '../../constants.js'

export default function ActionPlan({ actions }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="section-num section-num-amber">3</div>
          <span className="section-title">개선 액션 플랜</span>
          <span className="section-tag">실무자용</span>
        </div>
      </div>
      {(actions || []).map(a => {
        const imp = IMPACT_STYLE[a.impact] || IMPACT_STYLE['중간']
        return (
          <div key={a.priority} className="action-item">
            <div className="action-num">{a.priority}</div>
            <div className="action-info">
              <div className="action-top">
                <span className="action-el">{a.element}</span>
                <span className="impact-badge" style={{ background: imp.bg, color: imp.color }}>영향도 {a.impact}</span>
              </div>
              <div className="action-current">현재: {a.current}</div>
              <div className="action-suggest">{a.suggestion}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
