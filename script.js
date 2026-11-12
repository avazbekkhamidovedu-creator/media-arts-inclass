const waitButton = document.getElementById('wait-button')
const waitMessage = document.getElementById('wait-message')

if (waitButton) {
  waitButton.addEventListener('click', () => {
    let remaining = 8
    waitButton.disabled = true
    waitMessage.textContent = `Your message arrives in ${remaining} seconds.`
    const timer = setInterval(() => {
      remaining--
      if (remaining > 0) {
        waitMessage.textContent = `Your message arrives in ${remaining} seconds.`
      } else {
        clearInterval(timer)
        waitMessage.textContent = 'A note from a neighbor: I hope you found a moment to breathe today.'
        waitButton.disabled = false
        waitButton.textContent = 'Begin again ↗'
      }
    }, 1000)
  })
}

const canvas = document.getElementById('trace')
if (canvas) {
  const context = canvas.getContext('2d')
  const buttons = document.querySelectorAll('[data-shape]')
  let shape = 'circle'
  let count = 0
  const colors = ['#f2d082', '#f5e8cc', '#93b8a0', '#274c43']

  buttons.forEach(button => button.addEventListener('click', () => {
    shape = button.dataset.shape
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)))
  }))

  canvas.addEventListener('pointerdown', event => {
    const bounds = canvas.getBoundingClientRect()
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height
    context.fillStyle = colors[count % colors.length]
    count++
    context.beginPath()
    if (shape === 'circle') context.arc(x, y, 27, 0, Math.PI * 2)
    if (shape === 'square') context.rect(x - 25, y - 25, 50, 50)
    if (shape === 'triangle') {
      context.moveTo(x, y - 30)
      context.lineTo(x + 29, y + 24)
      context.lineTo(x - 29, y + 24)
      context.closePath()
    }
    context.fill()
  })

  document.getElementById('clear-marks').addEventListener('click', () => {
    context.clearRect(0, 0, canvas.width, canvas.height)
    count = 0
  })
}
