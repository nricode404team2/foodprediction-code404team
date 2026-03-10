const KEY = 'canteen_profile'

export function saveProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify({ ...profile, savedAt: Date.now() }))
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearProfile() {
  localStorage.removeItem(KEY)
}

// Generate a 7-day demand forecast from a profile using the algorithmic model
export function generateWeekForecast(profile) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayMultipliers = {
    'Mon': 1.05, 'Tue': 1.08, 'Wed': 1.0,
    'Thu': 1.12, 'Fri': 1.22, 'Sat': 0.75, 'Sun': 0.70,
  }
  const mealMultipliers = { breakfast: 0.65, lunch: 1.0, dinner: 0.72, snack: 0.35 }
  const slots = profile.mealSlots || ['lunch']

  return days.map(day => {
    const isWeekend = day === 'Sat' || day === 'Sun'
    const row = { day }
    let dayTotal = 0
    for (const slot of slots) {
      // If per-slot customer count was provided, use it directly (no meal multiplier — already slot-specific).
      // If only a daily total was provided, distribute using meal multipliers.
      const perSlotBase = Number(profile.avgCustomers?.[slot])
      const base = perSlotBase > 0
        ? perSlotBase
        : Number(profile.avgCustomersTotal || 300) * (mealMultipliers[slot] || 1.0)
      const val = Math.round(base * dayMultipliers[day])
      row[slot] = val
      dayTotal += val
    }
    row.total = dayTotal
    row.isWeekend = isWeekend
    return row
  })
}

// Item demand shares (fraction of total meals per item)
const ITEM_SHARES = {
  'Rice & Dal': 0.28, 'Chapati': 0.22, 'Paneer Curry': 0.16,
  'Samosa': 0.12, 'Tea / Coffee': 0.35, 'Idli/Dosa': 0.20,
  'Biryani': 0.18, 'Noodles': 0.14, 'Sandwich': 0.15,
  'Poha': 0.18, 'Pav Bhaji': 0.20, 'Vada Pav': 0.22,
  'Dal Tadka': 0.24, 'Pulao': 0.19, 'Chole Bhature': 0.21,
}

export function generateItemForecast(profile, dayForecast) {
  const avgTotalPerDay = dayForecast
    .filter(d => !d.isWeekend)
    .reduce((s, d) => s + d.total, 0) / 5

  return (profile.menuItems || []).map(name => {
    const share = ITEM_SHARES[name] || 0.15
    const demand = Math.round(avgTotalPerDay * share)
    const maxDemand = Math.round(
      dayForecast.find(d => d.day === 'Fri')?.total * share || demand * 1.22
    )
    return { name, demand, pct: Math.round((demand / (avgTotalPerDay * 0.35)) * 100) }
  }).sort((a, b) => b.demand - a.demand)
}

// Today's prediction given profile
export function generateTodayPrediction(profile) {
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' })
  const dayMultipliers = {
    'Mon': 1.05, 'Tue': 1.08, 'Wed': 1.0,
    'Thu': 1.12, 'Fri': 1.22, 'Sat': 0.75, 'Sun': 0.70,
  }
  const mealMultipliers = { breakfast: 0.65, lunch: 1.0, dinner: 0.72, snack: 0.35 }
  const slots = profile.mealSlots || ['lunch']

  let total = 0
  for (const slot of slots) {
    const perSlotBase = Number(profile.avgCustomers?.[slot])
    const base = perSlotBase > 0
      ? perSlotBase
      : Number(profile.avgCustomersTotal || 300) * (mealMultipliers[slot] || 1.0)
    total += Math.round(base * (dayMultipliers[dayName] || 1.0))
  }

  const isWeekend = today.getDay() === 0 || today.getDay() === 6
  const isFriday = today.getDay() === 5

  return {
    total,
    isWeekend,
    isFriday,
    dayName: today.toLocaleDateString('en-US', { weekday: 'long' }),
    date: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    multiplier: dayMultipliers[dayName] || 1.0,
  }
}
