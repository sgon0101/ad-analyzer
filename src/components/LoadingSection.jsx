const STEPS = [
  '소재 시각 요소 분석 중...',
  '7개 항목별 인사이트 추출 중...',
  '행동경제학 심리 트리거 분석 중...',
  '개선 액션 플랜 생성 중...',
]

export default function LoadingSection({ stepIndex }) {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <div style={{ fontSize: 15, fontWeight: 500 }}>AI가 소재를 분석하고 있어요</div>
      <div className="loading-steps">
        {STEPS.map((text, i) => {
          let cls = 'loading-step'
          if (i < stepIndex) cls += ' done'
          else if (i === stepIndex) cls += ' active'
          return <div key={i} className={cls}>{text}</div>
        })}
      </div>
    </div>
  )
}
