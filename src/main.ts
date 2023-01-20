import { PulsarCurve } from './PulsarCurve'
import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { range } from 'lodash'
import { Vector3 } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'

type CurveObject = THREE.Object3D<THREE.Event>

CameraControls.install({ THREE: THREE })

let renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.OrthographicCamera,
  curves: CurveObject[] = [],
  cameraControls: CameraControls

const clock = new THREE.Clock()
const FRUSTRUM = 1000
const SCALE = 100

const updateSize = () => {
  const aspect = window.innerWidth / window.innerHeight

  camera.left = (-FRUSTRUM * aspect) / 2
  camera.right = (FRUSTRUM * aspect) / 2
  camera.top = FRUSTRUM / 2
  camera.bottom = -FRUSTRUM / 2

  camera.updateProjectionMatrix()

  curves.forEach(curve => {
    ;(curve.children[1] as Line2).material.resolution.set(
      window.innerWidth,
      window.innerHeight
    )
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
}

const init = () => {
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  document.body.appendChild(renderer.domElement)
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000)
  updateSize()
  camera.position.set(0, 0, SCALE)
  cameraControls = new CameraControls(camera, renderer.domElement)

  // drawing

  // scene.add(new THREE.GridHelper(100, 10))

  const centralLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new Vector3(0, -1000, 0),
    new Vector3(0, 1000, 0),
  ])
  const centralLineMaterial = new THREE.LineBasicMaterial({
    color: 0x3f3f3f,
    opacity: 0.5,
  })
  const centralLine = new THREE.Line(centralLineGeometry, centralLineMaterial)
  // scene.add(centralLine)
  // setting curves

  curves = range(60)
    .map(
      () =>
        new PulsarCurve(
          new THREE.Vector2(-SCALE / 1.8, 0),
          new THREE.Vector2(SCALE / 1.8, 0),
          SCALE
        )
    )
    .map((curve, i) => {
      const shape = new THREE.Shape()
      const points = curve.getPoints(200)
      shape.moveTo(-SCALE / 2, 0)
      shape.setFromPoints(points)
      shape.lineTo(SCALE / 2, -20)
      shape.lineTo(-SCALE / 2, -20)
      shape.lineTo(-SCALE / 2, 0)

      const object = new THREE.Object3D()
      const face = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
        })
      )
      const lineGeometry = new LineGeometry()
      lineGeometry.setPositions(
        points.reduce<number[]>((acc, point, i) => {
          acc.push(point.x, point.y, 0)
          return acc
        }, [])
      )
      const lineMaterial = new LineMaterial({ color: 0xffffff, linewidth: 1 })
      const line = new Line2(lineGeometry, lineMaterial)

      line.computeLineDistances()
      object.add(face)
      object.add(line)

      object.position.setY(-i * 2)
      object.position.setZ(i)
      return object
    })
  const curvesGroup = new THREE.Group()

  curves.forEach(curve => curvesGroup.add(curve))
	scene.add(curvesGroup)
	
  // const boundingBox = new THREE.BoxHelper(curvesGroup, 0xffffff)
  // scene.add(boundingBox)
  cameraControls.fitToBox(curvesGroup, false, {
    paddingTop: window.innerHeight / 6,
    paddingBottom: window.innerHeight / 6 - 20,
  })

  cameraControls.dampingFactor = 0.15
  cameraControls.draggingDampingFactor = 0.15
  window.addEventListener('resize', updateSize)
  updateSize()
}

const anim = () => {
  const delta = clock.getDelta()
  cameraControls.update(delta)

  requestAnimationFrame(anim)
  renderer.render(scene, camera)
}

init()
anim()

