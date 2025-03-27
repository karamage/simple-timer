import { Hono } from 'hono'

type Bindings = {
  TIMER: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// HTMLの生成関数
const generateHTML = (expiresAt: number | null) => {
  const expiresTimestamp = expiresAt ? new Date(expiresAt).getTime() : null

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3分タイマー</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      margin: 0;
      padding: 0;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #4facfe, #00f2fe);
      color: #fff;
    }
    .container {
      background: #ffffff11;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      max-width: 400px;
      width: 100%;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
    }
    .time {
      font-size: 3rem;
      margin: 20px 0;
    }
    button {
      padding: 12px 30px;
      font-size: 1.2rem;
      color: #fff;
      background: #ff7e5f;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.3s;
    }
    button:hover {
      background: #feb47b;
    }
    .finished {
      font-size: 2rem;
      color: #ffdd57;
      margin-top: 20px;
    }
  </style>
</head>
<body>
<div class="container">
  <h1>3分タイマー</h1>
  <div id="timer" class="time">⏱️ 00:00</div>
  <form method="post" style="display: ${expiresAt ? 'none' : 'block'};">
    <button type="submit">スタート</button>
  </form>
  <div id="finished" class="finished" style="display: none;">✅ タイマーが終了しました！</div>
</div>

<script>
  const expiresAt = ${expiresTimestamp || 'null'}

  if (expiresAt) {
    const timerElement = document.getElementById('timer')
    const finishedElement = document.getElementById('finished')

    const updateTimer = () => {
      const now = Date.now()
      const remaining = expiresAt - now

      if (remaining <= 0) {
        timerElement.style.display = 'none'
        finishedElement.style.display = 'block'
        clearInterval(interval)
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      timerElement.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`
    }

    const interval = setInterval(updateTimer, 1000)
    updateTimer()
  }
</script>
</body>
</html>
`
}

// タイマー表示と管理
app.get('/', async (c) => {
  const timer = await c.env.TIMER.get('timer')

  if (!timer) {
    return c.html(generateHTML(null))
  }

  const { expiresAt } = JSON.parse(timer)
  const remaining = expiresAt - Date.now()

  if (remaining <= 0) {
    await c.env.TIMER.delete('timer')
    return c.html(generateHTML(null))
  }

  return c.html(generateHTML(expiresAt))
})

// タイマー開始
app.post('/', async (c) => {
  const expiresAt = Date.now() + 3 * 60 * 1000  // 3分後
  await c.env.TIMER.put('timer', JSON.stringify({ expiresAt }))

  return c.redirect('/')
})

export default app
