export default function ActionPlan({ actions }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="section-num" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>3</div>
          <span className="section-title">개선 액션 플랜</span>
          <span className="section-tag">실무자용</span>
        </div>
      </div>
      {(actions || []).map(a => {
        const ic = a.impact === '높음' ? '#f05252' : '#f5a623'
        const ib = a.impact === '높음' ? 'rgba(240,82,82,0.12)' : 'rgba(245,166,35,0.12)'
        return (
          <div key={a.priority} className="action-item">
            <div className="action-num">{a.priority}</div>
            <div className="action-info">
              <div className="action-top">
                <span className="action-el">{a.element}</span>
                <span className="impact-badge" style={{ background: ib, color: ic }}>영향도 {a.impact}</span>
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
