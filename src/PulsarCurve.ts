import { random, range } from 'lodash'
import { Vector2, Curve } from 'three'
import { normalPDF, randomNormalized } from './math'

/**
 * Returns a vector for point t of the curve where t is between 0 and 1
 * getPoint(t: number, optionalTarget?: T): T;
 */
export class PulsarCurve extends Curve<Vector2> {
  v0: Vector2
  v1: Vector2
  scale: number
  center: number = 0
  noiseParams: [number, number][] = []
  peaksParams: [number, number][] = []
  length: number

  // peaksCount: number
  // peakMusSeeds: number[]
  // peakSigmas: number[]
  // wavePeakMus: number[]

  constructor(v0: Vector2, v1: Vector2, scale: number) {
    super()
    this.v0 = v0
    this.v1 = v1
    this.scale = scale

    this.length = Math.abs(v0.x - v1.x)

    const modesCount = this.scale / 1.5
    this.noiseParams = range(modesCount).map((_, i) => [
      random(v0.x, v1.x),
      randomNormalized(1.1, 1),
    ])

    const peaksCount = random(10, 20, false)

    this.peaksParams = range(peaksCount).map(() => [
      random(-this.scale / 6, this.scale / 6),
      random(2, 3),
    ])
  }

  getPoint(t: number, optionalTarget: Vector2 = new Vector2(0, 0)) {
    const x = this.length * t + this.v0.x
    // const peakY = range(this.peaksCount).reduce(
    //   (acc, _, i) =>
    //     acc - normalPDF(x, this.wavePeakMus[i], this.peakSigmas[i]),
    //   0
    // )
    // const modeY = range(this.modesCount).reduce(
    //   (acc, _, i) => acc - normalPDF(x, this.mus[i], this.sigmas[i])
    // )
    const y =
      this.noiseParams.reduce((acc, args) => acc + normalPDF(x, ...args), 0) +
      this.peaksParams.reduce(
        (acc, args) =>
          acc + (this.scale * normalPDF(x + optionalTarget.x, ...args)) / 4,
        0
      ) +
      this.v0.y

    return new Vector2(x, y)
  }
  getPoints(divisions: number = 5, peak: number = 0) {
    const points = []

    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPoint(d / divisions, new Vector2(peak, 0)))
    }

    return points
  }
}
