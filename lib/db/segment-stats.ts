import { athletes } from './athletes'
import type { Athlete } from '../types/athlete'

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

export function formatStatsForSubPool(pool: Athlete[]): string {
  if (pool.length === 0) return 'Empty pool — no athletes match this segment.'

  const engagementScores = pool.map(a => a.engagement.score).sort((a, b) => a - b)
  const ages = pool.map(a => a.age).sort((a, b) => a - b)
  const editions = pool.map(a => a.totalEditionsRaced).sort((a, b) => a - b)

  const natCount: Record<string, number> = {}
  for (const a of pool) natCount[a.nationality] = (natCount[a.nationality] ?? 0) + 1
  const natDist = Object.entries(natCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([code, n]) => `${code} ${Math.round(n / pool.length * 100)}%`).join(', ')

  const cityCount: Record<string, number> = {}
  for (const a of pool) cityCount[a.city] = (cityCount[a.city] ?? 0) + 1
  const topCities = Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([city, n]) => `${city} ${Math.round(n / pool.length * 100)}%`).join(', ')

  const returningPct = Math.round(pool.filter(a => a.isReturningAthlete).length / pool.length * 100)
  const femalePct = Math.round(pool.filter(a => a.gender === 'F').length / pool.length * 100)
  const marathonPct = Math.round(pool.filter(a => a.distance === 'Marathon 42K').length / pool.length * 100)
  const insurancePct = Math.round(pool.filter(a => a.upsellsPurchased?.includes('cancellation_insurance')).length / pool.length * 100)
  const editionsDist = {
    zero: Math.round(pool.filter(a => a.totalEditionsRaced === 0).length / pool.length * 100),
    one: Math.round(pool.filter(a => a.totalEditionsRaced === 1).length / pool.length * 100),
    twoPlus: Math.round(pool.filter(a => a.totalEditionsRaced >= 2).length / pool.length * 100),
  }

  return `Sub-pool statistics (${pool.length} athletes in this segment):
- Engagement: p25=${percentile(engagementScores, 25)}, median=${percentile(engagementScores, 50)}, p75=${percentile(engagementScores, 75)}
- Age: p25=${percentile(ages, 25)}, median=${percentile(ages, 50)}, p75=${percentile(ages, 75)}
- Editions raced: 0 editions=${editionsDist.zero}%, 1 edition=${editionsDist.one}%, 2+=${editionsDist.twoPlus}%
- Returning athletes: ${returningPct}%
- Gender: ${femalePct}% female, ${100 - femalePct}% male
- Top nationalities: ${natDist}
- Top cities: ${topCities}
- Distance: ${marathonPct}% Marathon 42K, ${100 - marathonPct}% Half Marathon 21K
- Cancellation insurance: ${insurancePct}%
- Engagement median (editions): p50=${percentile(editions, 50)}`
}

export function computeDbStats() {
  const engagementScores = athletes.map(a => a.engagement.score).sort((a, b) => a - b)
  const ages = athletes.map(a => a.age).sort((a, b) => a - b)
  const editions = athletes.map(a => a.totalEditionsRaced).sort((a, b) => a - b)

  const nationalityCount: Record<string, number> = {}
  for (const a of athletes) {
    nationalityCount[a.nationality] = (nationalityCount[a.nationality] ?? 0) + 1
  }
  const nationalityDist = Object.entries(nationalityCount)
    .sort((a, b) => b[1] - a[1])
    .map(([code, n]) => `${code} ${Math.round(n / athletes.length * 100)}%`)
    .join(', ')

  const returningPct = Math.round(athletes.filter(a => a.isReturningAthlete).length / athletes.length * 100)
  const femalePct = Math.round(athletes.filter(a => a.gender === 'F').length / athletes.length * 100)
  const marathonPct = Math.round(athletes.filter(a => a.distance === 'Marathon 42K').length / athletes.length * 100)
  const halfMarathonPct = 100 - marathonPct

  const editionsDist = {
    zero: Math.round(athletes.filter(a => a.totalEditionsRaced === 0).length / athletes.length * 100),
    one: Math.round(athletes.filter(a => a.totalEditionsRaced === 1).length / athletes.length * 100),
    twoThree: Math.round(athletes.filter(a => a.totalEditionsRaced >= 2 && a.totalEditionsRaced <= 3).length / athletes.length * 100),
    fourPlus: Math.round(athletes.filter(a => a.totalEditionsRaced >= 4).length / athletes.length * 100),
  }

  return {
    total: athletes.length,
    engagement: {
      p25: percentile(engagementScores, 25),
      p50: percentile(engagementScores, 50),
      p75: percentile(engagementScores, 75),
      p90: percentile(engagementScores, 90),
    },
    age: {
      p25: percentile(ages, 25),
      p50: percentile(ages, 50),
      p75: percentile(ages, 75),
    },
    editionsRaced: {
      p50: percentile(editions, 50),
      p75: percentile(editions, 75),
      dist: editionsDist,
    },
    returningPct,
    femalePct,
    nationalityDist,
    marathonPct,
    halfMarathonPct,
  }
}

export function formatStatsForPrompt(): string {
  const s = computeDbStats()
  return `Statistiques de la base athletes (${s.total} athletes, représentatifs d'un événement réel à 20 000 candidats) :
- Engagement score : p25=${s.engagement.p25}, médiane=${s.engagement.p50}, p75=${s.engagement.p75}, p90=${s.engagement.p90}
- Âge : p25=${s.age.p25} ans, médiane=${s.age.p50} ans, p75=${s.age.p75} ans
- Éditions courues : 0 édition ${s.editionsRaced.dist.zero}%, 1 édition ${s.editionsRaced.dist.one}%, 2-3 éditions ${s.editionsRaced.dist.twoThree}%, 4+ éditions ${s.editionsRaced.dist.fourPlus}%
- Athletes retournants (déjà participé) : ${s.returningPct}%
- Genre : ${s.femalePct}% femmes, ${100 - s.femalePct}% hommes
- Nationalités : ${s.nationalityDist}
- Distance : ${s.marathonPct}% Marathon 42K (taux de rétention naturel ~30%), ${s.halfMarathonPct}% Half Marathon 21K (taux de rétention naturel ~50%)`
}
