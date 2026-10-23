import * as THREE from 'three'
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Part } from './parse'

export type Bed = { x: number; y: number; z: number }

/**
 * Monta a cena: as peças (em mm, Z para cima, como no fatiador) viram Y para
 * cima do three.js, centralizadas e apoiadas na mesa.
 */
export function buildScene(parts: Part[], color: string, bed: Bed | null) {
  const scene = new THREE.Scene()
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 })
  let triangles = 0
  for (const p of parts) {
    let geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(p.positions, 3))
    triangles += p.positions.length / 9
    // normais suaves nas curvas e quinas vivas acima de 30°; malha enorme fica facetada
    geo = triangles < 600_000 ? toCreasedNormals(geo, Math.PI / 6) : (geo.computeVertexNormals(), geo)
    group.add(new THREE.Mesh(geo, material))
  }
  group.rotation.x = -Math.PI / 2
  group.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  group.position.set(-center.x, -box.min.y, -center.z)
  group.updateMatrixWorld(true)
  scene.add(group)

  const size = box.getSize(new THREE.Vector3())
  const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere())

  // mesa: contorno no tamanho da impressora e grade de 10 mm
  if (bed) {
    const grid = new THREE.GridHelper(Math.max(bed.x, bed.y), Math.round(Math.max(bed.x, bed.y) / 10), 0x8a919c, 0x8a919c)
    const gm = grid.material as THREE.Material
    gm.transparent = true
    gm.opacity = 0.18
    scene.add(grid)
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-bed.x / 2, 0, -bed.y / 2),
        new THREE.Vector3(bed.x / 2, 0, -bed.y / 2),
        new THREE.Vector3(bed.x / 2, 0, bed.y / 2),
        new THREE.Vector3(-bed.x / 2, 0, bed.y / 2),
      ]),
      new THREE.LineBasicMaterial({ color: 0x8a919c, transparent: true, opacity: 0.6 }),
    )
    scene.add(outline)
  }

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f47, 1.6))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(1, 2, 1.4).multiplyScalar(sphere.radius * 4 || 100)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.6)
  fill.position.set(-1.2, 0.6, -1).multiplyScalar(sphere.radius * 4 || 100)
  scene.add(fill)

  const dispose = () => {
    group.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    material.dispose()
  }

  return { scene, material, sphere, size, dispose }
}

/** Câmera em vista isométrica enquadrando a peça. */
export function frame(camera: THREE.PerspectiveCamera, sphere: THREE.Sphere) {
  const r = sphere.radius || 50
  const dist = (r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.15
  const dir = new THREE.Vector3(1, 0.85, 1.25).normalize()
  camera.position.copy(sphere.center).addScaledVector(dir, dist)
  camera.near = dist / 100
  camera.far = dist * 20
  camera.lookAt(sphere.center)
  camera.updateProjectionMatrix()
}

/** Imagem PNG: transparente para a miniatura da lista, com fundo para mandar ao cliente. */
export async function renderImage(parts: Part[], color: string, width = 480, height = 360, background?: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(width, height, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const { scene, sphere, dispose } = buildScene(parts, color, null)
  if (background) scene.background = new THREE.Color(background)
  const camera = new THREE.PerspectiveCamera(35, width / height)
  frame(camera, sphere)
  renderer.render(scene, camera)
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
  dispose()
  renderer.dispose()
  renderer.forceContextLoss()
  if (!blob) throw new Error('Não deu para gerar a imagem do modelo.')
  return blob
}
