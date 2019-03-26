const d2r = d => d * (Math.PI / 180)
const r2d = r => r * (180 / Math.PI)

class Screen {
  constructor (width, height) {
    this.width = width
    this.height = height

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.style.imageRendering = 'pixelated'
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.textBaseline = 'top'
    document.body.appendChild(canvas)

    const ww = window.innerWidth - 128
    const wh = window.innerHeight - 128
    const ar = wh / ww

    canvas.style.width = `${ww}px`
    canvas.style.height = `${ww * ar}px`

    this.canvas = canvas
    this.ctx = ctx

    this.clear = this.clear.bind(this)
    this.drawLine = this.drawLine.bind(this)
    this.drawRect = this.drawRect.bind(this)
    this.drawCircle = this.drawCircle.bind(this)
    this.drawText = this.drawText.bind(this)
    this.drawPie = this.drawPie.bind(this)
  }

  clear (color) {
    const { ctx, width, height } = this
    if (color) { ctx.fillStyle = color }
    ctx.fillRect(0, 0, width, height)
  }

  drawLine (x0, y0, x1, y1, color) {
    const { ctx } = this
    if (color) { ctx.strokeStyle = color }
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }

  drawRect (x, y, width, height, color) {
    const { ctx } = this
    if (color) { ctx.fillStyle = color }
    ctx.fillRect(x, y, width, height)
  }

  drawCircle (x, y, radius, color) {
    const { ctx } = this
    if (color) { ctx.fillStyle = color }
    ctx.beginPath()
    ctx.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2, false)
    ctx.fill()
  }

  drawText (text, x, y, color, font, size) {
    const { ctx } = this
    if (color) { ctx.fillStyle = color }
    if (font && size) { ctx.font = `${size}px ${font}` }
    ctx.fillText(text, x, y)
  }

  drawPie (x, y, radius, startAngle, endAngle, color) {
    const { ctx } = this
    if (color) { ctx.fillStyle = color }
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, radius, startAngle, endAngle, false)
    // ctx.ellipse(x, y, radius, radius, 0, startAngle, endAngle, false)
    ctx.fill()
  }
}

const Key = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  A: 32, // SPACE
  B: 27, // ESC
  X: 9, // TAB
  Y: 17 // CTRL
}

class Input {
  constructor (screenRef) {
    this.screen = screenRef
    this.state = {}
    this.up = this.up.bind(this)
    this.down = this.down.bind(this)
    this.left = this.left.bind(this)
    this.right = this.right.bind(this)
    this.update = this.update.bind(this)
    this.xKey = this.xKey.bind(this)
    this.yKey = this.yKey.bind(this)
    this.aKey = this.aKey.bind(this)
    this.bKey = this.bKey.bind(this)

    const keys = Object.keys(Key).map(k => Key[k])
    const state = this.state
    window.addEventListener('keydown', e => {
      keys.includes(e.which) && e.preventDefault()
      state[e.which] = true
    }, false)
    window.addEventListener('keyup', e => {
      keys.includes(e.which) && e.preventDefault()
      state[e.which] = false
    }, false)
  }

  up () {
    return !!this.state[Key.UP]
  }

  down () {
    return !!this.state[Key.DOWN]
  }

  left () {
    return !!this.state[Key.LEFT]
  }

  right () {
    return !!this.state[Key.RIGHT]
  }

  aKey () {
    return !!this.state[Key.A]
  }

  bKey () {
    return !!this.state[Key.B]
  }

  xKey () {
    return !!this.state[Key.X]
  }

  yKey () {
    return !!this.state[Key.Y]
  }

  update (deltaTime) {}
}

class Engine {
  constructor (inputRef, screenRef, gameRef) {
    this.input = inputRef
    this.screen = screenRef
    this.game = gameRef

    this.mainLoop = this.mainLoop.bind(this)
    this.update = this.update.bind(this)
    this.getTime = this.getTime.bind(this)

    this.elapsedTime = 0
    this.deltaTime = 0.33
    this.lastTime = this.getTime()
  }

  mainLoop () {
    this.update(this.deltaTime)
    const currentTime = this.getTime()
    this.deltaTime = currentTime - this.lastTime
    this.elapsedTime += this.deltaTime
    this.lastTime = currentTime
    window.requestAnimationFrame(this.mainLoop)
  }

  getTime () {
    return Date.now() * 0.001
  }

  update (deltaTime) {
    const {
      screen,
      input,
      game
    } = this

    input.update && input.update(deltaTime)
    game.update && game.update(deltaTime)
    screen.update && screen.update(deltaTime)
  }
}

class Dungeon {
  constructor () {
    this.width = 20
    this.height = 20
    this.walls = [
      'xxxxxxxxxxxxxxxxxxxx',
      'x..................x',
      'x........xxx.......x',
      'x....x.........x...x',
      'x....x.............x',
      'x....x.............x',
      'x...............x..x',
      'x.........xxx......x',
      'x..................x',
      'xxxxxxxxxxxxxxxxxxxx'
    ]

    this.width = this.walls[0].length
    this.height = this.walls.length
    this.walls = this.walls.join('').split('').map(t => t === '.' ? 0 : 1)

    this.isWall = this.isWall.bind(this)

    this.drawMinimap = this.drawMinimap.bind(this)
    this.drawRaycast = this.drawRaycast.bind(this)
  }

  isWall (x, y) {
    const wallId = this.walls[~~x + ~~y * this.width] || 0
    return wallId > 0
  }

  drawMinimap (screen, player) {
    const { width, height } = this

    // minimap uses top left 1/4 of the screen
    const minimapWidth = ~~(screen.width * 0.25)
    const minimapHeight = ~~(screen.height * 0.25)
    const cellWidth = ~~(minimapWidth / width)
    const cellHeight = ~~(minimapHeight / height)
    screen.drawRect(0, 0, minimapWidth, minimapHeight, 'rgba(255, 255, 255, 0.2)')

    for (let y = 0; y < height; y += 1) {
      const cellY = y * cellHeight
      for (let x = 0; x < width; x += 1) {
        const cellX = x * cellWidth
        const isWall = this.isWall(x, y)
        if (isWall) {
          screen.drawRect(cellX, cellY, cellWidth - 1, cellHeight - 1, '#777')
        }
      }
    }

    // draw player pos
    const px = ~~player.x * cellWidth
    const py = ~~player.y * cellHeight

    const hfov = player.fov * 0.5
    screen.drawPie(px, py, minimapWidth / 2, player.angle - hfov, player.angle + hfov, 'rgba(255, 255, 255, 0.1)')
    screen.drawCircle(px, py, 4, 'lime')

    screen.drawText(`x: ${~~player.x} y: ${~~player.y} angle: ${r2d(player.angle).toFixed(2)}`, minimapWidth + 4, screen.height * 0.75, '#fff', 'monospace', 16)
  }

  drawRaycast (screen, player) {
    const { width, height } = this

    // raycast area uses top/right 3/4 of the width and 2/3 the height of the screen
    const renderWidth = ~~(screen.width * 0.75)
    const renderHeight = ~~(screen.height * 0.6666)
    const renderX = screen.width - renderWidth
    const renderY = 0

    // raycast area is going to use a resolution of 160 x 100 "pixels"
    const resX = 160
    const resY = 100
    const pixelWidth = Math.ceil(renderWidth / resX)
    const pixelHeight = Math.ceil(renderHeight / resY)

    const renderPixel = (x, y, color) => {
      screen.drawRect(
        renderX + x * pixelWidth,
        renderY + y * pixelHeight,
        pixelWidth,
        pixelHeight,
        color
      )
    }

    // fill
    screen.drawRect(renderX, renderY, renderWidth, renderHeight, 'rgba(255, 255, 255, 0.1)')

    // render

    // for each pixel of the render horizontal
    for (let x = 0; x < resX; x += 1) {
      // calculate the projected ray angle into world space
      const rayAngle = (player.angle - player.fov * 0.5) + (x / resX) * player.fov

      // distance from player to wall for given ray angle
      let distanceToWall = 0

      // unit vector for ray in player space
      const eyeX = Math.cos(rayAngle)
      const eyeY = Math.sin(rayAngle)

      // maximum distance to attempt to cast is the dungeon extents
      const depth = Math.max(width, height)

      let hitWall = false

      while (!hitWall && distanceToWall < depth) {
        distanceToWall += 0.1
        const testX = ~~(player.x + eyeX * distanceToWall)
        const testY = ~~(player.y + eyeY * distanceToWall)
        // out of bounds of the dungeon
        if (testX < 0 || testX >= width || testY < 0 || testY >= height) {
          hitWall = true
          distanceToWall = depth
        } else {
          if (this.isWall(testX, testY)) {
            hitWall = true
          }
        }
      }

      // calculate distance to ceiling and floor
      const ceiling = (resY * 0.5) - (resY / distanceToWall)
      const floor = resY - ceiling

      let wallShade = (1.0 - (distanceToWall / depth)) * 70
      const wallColor = `hsl(208, 3%, ${wallShade}%)`

      // draw column
      for (let y = 0; y < resY; y += 1) {
        if (y < ceiling) {
          // ceiling
          let ceilingShade = 0
          const base = 1.0 - (y / resY)
          ceilingShade = base * 40
          const ceilingColor = `hsl(31, 8%, ${ceilingShade}%)`
          renderPixel(x, y, ceilingColor)
        } else if (y > ceiling && y <= floor) {
          // wall
          renderPixel(x, y, wallColor)
        } else {
          // floor
          let floorShade = 0
          const base = 1.0 - ((y - resY * 0.5) / (resY * 0.5))
          // if (base < 0.25) {
          //   floorShade = 50
          // } else if (base < 0.5) {
          //   floorShade = 40
          // } else if (base < 0.75) {
          //   floorShade = 30
          // } else if (base < 0.9) {
          //   floorShade = 20
          // } else {
          //   floorShade = 0
          // }

          floorShade = (1.0 - base) * 70

          const floorColor = `hsl(31, 8%, ${floorShade}%)`
          renderPixel(x, y, floorColor)
        }
      }
    }
  }
}

class Player {
  constructor (x, y, gameRef) {
    this.game = gameRef

    this.fov = d2r(90)

    this.x = x
    this.y = y
    this.angle = 0
    this.startX = x
    this.startY = y
    this.startAngle = 0

    this.reset = this.reset.bind(this)
    this.update = this.update.bind(this)
  }

  reset () {
    this.x = this.startX
    this.y = this.startY
    this.angle = this.startAngle
  }

  update (dt) {
    const { input, dungeon, screen } = this.game

    const turnSpeed = 2
    const walkSpeed = 5.0

    if (input.left()) {
      this.angle -= turnSpeed * dt
    } else if (input.right()) {
      this.angle += turnSpeed * dt
    }

    if (input.up()) {
      const moveX = Math.cos(this.angle) * walkSpeed * dt
      const moveY = Math.sin(this.angle) * walkSpeed * dt
      let nextX = this.x + moveX
      let nextY = this.y + moveY
      if (dungeon.isWall(nextX, nextY)) {
        nextX = this.x
        nextY = this.y
      }
      this.x = nextX
      this.y = nextY
    } else if (input.down()) {
      const moveX = Math.cos(this.angle) * walkSpeed * dt
      const moveY = Math.sin(this.angle) * walkSpeed * dt
      let nextX = this.x - moveX
      let nextY = this.y - moveY
      if (dungeon.isWall(nextX, nextY)) {
        nextX = this.x
        nextY = this.y
      }
      this.x = nextX
      this.y = nextY
    }
  }
}

class Game {
  constructor (width, height, title) {
    this.screen = new Screen(width, height)
    this.input = new Input(this.screen)
    this.engine = new Engine(this.input, this.screen, this)
    this.dungeon = new Dungeon()
    this.player = new Player(~~(this.dungeon.width / 2), ~~(this.dungeon.height / 2), this)

    this.update = this.update.bind(this)
    this.start = this.start.bind(this)

    this.b = {
      x: 0,
      y: 0,
      xv: 1,
      xs: 300
    }

    document.title = title
  }

  update (dt) {
    const {
      screen,
      // engine,
      dungeon,
      // input,
      b,
      player
    } = this

    player.update(dt)

    b.x += b.xv * b.xs * dt
    if (b.x > screen.width || b.x < 0) {
      b.xv = -b.xv
      b.x += b.xv * b.xs * dt
    }
    screen.clear('#000')

    dungeon.drawRaycast(screen, player)
    dungeon.drawMinimap(screen, player)

    // screen.drawLine(0, screen.height, b.x, b.y, 'white')
  }

  start () {
    this.engine.mainLoop()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game(640, 480, 'Dungeon Crawler RPG')

  game.start()

  // debugging vars
  window._game = game
  window._engine = game.engine
  window._screen = game.screen
  window._input = game.input
})
