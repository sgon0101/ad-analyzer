const KPT_CONFIG = [
  { key: 'keep', label: 'Keep', icon: '✓', desc: '계속 유지할 강점',   color: '#3ecf8e', bg: 'rgba(62,207,142,0.07)' },
  { key: 'drop', label: 'Drop', icon: '✕', desc: '다음 소재에서 제거', color: '#f05252', bg: 'rgba(240,82,82,0.07)' },
  { key: 'try',  label: 'Try',  icon: '→', desc: '새롭게 테스트할 것', color: '#a78bfa', bg: 'rgba(167,139,250,0.07)' },
]

export default function KPTGrid({ kpt }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="section-num section-num-purple">4</div>
          <span className="section-title">다음 소재 기획 방향</span>
          <span className="section-tag">팀 전체용</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Keep · Drop · Try</span>
      </div>
      <div className="kpt-grid">
        {KPT_CONFIG.map(t => (
          <div key={t.key} className="kpt-card" style={{ background: t.bg }}>
            <div className="kpt-header">
              <div className="kpt-icon" style={{ background: t.color, color: 'white' }}>{t.icon}</div>
              <div>
                <div className="kpt-type" style={{ color: t.color }}>{t.label}</div>
                <div className="kpt-desc" style={{ color: t.color, opacity: 0.7 }}>{t.desc}</div>
              </div>
            </div>
            {(kpt[t.key] || []).map((text, i) => (
              <div key={i} className="kpt-item">
                <div className="kpt-bullet" style={{ background: t.color }} />
                <span className="kpt-text">{text}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
