export default function Header() {
  return (
    <div className="header">
      <div className="header-badge">
        <span className="dot" />
        AI 광고 소재 분석기 v3
      </div>
      <h1>소재 인사이트를 <span>5초</span>만에</h1>
      <p>
        고성과·저성과 소재를 각각 업로드하면{' '}
        <span style={{ color: 'var(--text)' }}>7가지 항목</span>으로 즉시 비교 분석해드려요.
      </p>
    </div>
  )
}
