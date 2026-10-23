import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildPiece, RING, type Piece } from './pieces'
import { LAYERS, type PieceId } from './timeline'

/**
 * Cena no estilo do site: a peça é impressa camada por camada numa mesa PEI,
 * com o cabeçote prata e o bico de latão percorrendo o contorno da camada
 * atual. Um plano de corte esconde o que ainda não foi impresso e o que falta
 * aparece como um contorno transparente, como na prévia do fatiador.
 */
export type Framing = 'hero' | 'card'

// sequência fixa: a mesa sai igual em toda abertura
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// mesa PEI texturizada: escura no tema escuro, clara no claro
function paintPlate(c: HTMLCanvasElement, light: boolean) {
  const g = c.getContext('2d')!
  const rand = rng(7)
  const [base, spread] = light ? [196, 22] : [18, 18]
  g.fillStyle = light ? '#c9cdd3' : '#141518'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 5000; i++) {
    const v = (base + rand() * spread) | 0
    g.fillStyle = `rgb(${v},${v},${v + 2})`
    g.fillRect(rand() * 256, rand() * 256, 1.4, 1.4)
  }
  g.strokeStyle = light ? 'rgba(23,26,30,.08)' : 'rgba(230,232,235,.06)'
  g.beginPath()
  for (let k = 0; k <= 256; k += 32) {
    g.moveTo(k, 0)
    g.lineTo(k, 256)
    g.moveTo(0, k)
    g.lineTo(256, k)
  }
  g.stroke()
}

function plateTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  paintPlate(c, false)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// relevo de uma linha por camada (a peça tem v = altura)
function layerTexture() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 32
  const g = c.getContext('2d')!
  const gr = g.createLinearGradient(0, 0, 0, 32)
  gr.addColorStop(0, '#000')
  gr.addColorStop(0.5, '#fff')
  gr.addColorStop(1, '#000')
  g.fillStyle = gr
  g.fillRect(0, 0, 4, 32)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1, LAYERS)
  return t
}

export type FrameInput = {
  /** segundos desde o início (move o bico e gira a mesa) */
  t: number
  /** 0 a 1 da peça já impressa */
  p: number
  /** sem movimento: peça parada e bico fixo */
  still: boolean
  /** -0,5 a 0,5 do ponteiro, para o leve deslocamento da câmera */
  px: number
  py: number
}

/** Cria o próprio canvas (renderer.domElement): quem chama coloca na página. */
export function createPrintScene(framing: Framing) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.localClippingEnabled = true
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x131519, 9, 20)
  // reflexo de um estúdio genérico: sem ele, metal fica escuro
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04).texture
  room.dispose()
  pmrem.dispose()
  scene.environment = env
  scene.environmentIntensity = 0.35
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 80)

  // three.js atual mede luz em unidades físicas: os valores do site × π
  scene.add(new THREE.HemisphereLight(0x8a90a0, 0x120c08, 1.8))
  const key = new THREE.DirectionalLight(0xfff1e2, 4.6)
  key.position.set(-4, 7, 5)
  const rim = new THREE.DirectionalLight(0xff2a2a, 3)
  rim.position.set(4, 3, -5)
  const hot = new THREE.PointLight(0xff3a1a, 0, 3.2, 2)
  scene.add(key, rim, hot)

  const plate = plateTexture()
  const bedGeo = new THREE.BoxGeometry(6, 0.12, 6)
  const bedMat = new THREE.MeshStandardMaterial({ map: plate, roughness: 1, metalness: 0 })
  const bed = new THREE.Mesh(bedGeo, bedMat)
  bed.position.y = -0.06
  scene.add(bed)

  // a peça: sólida até a camada atual, contorno transparente dali para cima
  const layers = layerTexture()
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
  const ghostClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const pieceMat = new THREE.MeshStandardMaterial({
    color: 0xc8100f,
    roughness: 0.36,
    metalness: 0.25,
    bumpMap: layers,
    bumpScale: 1.2,
    side: THREE.DoubleSide,
    clippingPlanes: [clip],
  })
  // acabamentos fixos: metal prateado e preto (viseira, pneus); a cor do carretel só muda a parte principal
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xc7cdd3, roughness: 0.22, metalness: 0.9, bumpMap: layers, bumpScale: 0.6, side: THREE.DoubleSide, clippingPlanes: [clip] })
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x24272c, roughness: 0.3, metalness: 0.2, bumpMap: layers, bumpScale: 0.6, side: THREE.DoubleSide, clippingPlanes: [clip] })
  const shellMat = new THREE.MeshBasicMaterial({ color: 0xc7cdd3, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [ghostClip] })
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xc7cdd3, transparent: true, opacity: 0.18, depthWrite: false, clippingPlanes: [ghostClip] })
  const table = new THREE.Group()
  // a ordem segue FINISHES: principal, metal, escuro
  const solid = new THREE.Mesh(new THREE.BufferGeometry(), [pieceMat, metalMat, darkMat])
  const shell = new THREE.Mesh(new THREE.BufferGeometry(), shellMat)
  const edges = new THREE.LineSegments(new THREE.BufferGeometry(), edgeMat)
  table.add(solid, shell, edges)
  scene.add(table)

  // filete quente na camada atual
  const ringPos = new Float32Array(RING * 3)
  const ringGeo = new THREE.BufferGeometry()
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))
  const ringMat = new THREE.PointsMaterial({ color: 0xff7048, size: 0.04, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  table.add(new THREE.Points(ringGeo, ringMat))

  // cabeçote: bloco prata, dissipador e bico de latão; barra do pórtico
  const head = new THREE.Group()
  const blockGeo = new THREE.BoxGeometry(0.5, 0.34, 0.42)
  const blockMat = new THREE.MeshStandardMaterial({ color: 0xb9bec5, roughness: 0.28, metalness: 0.85 })
  const block = new THREE.Mesh(blockGeo, blockMat)
  block.position.y = 0.42
  const sinkGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.22, 24)
  const sinkMat = new THREE.MeshStandardMaterial({ color: 0x9a9ca3, roughness: 0.35, metalness: 0.9 })
  const sink = new THREE.Mesh(sinkGeo, sinkMat)
  sink.position.y = 0.17
  const nozzleGeo = new THREE.ConeGeometry(0.085, 0.16, 24)
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xc89a52, roughness: 0.3, metalness: 1 })
  const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat)
  nozzle.rotation.x = Math.PI
  nozzle.position.y = 0.08
  head.add(block, sink, nozzle)
  const gantryGeo = new THREE.BoxGeometry(6.4, 0.12, 0.12)
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.45, metalness: 0.7 })
  const gantry = new THREE.Mesh(gantryGeo, gantryMat)
  scene.add(head, gantry)

  const built = new Map<PieceId, Piece>()
  let piece: Piece | null = null
  let dist = 9.2
  let aspect = 1
  let lift = 0
  let ringOpacity = 0.95
  let hotIntensity = 0
  // por onde o bico anda no contorno, e onde o cabeçote está de fato
  let walk = 0
  let walkLayer = -1
  const headAt = new THREE.Vector3()
  const target = new THREE.Vector3()
  let headReady = false
  const hi = framing === 'hero'

  // enquadra a peça inteira, mais o cabeçote; o herói tem mais respiro
  function fit() {
    if (!piece) return
    const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
    const k = hi ? 1.38 : 1.12
    const halfV = (piece.height * 0.5 + 0.55) * k
    const halfW = (piece.radius + 0.3) * k
    dist = Math.max(halfV / tan, halfW / (tan * aspect))
    const fog = scene.fog as THREE.Fog
    fog.near = dist - 0.5 + piece.radius * 0.5
    fog.far = fog.near + 4.5
  }

  function setPiece(id: PieceId) {
    let pc = built.get(id)
    if (!pc) {
      pc = buildPiece(id)
      built.set(id, pc)
    }
    if (pc === piece) return
    piece = pc
    solid.geometry = pc.geometry
    shell.geometry = pc.geometry
    edges.geometry = pc.edges
    walkLayer = -1
    headReady = false
    fit()
  }

  function resize(w: number, h: number) {
    if (!w || !h) return
    renderer.setSize(w, h, false)
    aspect = w / h
    cam.aspect = aspect
    cam.updateProjectionMatrix()
    fit()
  }

  function render({ t, p: raw, still, px, py }: FrameInput) {
    if (!piece) return
    const p = Math.min(1, Math.max(0, raw))
    const h = piece.height
    const c = h * p
    clip.constant = c + 0.0005
    ghostClip.constant = -c
    const turn = piece.pose + (still ? 0 : t * 0.18)
    table.rotation.y = turn

    const L = Math.min(piece.layers.length - 1, Math.floor(p * piece.layers.length))
    const pts = piece.layers[L]
    const has = pts.length > 0
    if (has) {
      for (let i = 0; i < RING; i++) {
        ringPos[i * 3] = pts[i * 2]
        ringPos[i * 3 + 1] = c + 0.003
        ringPos[i * 3 + 2] = pts[i * 2 + 1]
      }
      ringGeo.attributes.position.needsUpdate = true
      // camada nova: o bico continua do ponto mais perto de onde estava
      if (L !== walkLayer) {
        const old = walkLayer >= 0 ? piece.layers[walkLayer] : null
        if (old?.length) {
          const prev = Math.floor(walk) % RING
          let best = 0
          let bestD = Infinity
          for (let i = 0; i < RING; i++) {
            const d = (pts[i * 2] - old[prev * 2]) ** 2 + (pts[i * 2 + 1] - old[prev * 2 + 1]) ** 2
            if (d < bestD) {
              bestD = d
              best = i
            }
          }
          walk = best
        }
        walkLayer = L
      }
    }

    // pronta: o filete apaga e o cabeçote sobe
    const done = p >= 0.999
    if (still) {
      ringOpacity = done || !has ? 0 : 0.95
      lift = done ? 1.6 : 0
      hotIntensity = done ? 0 : 7
    } else {
      ringOpacity = done || !has ? Math.max(0, ringOpacity - 0.03) : 0.95
      lift = done ? Math.min(1.6, lift + 0.02) : 0
      hotIntensity = done ? Math.max(0, hotIntensity - 0.15) : 7 + Math.sin(t * 30)
      walk += 1.2
    }
    ringMat.opacity = ringOpacity

    // ponto do contorno, girado junto com a mesa
    const j = Math.floor(still ? RING * 0.3 : walk) % RING
    const lx = has ? pts[j * 2] : 0
    const lz = has ? pts[j * 2 + 1] : 0
    const cos = Math.cos(turn)
    const sin = Math.sin(turn)
    target.set(lx * cos + lz * sin, c, -lx * sin + lz * cos)
    if (!headReady || still) {
      headAt.copy(target)
      headReady = true
    } else headAt.lerp(target, 0.35)
    head.position.set(headAt.x, headAt.y + 0.01 + lift, headAt.z)
    gantry.position.set(0, headAt.y + 0.43 + lift, headAt.z)
    hot.position.set(headAt.x, headAt.y + 0.05, headAt.z)
    hot.intensity = hotIntensity

    const lookY = h * (0.4 + 0.12 * p)
    cam.position.set(px * 1.2, lookY + dist * (piece.elev + 0.06 * p) - py * 0.6, dist)
    cam.lookAt(0, lookY, 0)
    renderer.render(scene, cam)
  }

  return {
    canvas: renderer.domElement,
    resize,
    render,
    setPiece,
    setColor(color: string) {
      pieceMat.color.set(color)
    },
    /** a névoa some na cor do fundo atrás da cena; fundo claro pede mesa clara */
    setBackground(color: string) {
      const fog = (scene.fog as THREE.Fog).color.setStyle(color)
      const light = fog.getHSL({ h: 0, s: 0, l: 0 }).l > 0.5
      paintPlate(plate.image as HTMLCanvasElement, light)
      plate.needsUpdate = true
      for (const m of [shellMat, edgeMat]) m.color.set(light ? 0x4f5761 : 0xc7cdd3)
      shellMat.opacity = light ? 0.07 : 0.05
      edgeMat.opacity = light ? 0.24 : 0.18
    },
    dispose() {
      for (const pc of built.values()) {
        pc.geometry.dispose()
        pc.edges.dispose()
      }
      for (const g of [bedGeo, ringGeo, blockGeo, sinkGeo, nozzleGeo, gantryGeo]) g.dispose()
      for (const m of [bedMat, pieceMat, metalMat, darkMat, shellMat, edgeMat, ringMat, blockMat, sinkMat, nozzleMat, gantryMat]) m.dispose()
      plate.dispose()
      layers.dispose()
      env.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
