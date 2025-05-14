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

  const deslocamento = 3

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

function Passaro(alturaJogo) {
  let voando = false

  this.elemento = novoElemento('img', 'passaro')
  this.elemento.src = 'imagens/passaro.png'
  this.elemento.style.bottom = '0px'

  this.getY = () => parseInt(this.elemento.style.bottom?.split('px')[0] || '0')
  this.setY = y => this.elemento.style.bottom = `${y}px`

  window.onkeydown = () => voando = true
  window.onkeyup = () => voando = false

  this.animar = () => {
    const novoY = this.getY() + (voando ? 8 : -5)
    const alturaMaxima = alturaJogo - this.elemento.clientHeight

    if (novoY <= 0) {
      this.setY(0)
    } else if (novoY >= alturaMaxima) {
      this.setY(alturaMaxima)
    } else {
      this.setY(novoY)
    }
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

  this.atualizar = valor => {
    this.elemento.innerHTML = `🏆 ${valor}`
  }

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

  const altura = areaDoJogo.clientHeight
  const largura = areaDoJogo.clientWidth

  const recorde = new Recorde()
  const progresso = new Progresso()
  const passaro = new Passaro(altura)
  const barreiras = new Barreiras(altura, largura, 200, 400, () => {
    progresso.atualizarPontos(++pontos)
  })

  // Adiciona os elementos na ordem
  areaDoJogo.appendChild(recorde.elemento)
  areaDoJogo.appendChild(progresso.elemento)
  areaDoJogo.appendChild(passaro.elemento)
  barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

  this.start = () => {
    const temporizador = setInterval(() => {
      barreiras.animar()
      passaro.animar()

      if (colidiu(passaro, barreiras)) {
        const recordeAtual = recorde.obter()
        if (pontos > recordeAtual) {
          localStorage.setItem('recorde', pontos)
          recorde.atualizar(pontos)
        }

        clearInterval(temporizador)
        document.getElementById('overlay').style.display = 'flex'
        document.getElementById('btn-restart').style.display = 'inline-block'
        musicaFundo.pause()
        musicaFundo.currentTime = 0
        somGameOver.play()
      }
    }, 20)
  }
}


// CONTROLE DOS BOTÕES
let jogo = null

const btnIniciar = document.getElementById('btn-iniciar')
const btnRestart = document.getElementById('btn-restart')
const overlay = document.getElementById('overlay')
const musicaFundo = document.getElementById('musica-fundo')
musicaFundo.volume = 0.3 // volume entre 0.0 e 1.0
const somGameOver = new Audio('./sounds/gameover.mp3');

overlay.style.display = 'flex' // exibe overlay ao carregar

btnIniciar.onclick = () => {
  if (jogo) return
  jogo = new FlappyBird()
  jogo.start()
  btnIniciar.style.display = 'none'
  overlay.style.display = 'none'
  musicaFundo.currentTime = 0
  musicaFundo.play()
}

btnRestart.onclick = () => {
  jogo = new FlappyBird()
  jogo.start()
  btnIniciar.style.display = 'none'
  overlay.style.display = 'none'
  musicaFundo.currentTime = 0
  musicaFundo.play()
}
