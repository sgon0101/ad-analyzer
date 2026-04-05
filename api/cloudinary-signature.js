import { createHash } from 'crypto'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { CLOUDINARY_API_SECRET: apiSecret, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_CLOUD_NAME: cloudName } = process.env
  if (!apiSecret || !apiKey || !cloudName) {
    return res.status(500).json({ error: 'Cloudinary 환경변수가 설정되지 않았어요.' })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const signature = createHash('sha1')
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  console.log(`[cloudinary-signature] timestamp=${timestamp} 서명 발급 완료`)
  return res.status(200).json({ timestamp, signature, apiKey, cloudName })
}
