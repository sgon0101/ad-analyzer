// 로컬 개발용 API 서버 (Node.js 18+)
// npm run dev:api 로 실행 후 npm run dev 와 함께 사용

import { createServer } from 'http'
import { readFileSync } from 'fs'

const PORT = 3000

const handler = (await import('./api/analyze.js')).default

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/analyze') {
    let body = ''
    for await (const chunk of req) body += chunk
    req.body = JSON.parse(body)

    const mockRes = {
      _status: 200,
      _headers: {},
      status(code) { this._status = code; return this },
      setHeader(k, v) { this._headers[k] = v; return this },
      json(data) {
        res.writeHead(this._status, { 'Content-Type': 'application/json', ...this._headers })
        res.end(JSON.stringify(data))
      },
    }
    await handler(req, mockRes)
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, () => console.log(`API server running at http://localhost:${PORT}`))
