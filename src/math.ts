import { mean, range } from 'lodash'
import random from 'lodash/random'

export const randomNormalized = (mu: number, sigma: number) => {
  const norm = mean(range(6).map(() => random(-1.0, 1.0, true)))
  return mu + sigma * norm
}

/**
 * @param mu - вершина нормали
 * @param sigma - кучность
 */
export const normalPDF = (x: number, mu: number, sigma: number): number => {
  var sigma2 = Math.pow(sigma, 2)
  var numerator = Math.exp(-Math.pow(x - mu, 2) / (2 * sigma2))
  var denominator = Math.sqrt(2 * Math.PI * sigma2)
  return numerator / denominator
}
