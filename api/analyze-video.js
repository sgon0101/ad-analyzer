export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' },
  },
}

// ── Gemini Files API 업로드 ──────────────────────────────────────────────────
async function uploadToGemini(base64Data, mimeType, apiKey) {
  const buffer = Buffer.from(base64Data, 'base64')
  const boundary = `----GeminiBoundary${Date.now()}`

  const metaStr = `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n{"file":{"display_name":"upload"}}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  const endStr  = `\r\n--${boundary}--`
  const body = Buffer.concat([Buffer.from(metaStr), buffer, Buffer.from(endStr)])

  const res = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `파일 업로드 실패 (${res.status})`)
  }
  return (await res.json()).file
}

async function waitForFileActive(fileName, apiKey) {
  for (let i = 0; i < 30; i++) {
    const res  = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`)
    const file = await res.json()
    if (file.state === 'ACTIVE') return file
    if (file.state === 'FAILED') throw new Error('Gemini 파일 처리 실패')
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Gemini 파일 처리 타임아웃')
}

// ── 파일 타입에 따라 파트 생성 ─────────────────────────────────────────────
async function buildPart(base64Data, mimeType, apiKey) {
  if (mimeType.startsWith('video/')) {
    const file = await uploadToGemini(base64Data, mimeType, apiKey)
    await waitForFileActive(file.name, apiKey)
    return { fileData: { mimeType, fileUri: file.uri } }
  }
  // 이미지/GIF: 인라인 전송
  return { inlineData: { mimeType, data: base64Data } }
}

// ── 핸들러 ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았어요.' })

  try {
    const { fileHigh, fileLow, mediaTypeHigh, mediaTypeLow } = req.body

    const isVideoHigh = mediaTypeHigh?.startsWith('video/')
    const isVideoLow  = mediaTypeLow?.startsWith('video/')

    // 영상 파일은 병렬 업로드 (이미지는 즉시 인라인 처리)
    const [partHigh, partLow] = await Promise.all([
      buildPart(fileHigh, mediaTypeHigh || 'image/jpeg', apiKey),
      buildPart(fileLow,  mediaTypeLow  || 'image/jpeg', apiKey),
    ])

    const highLabel = isVideoHigh ? '영상 소재' : '이미지 소재'
    const lowLabel  = isVideoLow  ? '영상 소재' : '이미지 소재'

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

    const userPrompt = `첫번째=${highLabel}(고성과, CTR/ROAS높음), 두번째=${lowLabel}(저성과, CTR/ROAS낮음)

7개 항목 기준:
A.주목&후킹: 스크롤 정지 요소, 시선 흐름${isVideoHigh || isVideoLow ? ', 영상이면 오프닝 3초 훅 타이밍' : ''}
B.메시지&행동유도: 0.3초 인지 여부, CTA 구체성과 위치${isVideoHigh || isVideoLow ? ', 영상이면 CTA 등장 시점(초)' : ''}
C.심리&감성설계: 손실회피/FOMO/인지부조화/사회적증거/앵커링/희소성/호기심갭/자아일치성 중 해당 원리를 지정 형식으로
D.신뢰&증거: 수치/후기/수상이력 등 제3자 검증 요소
E.브랜드&차별성: 브랜드 시각 언어 일관성, 경쟁 소재 대비 차별점
F.매체&포맷최적화: 플랫폼 환경 정합성 + 사용자 심리 특성 연결${isVideoHigh || isVideoLow ? ', 영상 편집 리듬과 플랫폼 체류시간 패턴 연결' : ''}
G.소재피로도&지속력: 반복 노출 시 효율 하락 예상

규칙: 각 텍스트 필드는 2문장 이내. JSON 외 텍스트 금지. 줄바꿈 금지.

{"items":[{"id":"A","label":"주목 & 후킹","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"B","label":"메시지 & 행동유도","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"C","label":"심리 & 감성 설계","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"D","label":"신뢰 & 증거","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"E","label":"브랜드 & 차별성","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"F","label":"매체 & 포맷 최적화","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"G","label":"소재 피로도 & 지속력","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""}],"actions":[{"priority":1,"element":"","impact":"높음","current":"","suggestion":""},{"priority":2,"element":"","impact":"높음","current":"","suggestion":""},{"priority":3,"element":"","impact":"중간","current":"","suggestion":""}],"kpt":{"keep":["","",""],"drop":["","",""],"try":["","",""]}}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            role: 'user',
            parts: [partHigh, partLow, { text: userPrompt }],
          }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    if (!geminiRes.ok) throw new Error(geminiData.error?.message || `Gemini API 오류 (${geminiRes.status})`)

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    let raw = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없어요. 다시 시도해 주세요.')
    raw = jsonMatch[0]

    let result
    try {
      result = JSON.parse(raw)
    } catch {
      result = JSON.parse(raw.replace(/[\u0000-\u001F\u007F]/g, ' '))
    }

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message || '분석 중 오류가 발생했어요.' })
  }
}
