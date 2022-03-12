// https://www.youtube.com/watch?v=87J8EhKMH6c
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import front from './assets/ribbon-front.png'
import back from './assets/ribbon-back.png'

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const mouse = {
  x: 0,
  y: 0,
}

const canvas = document.getElementById('webGL')

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera()
const controls = new OrbitControls(camera, canvas)
const renderer = new THREE.WebGLRenderer({ canvas })
const clock = new THREE.Clock()

controls.enableDamping = true

camera.fov = 75
camera.aspect = size.width / size.height
camera.far = 100
camera.near = 0.1
camera.position.set(0, 0, 2)

scene.add(camera)

const sphereGeometry = new THREE.SphereBufferGeometry(1, 32, 32)
const sphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
})
const sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial)
sphereObject.visible = false
scene.add(sphereObject)

const curvePoints = []
const curvePointsNum = 7

for (let i = 0; i < curvePointsNum; i++) {
  const theta = (i / curvePointsNum) * Math.PI * 2
  curvePoints.push(
    new THREE.Vector3().setFromSphericalCoords(
      1,
      Math.PI / 2 + (Math.random() - 0.5),
      theta,
    ),
  )
}

const curve = new THREE.CatmullRomCurve3(curvePoints)
curve.tension = 0.1
curve.closed = true

const points = curve.getPoints(50)
const geometry = new THREE.BufferGeometry().setFromPoints(points)

const material = new THREE.LineBasicMaterial({ color: 0xff0000 })

// Create the final object to add to the scene
const curveObject = new THREE.Line(geometry, material)
curveObject.visible = false
scene.add(curveObject)

const number = 1000
const frenetFrames = curve.computeFrenetFrames(number, true)
const spacedPoints = curve.getSpacedPoints(number)

const dimensions = [-0.1, 0.1]
let point = new THREE.Vector3()
let binormalShift = new THREE.Vector3()

const finalPoints = []

for (const dimension of dimensions) {
  for (let i = 0; i <= number; i++) {
    point = spacedPoints[i]
    binormalShift.add(frenetFrames.binormals[i]).multiplyScalar(dimension)
    finalPoints.push(
      new THREE.Vector3().copy(point).add(binormalShift).normalize(),
    )
  }
}
finalPoints[0].copy(finalPoints[number])
finalPoints[number + 1].copy(finalPoints[2 * number + 1])

const frontTexture = new THREE.TextureLoader().load(front)
const backTexture = new THREE.TextureLoader().load(back)

for (const texture of [frontTexture, backTexture]) {
  texture.wrapS = 1000
  texture.wrapT = 1000
  texture.repeat.set(1, 1)
  texture.offset.setX(0.5)
  texture.flipY = false
}
backTexture.repeat.set(-1, 1)

const frontMaterial = new THREE.MeshStandardMaterial({
  map: frontTexture,
  side: THREE.BackSide,
  roughness: 0.65,
  metalness: 0.2,
  alphaTest: true,
  flatShading: true,
})
const backMaterial = new THREE.MeshStandardMaterial({
  map: backTexture,
  side: THREE.FrontSide,
  roughness: 0.65,
  metalness: 0.2,
  alphaTest: true,
  flatShading: true,
})

const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, number, 1)
planeGeometry.setFromPoints(finalPoints)
planeGeometry.addGroup(0, 6000, 0)
planeGeometry.addGroup(0, 6000, 1)
const planeObject = new THREE.Mesh(planeGeometry, [frontMaterial, backMaterial])

scene.add(planeObject)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
ambientLight.position.set(5, 5, -5)
scene.add(ambientLight)

const dirLightBack = new THREE.DirectionalLight(0xffffff)
dirLightBack.position.set(0, 0, 2)
scene.add(dirLightBack)

const dirLightFront = new THREE.DirectionalLight(0xffffff, 0.2)
dirLightFront.position.set(0, 0, -2)
scene.add(dirLightFront)

function resizeHandler() {
  size.height = window.innerHeight
  size.width = window.innerWidth

  camera.aspect = size.width / size.height
  camera.updateProjectionMatrix()

  renderer.setSize(size.width, size.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}
resizeHandler()
window.addEventListener('resize', resizeHandler)

function tick() {
  const elapsedTime = clock.getElapsedTime()
  const delta = clock.getDelta()

  frontMaterial.map.offset.setX(elapsedTime / 20)
  backMaterial.map.offset.setX(-elapsedTime / 20)

  camera.position.set(
    THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.5, 0.1),
    THREE.MathUtils.lerp(camera.position.y, mouse.y * 0.5, 0.1),
    2,
  )

  controls.update()

  renderer.render(scene, camera)

  window.requestAnimationFrame(tick)
}
tick()

let timeoutId

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / size.width) * 2 - 1
  mouse.y = (-e.clientY / size.height) * 2 + 1
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    mouse.x = 0
    mouse.y = 0
  }, 1000)
})
