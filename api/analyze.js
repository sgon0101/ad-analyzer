export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았어요.' });
  }

  try {
    const { imageHigh, imageLow, mediaTypeHigh, mediaTypeLow } = req.body;

    const systemPrompt = `당신은 퍼포먼스 마케팅 크리에이티브 전략 전문가입니다.
행동경제학, 소비자 심리학, 마케팅 이론을 광고 소재 분석에 실제로 적용합니다.

[분석 원칙 — 반드시 준수]
1. 모든 설명은 소재의 구체적인 시각/언어 요소와 연결. 추상적 표현 금지.
   좋은 예: "배경에 5개 오브젝트가 경쟁해 제품 인식에 0.5초 이상 소요"

2. 심리 트리거는 반드시 이 형식으로: "원리명(English) — 한줄정의. 소재의 [구체적요소]가 이 원리를 활용하며, 소비자가 [행동/심리변화]하는 효과를 만들어냄."
   예: "사회적 증거(Social Proof) — 타인의 선택을 보며 안도감을 느끼는 심리. 소재 하단 '누적 판매 32,000개' 문구가 이 원리를 활용하며, 소비자가 구매 불안이 줄어드는 효과를 만들어냄."

3. 매체&포맷 항목의 심리 트리거는 플랫폼 사용자의 심리적 특성(무음 환경의 인지 부담, 세로 스크롤 시 시선 고정 패턴 등)과 반드시 연결.

4. 각 필드는 핵심만 담아 2문장 이내로 간결하게 작성. JSON이 잘리지 않도록 간결함이 최우선.

5. 반드시 유효한 JSON만 출력. 줄바꿈 문자(\\n) 사용 금지. 큰따옴표 안에 큰따옴표 사용 금지.`;

    const userPrompt = `첨부 이미지 분석: 첫번째=고성과소재(CTR/ROAS높음), 두번째=저성과소재(CTR/ROAS낮음)

7개 항목 기준:
A.주목&후킹: 스크롤 정지 요소, 시선 흐름
B.메시지&행동유도: 0.3초 인지 여부, CTA 구체성과 위치
C.심리&감성설계: 손실회피/FOMO/인지부조화/사회적증거/앵커링/희소성/호기심갭/자아일치성 중 해당 원리를 지정 형식으로
D.신뢰&증거: 수치/후기/수상이력 등 제3자 검증 요소
E.브랜드&차별성: 브랜드 시각 언어 일관성, 경쟁 소재 대비 차별점
F.매체&포맷최적화: 플랫폼 환경 정합성 + 사용자 심리 특성 연결
G.소재피로도&지속력: 반복 노출 시 효율 하락 예상

규칙: 각 텍스트 필드는 2문장 이내. JSON 외 텍스트 금지. 줄바꿈 금지.

{"items":[{"id":"A","label":"주목 & 후킹","score_high":0,"score_low":0,"confidence":0,"high_analysis":"2문장이내","low_analysis":"2문장이내","trigger":"원리명(English) — 정의. 소재요소+소비자행동영향.","action":"실행가능한개선방안1문장"},{"id":"B","label":"메시지 & 행동유도","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"C","label":"심리 & 감성 설계","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"D","label":"신뢰 & 증거","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"E","label":"브랜드 & 차별성","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"F","label":"매체 & 포맷 최적화","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""},{"id":"G","label":"소재 피로도 & 지속력","score_high":0,"score_low":0,"confidence":0,"high_analysis":"","low_analysis":"","trigger":"","action":""}],"actions":[{"priority":1,"element":"","impact":"높음","current":"","suggestion":""},{"priority":2,"element":"","impact":"높음","current":"","suggestion":""},{"priority":3,"element":"","impact":"중간","current":"","suggestion":""}],"kpt":{"keep":["","",""],"drop":["","",""],"try":["","",""]}}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaTypeHigh || 'image/jpeg', data: imageHigh } },
            { type: 'image', source: { type: 'base64', media_type: mediaTypeLow || 'image/jpeg', data: imageLow } },
            { type: 'text', text: userPrompt },
          ],
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || `API 오류 (${response.status})` });
    }

    const rawText = data.content[0].text;
    let raw = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI 응답에서 JSON을 찾을 수 없어요. 다시 시도해 주세요.' });
    }
    raw = jsonMatch[0];

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, ' ');
      result = JSON.parse(cleaned);
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || '분석 중 오류가 발생했어요.' });
  }
}
