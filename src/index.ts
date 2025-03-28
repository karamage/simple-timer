import { Hono } from 'hono'

type Bindings = {
  TIMER: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// セッションIDの生成
const generateSessionId = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// HTMLの生成関数
const generateHTML = (expiresAt: number | null, sessionId: string) => {
  const expiresTimestamp = expiresAt ? new Date(expiresAt).getTime() : null

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3分タイマー</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Rajdhani:wght@300;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Rajdhani', sans-serif;
      text-align: center;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #0f0f1a;
      color: #fff;
      overflow: hidden;
    }
    .container {
      background: rgba(15, 15, 26, 0.7);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(20px);
      width: 90%;
      max-width: 450px;
      position: relative;
      z-index: 1;
      border: 1px solid rgba(0, 230, 255, 0.1);
    }
    h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 2.2rem;
      font-weight: 500;
      margin-bottom: 30px;
      letter-spacing: 2px;
      color: #00e6ff;
      text-transform: uppercase;
    }
    .circle-container {
      position: relative;
      width: 240px;
      height: 240px;
      margin: 0 auto 30px;
    }
    .circle-bg {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: rgba(0, 230, 255, 0.05);
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
      position: absolute;
    }
    .circle-progress {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: conic-gradient(#00e6ff 0%, rgba(0, 230, 255, 0.03) 0%);
      position: absolute;
      transform: rotate(-90deg);
      transition: background 0.3s ease;
      box-shadow: 0 0 30px rgba(0, 230, 255, 0.3);
    }
    .circle-inner {
      width: 78%;
      height: 78%;
      background-color: rgba(15, 15, 26, 0.7);
      border-radius: 50%;
      position: absolute;
      top: 11%;
      left: 11%;
      backdrop-filter: blur(5px);
      border: 1px solid rgba(0, 230, 255, 0.1);
    }
    .time {
      font-family: 'Orbitron', sans-serif;
      font-size: 2.8rem;
      font-weight: 700;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
      text-shadow: 0 0 10px rgba(0, 230, 255, 0.7);
      letter-spacing: 2px;
      color: #00e6ff;
    }
    button {
      font-family: 'Rajdhani', sans-serif;
      padding: 15px 35px;
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(45deg, #00e6ff, #00a0b3);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: 0.4s;
      letter-spacing: 2px;
      box-shadow: 0 0 20px rgba(0, 230, 255, 0.4);
      outline: none;
      text-transform: uppercase;
      position: relative;
      overflow: hidden;
    }
    button:after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
      transform: rotate(30deg);
      transition: 0.6s;
    }
    button:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 30px rgba(0, 230, 255, 0.6);
    }
    button:hover:after {
      transform: rotate(30deg) translate(50%, 50%);
    }
    .finished {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.8rem;
      color: #00e6ff;
      margin-top: 30px;
      font-weight: 500;
      letter-spacing: 2px;
      text-shadow: 0 0 10px rgba(0, 230, 255, 0.7);
    }
    .glow {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 230, 255, 0.2) 0%, rgba(0, 230, 255, 0) 70%);
      z-index: 0;
      filter: blur(40px);
      pointer-events: none;
      transform: translate(-50%, -50%);
      top: 50%;
      left: 50%;
    }
    .grid {
      position: fixed;
      width: 200%;
      height: 200%;
      top: -50%;
      left: -50%;
      background-image: 
        linear-gradient(rgba(0, 230, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 230, 255, 0.05) 1px, transparent 1px);
      background-size: 40px 40px;
      transform: perspective(500px) rotateX(60deg);
      animation: grid 20s linear infinite;
      opacity: 0.2;
      z-index: -1;
    }
    @keyframes grid {
      0% {
        transform: perspective(500px) rotateX(60deg) translateY(0);
      }
      100% {
        transform: perspective(500px) rotateX(60deg) translateY(40px);
      }
    }
  </style>
</head>
<body>
<div class="grid"></div>
<div class="glow"></div>
<div class="container">
  <h1>3分タイマー</h1>
  
  <div class="circle-container">
    <div class="circle-bg"></div>
    <div class="circle-progress" id="progress-circle"></div>
    <div class="circle-inner"></div>
    <div id="timer" class="time">00:00</div>
  </div>
  
  <form method="post" style="display: ${expiresAt ? 'none' : 'block'};">
    <input type="hidden" name="sessionId" value="${sessionId}">
    <button type="submit">スタート</button>
  </form>
  <div id="finished" class="finished" style="display: none;">COMPLETE</div>
</div>

<script>
  const expiresAt = ${expiresTimestamp || 'null'}
  const totalTime = 3 * 60 * 1000 // 3分のミリ秒

  if (expiresAt) {
    const timerElement = document.getElementById('timer')
    const finishedElement = document.getElementById('finished')
    const progressCircle = document.getElementById('progress-circle')

    const updateTimer = () => {
      const now = Date.now()
      const remaining = expiresAt - now
      
      if (remaining <= 0) {
        timerElement.style.display = 'none'
        finishedElement.style.display = 'block'
        progressCircle.style.background = 'conic-gradient(#00e6ff 100%, rgba(0, 230, 255, 0.03) 0%)'
        document.querySelector('.glow').style.background = 'radial-gradient(circle, rgba(0, 230, 255, 0.6) 0%, rgba(0, 230, 255, 0) 70%)'
        clearInterval(interval)
        return
      }
      
      // プログレスサークルの更新
      const progress = (1 - (remaining / totalTime)) * 100
      progressCircle.style.background = \`conic-gradient(#00e6ff \${progress}%, rgba(0, 230, 255, 0.03) 0%)\`
      
      // プログレスに応じて光の効果を変更
      const glowOpacity = 0.2 + (progress / 200)
      document.querySelector('.glow').style.background = \`radial-gradient(circle, rgba(0, 230, 255, \${glowOpacity}) 0%, rgba(0, 230, 255, 0) 70%)\`

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      timerElement.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`
    }

    const interval = setInterval(updateTimer, 100) // より滑らかな更新のために100ms間隔に
    updateTimer()
  }
</script>
</body>
</html>
`
}

// タイマー表示と管理
app.get('/', async (c) => {
  const sessionId = c.req.query('sessionId') || generateSessionId()
  const timer = await c.env.TIMER.get(`timer:${sessionId}`)

  if (!timer) {
    return c.html(generateHTML(null, sessionId))
  }

  const { expiresAt } = JSON.parse(timer)
  const remaining = expiresAt - Date.now()

  if (remaining <= 0) {
    await c.env.TIMER.delete(`timer:${sessionId}`)
    return c.html(generateHTML(null, sessionId))
  }

  return c.html(generateHTML(expiresAt, sessionId))
})

// タイマー開始
app.post('/', async (c) => {
  const formData = await c.req.formData()
  const sessionId = formData.get('sessionId') as string
  const expiresAt = Date.now() + 3 * 60 * 1000  // 3分後
  await c.env.TIMER.put(`timer:${sessionId}`, JSON.stringify({ expiresAt }))

  return c.redirect(`/?sessionId=${sessionId}`)
})

export default app
