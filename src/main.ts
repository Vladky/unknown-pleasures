import { PulsarCurve } from './PulsarCurve'
import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { clamp, range, throttle } from 'lodash'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import gsap from 'gsap'

type CurveObject = THREE.Object3D<THREE.Event>

CameraControls.install({ THREE: THREE })

const cache: Record<
  number,
  Record<number, [THREE.ShapeGeometry, LineGeometry]>
> = {}

const clock = new THREE.Clock()
const FRUSTRUM = 1000
const SCALE = 100
const CURVES_COUNT = 60
const MOVE_STEP = 1
const POINTS_PER_CURVE = 180

const tween = {
  x: 0,
}

let renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.OrthographicCamera,
  curves: CurveObject[] = [],
  cameraControls: CameraControls,
  raycaster: THREE.Raycaster = new THREE.Raycaster(),
  boxWidth: number

const pointer: THREE.Vector3 = new THREE.Vector3(0, 0, FRUSTRUM)

const pulsarCurves: PulsarCurve[] = range(CURVES_COUNT).map(
  () =>
    new PulsarCurve(
      new THREE.Vector2(-SCALE / 1.8, 0),
      new THREE.Vector2(SCALE / 1.8, 0),
      SCALE
    )
)

const fillCache = () =>
  range(boxWidth).forEach(peakX => {
    const x =
      Math.floor(peakX - boxWidth / 2) -
      (Math.floor(peakX - boxWidth / 2) % MOVE_STEP)
    range(CURVES_COUNT).forEach(i => {
      if (cache[x]?.[i]) return
      const shape = new THREE.Shape()
      const points = pulsarCurves[i].getPoints(100, x)
      shape.moveTo(-SCALE / 2, 0)
      shape.setFromPoints(points)
      shape.lineTo(SCALE / 2, -20)
      shape.lineTo(-SCALE / 2, -20)
      shape.lineTo(-SCALE / 2, 0)
      const shapeGeometry = new THREE.ShapeGeometry(shape)

      const lineGeometry = new LineGeometry()
      lineGeometry.setPositions(
        points.reduce<number[]>((acc, point) => {
          acc.push(point.x, point.y, 0)
          return acc
        }, [])
      )

      cache[x] = cache[x] || {}
      cache[x][i] = [
        shapeGeometry.clone(),
        lineGeometry.clone() as LineGeometry,
      ]
    })
  })
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

const updateCurves = () => {
  const offset = boxWidth / 8
  let peakX = clamp(tween.x, -boxWidth / 2 + offset, boxWidth / 2 - offset)
  peakX = peakX - (peakX % MOVE_STEP)

  curves.forEach((curve, i) => {
    if (cache[peakX]?.[i]) {
      // ;(curve.children[0] as THREE.Mesh<THREE.ShapeGeometry>).geometry.dispose()
      ;(curve.children[0] as THREE.Mesh<THREE.ShapeGeometry>).geometry =
        cache[peakX][i][0]
      // ;(curve.children[1] as Line2).geometry.dispose()
      ;(curve.children[1] as Line2).geometry = cache[peakX][i][1]
    } else {
      console.warn('not cached', peakX)
      const shape = new THREE.Shape()
      const points = pulsarCurves[i].getPoints(100, peakX)
      shape.moveTo(-SCALE / 2, 0)
      shape.setFromPoints(points)
      shape.lineTo(SCALE / 2, -20)
      shape.lineTo(-SCALE / 2, -20)
      shape.lineTo(-SCALE / 2, 0)
      const shapeGeometry = new THREE.ShapeGeometry(shape)
      ;(curve.children[0] as THREE.Mesh<THREE.ShapeGeometry>).geometry.dispose()
      ;(curve.children[0] as THREE.Mesh<THREE.ShapeGeometry>).geometry =
        shapeGeometry

      const lineGeometry = new LineGeometry()
      lineGeometry.setPositions(
        points.reduce<number[]>((acc, point) => {
          acc.push(point.x, point.y, 0)
          return acc
        }, [])
      )
      ;(curve.children[1] as Line2).geometry.dispose()
      ;(curve.children[1] as Line2).geometry = lineGeometry
      cache[peakX] = cache[peakX] || {}
      cache[peakX][i] = [
        shapeGeometry.clone(),
        lineGeometry.clone() as LineGeometry,
      ]
    }
  })
}

const onPointerMove = (event: PointerEvent) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  // pointer.z = (camera.near + camera.far) / (camera.near - camera.far)
  // pointer.unproject(camera)
  // const offset = boxWidth / 8
  // if (pointer.x < boxWidth / 2 - offset && pointer.x > -boxWidth / 2 + offset) {
  //   const x = Math.floor(-pointer.x) - (Math.floor(-pointer.x) % MOVE_STEP)
  //   updateCurves(x)
  // }
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

  // const centralLineGeometry = new THREE.BufferGeometry().setFromPoints([
  //   new Vector3(100, -1000, 0),
  //   new Vector3(100, 1000, 0),
  // ])
  // const centralLineMaterial = new THREE.LineBasicMaterial({
  //   color: 0x3f3f3f,
  //   opacity: 0.5,
  // })
  // const centralLine = new THREE.Line(centralLineGeometry, centralLineMaterial)
  // scene.add(centralLine)
  // setting curves

  curves = pulsarCurves.map((curve, i) => {
    const shape = new THREE.Shape()
    const points = curve.getPoints(POINTS_PER_CURVE)
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
      points.reduce<number[]>((acc, point) => {
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
    object.position.setZ(i * 2)

    return object
  })
  updateCurves()
  const curvesGroup = new THREE.Group()

  curves.forEach(curve => curvesGroup.add(curve))
  scene.add(curvesGroup)

  const boundingBox = new THREE.BoxHelper(curvesGroup, 0xffffff)
  // scene.add(boundingBox)

  boundingBox.geometry.computeBoundingBox()
  boxWidth =
    boundingBox.geometry.boundingBox!.max.x -
    boundingBox.geometry.boundingBox!.min.x

  cameraControls.fitToBox(curvesGroup, false, {
    paddingTop: window.innerHeight / 6,
    paddingBottom: window.innerHeight / 6 - 20,
  })

  cameraControls.dampingFactor = 0.15
  cameraControls.draggingDampingFactor = 0.15
	cameraControls.touches.one = CameraControls.ACTION.NONE
	cameraControls.touches.two = CameraControls.ACTION.TOUCH_ROTATE
  window.addEventListener('resize', updateSize)
  document.addEventListener('pointermove', throttle(onPointerMove, 1))
  document.addEventListener('keypress', e => {
    if (e.code === 'KeyR') {
      cameraControls.fitToBox(curvesGroup, true, {
        paddingTop: window.innerHeight / 6,
        paddingBottom: window.innerHeight / 6 - 20,
      })
    }
    throttle(onPointerMove, 1)
  })
  updateSize()
  console.time()
  fillCache()
  console.timeEnd()
}

const anim = () => {
  const delta = clock.getDelta()
  cameraControls.update(delta)

  raycaster.setFromCamera(pointer, camera)
  const objects = curves.reduce<THREE.Object3D[]>((acc, object) => {
    acc.push(...object.children)
    return acc
  }, [])
  const intersections = raycaster.intersectObjects(objects, false)
  const intersection = intersections.length > 0 ? intersections[0] : null
  if (intersection) {
    const x = -intersection.point.x

    gsap.to(tween, { duration: 2, ease: 'power2.out', x })
  }
  updateCurves()

  requestAnimationFrame(anim)
  renderer.render(scene, camera)
}

init()
anim()
