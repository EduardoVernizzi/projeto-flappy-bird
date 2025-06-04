const overlay = document.getElementById('overlay')
const btnIniciar = document.getElementById('btn-iniciar')
const btnRestart = document.getElementById('btn-restart')
const musicaFundo = document.getElementById('musica-fundo')
const somGameOver = new Audio('sounds/gameover.mp3')

function novoElemento(tagName, className) {
  const elem = document.createElement(tagName)
  elem.className = className
  return elem
}

function Barreira(reversa = false) {
  this.elemento = novoElemento('div', 'barreira')
  const borda = novoElemento('div', 'borda')
  const corpo = novoElemento('div', 'corpo')

  this.elemento.appendChild(reversa ? corpo : borda)
  this.elemento.appendChild(reversa ? borda : corpo)

  this.setAltura = altura => corpo.style.height = `${altura}px`
}

function ParDeBarreiras(altura, abertura, x) {
  this.elemento = novoElemento('div', 'par-de-barreiras')
  this.superior = new Barreira(true)
  this.inferior = new Barreira(false)

  this.elemento.appendChild(this.superior.elemento)
  this.elemento.appendChild(this.inferior.elemento)

  this.sortearAbertura = () => {
    const alturaSuperior = Math.random() * (altura - abertura)
    const alturaInferior = altura - abertura - alturaSuperior
    this.superior.setAltura(alturaSuperior)
    this.inferior.setAltura(alturaInferior)
  }

  this.getX = () => parseInt(this.elemento.style.left?.split('px')[0] || '0')
  this.setX = x => this.elemento.style.left = `${x}px`
  this.getLargura = () => this.elemento.clientWidth

  this.sortearAbertura()
  this.setX(x)
}

function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
  this.pares = [
    new ParDeBarreiras(altura, abertura, largura),
    new ParDeBarreiras(altura, abertura, largura + espaco),
    new ParDeBarreiras(altura, abertura, largura + espaco * 2),
    new ParDeBarreiras(altura, abertura, largura + espaco * 3)
  ]

  const deslocamento = largura > 600 ? 3 : 2

  this.animar = () => {
    this.pares.forEach(par => {
      par.setX(par.getX() - deslocamento)

      if (par.getX() < -par.getLargura()) {
        par.setX(par.getX() + espaco * this.pares.length)
        par.sortearAbertura()
      }

      const meio = largura / 2
      const cruzouOMeio = par.getX() + deslocamento >= meio && par.getX() < meio
      if (cruzouOMeio) notificarPonto()
    })
  }
}

function Passaro(alturaJogo, escala = 1) {
  let voando = false

  this.elemento = novoElemento('img', 'passaro')
  this.elemento.src = 'imagens/passaro.png'
  this.elemento.style.width = `${60 * escala}px`
  this.elemento.style.bottom = '0px'

  this.getY = () => parseInt(this.elemento.style.bottom?.split('px')[0] || '0')
  this.setY = y => this.elemento.style.bottom = `${y}px`

  if ('ontouchstart' in window) {
    window.ontouchstart = () => voando = true
    window.ontouchend = () => voando = false
  } else {
    window.onkeydown = () => voando = true
    window.onkeyup = () => voando = false
  }

  this.animar = () => {
    const novoY = this.getY() + (voando ? 8 : -5)
    const alturaMaxima = alturaJogo - this.elemento.clientHeight

    if (novoY <= 0) this.setY(0)
    else if (novoY >= alturaMaxima) this.setY(alturaMaxima)
    else this.setY(novoY)
  }

  this.setY(alturaJogo / 2)
}

function Progresso() {
  this.elemento = novoElemento('span', 'progresso')
  this.atualizarPontos = pontos => this.elemento.innerHTML = pontos
  this.atualizarPontos(0)
}

function Recorde() {
  this.elemento = novoElemento('span', 'recorde')
  this.obter = () => parseInt(localStorage.getItem('recorde') || '0')
  this.atualizar = valor => this.elemento.innerHTML = `🏆 ${valor}`
  this.atualizar(this.obter())
}

function estaoSobrePostos(elementoA, elementoB) {
  const a = elementoA.getBoundingClientRect()
  const b = elementoB.getBoundingClientRect()
  const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left
  const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top
  return horizontal && vertical
}

function colidiu(passaro, barreiras) {
  return barreiras.pares.some(par => {
    const superior = par.superior.elemento
    const inferior = par.inferior.elemento
    return estaoSobrePostos(passaro.elemento, superior) ||
      estaoSobrePostos(passaro.elemento, inferior)
  })
}

function FlappyBird() {
  let pontos = 0

  const areaDoJogo = document.querySelector('[tp-flappy]')
  areaDoJogo.innerHTML = ''

  const largura = areaDoJogo.clientWidth

  const altura = largura < 480
    ? largura * (9 / 12)
    : largura * (7 / 12)

  areaDoJogo.style.height = `${altura}px`

  const larguraTela = window.innerWidth

  let espacoBarreiras

  if (larguraTela <= 600) {
    espacoBarreiras = 300
  } else if (larguraTela <= 1024) {
    espacoBarreiras = 400
  } else {
    espacoBarreiras = 450
  }

  let abertura
  if (larguraTela <= 600) {        // celular
    abertura = 170
  } else if (larguraTela <= 1024) { // tablet
    abertura = 190
  } else {                          // notebook/desktop
    abertura = 430
  }

  let escalaPassaro
  if (larguraTela <= 600) {
    escalaPassaro = 0.7
  } else if (larguraTela <= 1024) {
    escalaPassaro = 0.85
  } else {
    escalaPassaro = 1
  }

  const recorde = new Recorde()
  const progresso = new Progresso()
  const passaro = new Passaro(altura, escalaPassaro)
  const barreiras = new Barreiras(altura, largura, abertura, espacoBarreiras, () => {
    progresso.atualizarPontos(++pontos)
  })

  areaDoJogo.appendChild(recorde.elemento)
  areaDoJogo.appendChild(progresso.elemento)
  areaDoJogo.appendChild(passaro.elemento)
  barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

  this.temporizador = null

  this.start = () => {
    this.temporizador = setInterval(() => {
      barreiras.animar()
      passaro.animar()

      if (colidiu(passaro, barreiras)) {
        const recordeAtual = recorde.obter()
        if (pontos > recordeAtual) {
          localStorage.setItem('recorde', pontos)
          recorde.atualizar(pontos)
        }

        clearInterval(this.temporizador)
        overlay.style.display = 'flex'
        btnRestart.style.visibility = 'visible'
        btnIniciar.style.visibility = 'hidden'
        musicaFundo.pause()
        musicaFundo.currentTime = 0
        somGameOver.play()
      }
    }, 20)
  }

  this.stop = () => {
    if (this.temporizador) clearInterval(this.temporizador)
  }
}

let jogo = null

function iniciarJogo() {
  if (jogo) jogo.stop()
  jogo = new FlappyBird()
  jogo.start()

  overlay.style.display = 'none'
  btnIniciar.style.visibility = 'hidden'
  btnRestart.style.visibility = 'hidden'

  musicaFundo.pause()
  musicaFundo.currentTime = 0
  musicaFundo.play()
}

btnIniciar.addEventListener('click', iniciarJogo)
btnRestart.addEventListener('click', iniciarJogo)

// Opcional: delegação para garantir toque/click no botão restart em mobiles
overlay.addEventListener('click', (event) => {
  if (event.target === btnRestart) iniciarJogo()
})
overlay.addEventListener('touchstart', (event) => {
  if (event.target === btnRestart) iniciarJogo()
})

