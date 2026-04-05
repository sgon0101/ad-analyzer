export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' }, // 영상은 클라이언트에서 직접 업로드 → 이미지 base64만 수신
  },
}

// ── 장면 전환 시점 프레임 URL 생성 (Vercel 통과 없음) ─────────────────────────
function buildSceneFrameUrls(cloudName, publicId, duration) {
  const count = Math.min(6, Math.max(3, Math.ceil(duration / 5)))
  const urls = Array.from({ length: count }, (_, i) => {
    const t = parseFloat((((i + 0.5) / count) * duration).toFixed(2))
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_${t},w_640,h_360,c_fill,q_60/${publicId}.jpg`
  })
  console.log(`[buildSceneFrameUrls] publicId=${publicId} duration=${duration}s → ${urls.length}개 URL`)
  urls.forEach((u, i) => console.log(`  [${i}] ${u}`))
  return urls
}

// ── 핸들러 ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── 요청 크기 측정 ────────────────────────────────────────────────────────
  const bodyStr    = JSON.stringify(req.body)
  const bodySizeKB = (Buffer.byteLength(bodyStr, 'utf8') / 1024).toFixed(1)
  console.log(`[analyze-video-cloudinary] 요청 수신 — body ${bodySizeKB} KB`)

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const cloudName    = process.env.CLOUDINARY_CLOUD_NAME

  if (!anthropicKey) {
    console.error('[analyze-video-cloudinary] ANTHROPIC_API_KEY 누락')
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았어요.' })
  }
  if (!cloudName) {
    console.error('[analyze-video-cloudinary] CLOUDINARY_CLOUD_NAME 누락')
    return res.status(500).json({ error: 'CLOUDINARY_CLOUD_NAME 환경변수가 설정되지 않았어요.' })
  }

  try {
    const {
      publicIdHigh, durationHigh,   // 영상일 때 (클라이언트에서 Cloudinary 직접 업로드)
      publicIdLow,  durationLow,
      base64High,   base64Low,       // 이미지일 때
      mediaTypeHigh, mediaTypeLow,
    } = req.body

    const isVideoHigh = mediaTypeHigh?.startsWith('video/')
    const isVideoLow  = mediaTypeLow?.startsWith('video/')

    console.log(`[analyze-video-cloudinary] isVideoHigh=${isVideoHigh} isVideoLow=${isVideoLow}`)
    console.log(`[analyze-video-cloudinary] publicIdHigh=${publicIdHigh} durationHigh=${durationHigh}`)
    console.log(`[analyze-video-cloudinary] publicIdLow=${publicIdLow}  durationLow=${durationLow}`)

    // ── 파일 처리 ─────────────────────────────────────────────────────────
    function processFile(publicId, duration, base64, mimeType, isVideo) {
      if (isVideo) {
        if (!publicId) throw new Error(`영상 publicId가 없습니다 (mediaType: ${mimeType})`)
        const urls = buildSceneFrameUrls(cloudName, publicId, duration || 30)
        return { urls, base64: null, mimeType: 'image/jpeg', isVideo: true, frameCount: urls.length }
      }
      if (!base64) throw new Error(`이미지 base64 데이터가 없습니다 (mediaType: ${mimeType})`)
      console.log(`[processFile] 이미지 base64 크기 ${(base64.length / 1024).toFixed(1)} KB`)
      return { urls: null, base64, mimeType: mimeType || 'image/jpeg', isVideo: false }
    }

    const high = processFile(publicIdHigh, durationHigh, base64High, mediaTypeHigh, isVideoHigh)
    const low  = processFile(publicIdLow,  durationLow,  base64Low,  mediaTypeLow,  isVideoLow)

    // ── Claude 메시지 구성 ────────────────────────────────────────────────
    const contentParts = []

    const videoNote = (isVideoHigh || isVideoLow)
      ? '이것은 영상 광고 소재입니다. 첨부 이미지는 장면 전환이 감지된 순간의 프레임들입니다. 각 장면의 특성과 전체 영상 흐름을 함께 분석해주세요.\n\n'
      : ''

    const highLabel = isVideoHigh ? `고성과 영상 소재 (장면 프레임 ${high.frameCount}개)` : '고성과 이미지 소재'
    const lowLabel  = isVideoLow  ? `저성과 영상 소재 (장면 프레임 ${low.frameCount}개)`  : '저성과 이미지 소재'

    contentParts.push({ type: 'text', text: `=== ${highLabel} ===` })
    if (high.isVideo) {
      high.urls.forEach(url => contentParts.push({ type: 'image', source: { type: 'url', url } }))
    } else {
      contentParts.push({ type: 'image', source: { type: 'base64', media_type: high.mimeType, data: high.base64 } })
    }

    contentParts.push({ type: 'text', text: `=== ${lowLabel} ===` })
    if (low.isVideo) {
      low.urls.forEach(url => contentParts.push({ type: 'image', source: { type: 'url', url } }))
    } else {
      contentParts.push({ type: 'image', source: { type: 'base64', media_type: low.mimeType, data: low.base64 } })
    }

    const imagePartCount = contentParts.filter(p => p.type === 'image').length
    console.log(`[analyze-video-cloudinary] Claude 전달 이미지 파트 ${imagePartCount}개`)

    const systemPrompt = `당신은 퍼포먼스 마케팅 크리에이티브 전략 전문가입니다.
행동경제학, 소비자 심리학, 마케팅 이론을 광고 소재 분석에 실제로 적용합니다.
영상 소재의 경우 시간 흐름에 따른 훅 타이밍, 장면 전환 리듬, CTA 등장 시점, 텍스트 애니메이션 등 동적 요소를 반드시 분석에 포함하세요.

[분석 원칙 — 반드시 준수]
1. 모든 설명은 소재의 구체적인 시각/언어 요소와 연결. 추상적 표현 금지.
   좋은 예(영상): "오프닝 1.5초에 제품 클로즈업 후 줌아웃으로 시선 고정, 3초 내 핵심 메시지 등장"

2. 심리 트리거는 반드시 이 형식으로: "원리명(English) — 한줄정의. 소재의 [구체적요소]가 이 원리를 활용하며, 소비자가 [행동/심리변화]하는 효과를 만들어냄."

3. 매체&포맷 항목의 심리 트리거는 플랫폼 사용자의 심리적 특성(무음 환경의 인지 부담, 세로 스크롤 시 시선 고정 패턴 등)과 반드시 연결.

4. 각 필드는 핵심만 담아 2문장 이내로 간결하게 작성. JSON이 잘리지 않도록 간결함이 최우선.

5. 반드시 유효한 JSON만 출력. 줄바꿈 문자(\\n) 사용 금지. 큰따옴표 안에 큰따옴표 사용 금지.`

    const userPrompt = `${videoNote}첫번째=${highLabel}(고성과, CTR/ROAS높음), 두번째=${lowLabel}(저성과, CTR/ROAS낮음)

7개 항목 기준:
A.주목&후킹: 스크롤 정지 요소, 시선 흐름${isVideoHigh || isVideoLow ? ', 영상이면 오프닝 3초 훅 타이밍과 장면 전환 리듬' : ''}
B.메시지&행동유도: 0.3초 인지 여부, CTA 구체성과 위치${isVideoHigh || isVideoLow ? ', 영상이면 CTA 등장 시점(초)' : ''}
C.심리&감성설계: 손실회피/FOMO/인지부조화/사회적증거/앵커링/희소성/호기심갭/자아일치성 중 해당 원리를 지정 형식으로
D.신뢰&증거: 수치/후기/수상이력 등 제3자 검증 요소
E.브랜드&차별성: 브랜드 시각 언어 일관성, 경쟁 소재 대비 차별점
F.매체&포맷최적화: 플랫폼 환경 정합성 + 사용자 심리 특성 연결${isVideoHigh || isVideoLow ? ', 영상 편집 리듬과 플랫폼 체류시간 패턴 연결' : ''}
G.소재피로도&지속력: 반복 노출 시 효율 하락 예상

규칙: 각 텍스트 필드는 2문장 이내. JSON 외 텍스트 금지. 줄바꿈 금지.

{"items":[{"id":"A","label":"주목 & 후킹","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"B","label":"메시지 & 행동유도","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"C","label":"심리 & 감성 설계","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"D","label":"신뢰 & 증거","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"E","label":"브랜드 & 차별성","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"F","label":"매체 & 포맷 최적화","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"G","label":"소재 피로도 & 지속력","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""}],"actions":[{"priority":1,"element":"","impact":"높음","current":"","suggestion":""},{"priority":2,"element":"","impact":"높음","current":"","suggestion":""},{"priority":3,"element":"","impact":"중간","current":"","suggestion":""}],"kpt":{"keep":["","",""],"drop":["","",""],"try":["","",""]}}`

    contentParts.push({ type: 'text', text: userPrompt })

    console.log(`[analyze-video-cloudinary] Claude API 호출 시작 (model: claude-sonnet-4-20250514)`)

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: 'user', content: contentParts }],
      }),
    })

    const claudeData = await claudeRes.json()
    console.log(`[analyze-video-cloudinary] Claude 응답 status=${claudeRes.status} stop_reason=${claudeData.stop_reason}`)

    if (!claudeRes.ok) {
      console.error('[analyze-video-cloudinary] Claude API 오류:', JSON.stringify(claudeData))
      throw new Error(claudeData.error?.message || `Claude API 오류 (${claudeRes.status})`)
    }

    const rawText = claudeData.content?.[0]?.text || ''
    console.log(`[analyze-video-cloudinary] Claude 응답 텍스트 길이: ${rawText.length}자`)

    let raw = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[analyze-video-cloudinary] JSON 파싱 실패. 원문:', rawText.slice(0, 300))
      throw new Error('AI 응답에서 JSON을 찾을 수 없어요. 다시 시도해 주세요.')
    }
    raw = jsonMatch[0]

    let result
    try {
      result = JSON.parse(raw)
    } catch (parseErr) {
      console.warn('[analyze-video-cloudinary] JSON.parse 1차 실패, 제어문자 제거 후 재시도:', parseErr.message)
      result = JSON.parse(raw.replace(/[\u0000-\u001F\u007F]/g, ' '))
    }

    console.log(`[analyze-video-cloudinary] 분석 완료 — items ${result?.items?.length}개`)
    return res.status(200).json(result)

  } catch (err) {
    console.error('[analyze-video-cloudinary] 처리 중 오류:', err.message)
    console.error(err.stack)
    return res.status(500).json({ error: err.message || '분석 중 오류가 발생했어요.' })
  }
}
