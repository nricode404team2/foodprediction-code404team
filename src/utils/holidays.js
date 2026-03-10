// Nager.Date — free public holiday API, no key required
// https://date.nager.at

// Major Indian festivals with approximate month-day ranges (MM-DD)
// These are fixed or near-fixed each year
const INDIAN_FESTIVALS = [
  { name: 'Makar Sankranti', monthDay: '01-14', type: 'festival', icon: '🪁' },
  { name: 'Republic Day', monthDay: '01-26', type: 'national', icon: '🇮🇳' },
  { name: 'Maha Shivratri', monthDay: '02-26', type: 'festival', icon: '🕉️' },
  { name: 'Holi', monthDay: '03-14', type: 'festival', icon: '🎨' },
  { name: 'Gudi Padwa', monthDay: '03-30', type: 'festival', icon: '🪔' },
  { name: 'Ram Navami', monthDay: '04-06', type: 'festival', icon: '🙏' },
  { name: 'Baisakhi', monthDay: '04-13', type: 'festival', icon: '🌾' },
  { name: 'Good Friday', monthDay: '04-18', type: 'national', icon: '✝️' },
  { name: 'Eid ul-Fitr', monthDay: '03-31', type: 'festival', icon: '🌙' },
  { name: 'Buddha Purnima', monthDay: '05-12', type: 'festival', icon: '☸️' },
  { name: 'Eid ul-Adha', monthDay: '06-07', type: 'festival', icon: '🌙' },
  { name: 'Independence Day', monthDay: '08-15', type: 'national', icon: '🇮🇳' },
  { name: 'Janmashtami', monthDay: '08-16', type: 'festival', icon: '🎶' },
  { name: 'Ganesh Chaturthi', monthDay: '08-27', type: 'festival', icon: '🐘' },
  { name: 'Onam', monthDay: '09-05', type: 'festival', icon: '🌸' },
  { name: 'Gandhi Jayanti', monthDay: '10-02', type: 'national', icon: '🕊️' },
  { name: 'Navratri', monthDay: '10-02', type: 'festival', icon: '💃' },
  { name: 'Dussehra', monthDay: '10-12', type: 'festival', icon: '🏹' },
  { name: 'Diwali', monthDay: '10-20', type: 'festival', icon: '🪔' },
  { name: 'Bhai Dooj', monthDay: '10-23', type: 'festival', icon: '👫' },
  { name: 'Guru Nanak Jayanti', monthDay: '11-15', type: 'festival', icon: '🙏' },
  { name: 'Christmas', monthDay: '12-25', type: 'national', icon: '🎄' },
  { name: 'New Year\'s Eve', monthDay: '12-31', type: 'festival', icon: '🎆' },
]

// Fetch public holidays from Nager.Date API
export async function fetchPublicHolidays(year, countryCode = 'IN') {
  try {
    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.map(h => ({
      date: h.date,
      name: h.localName || h.name,
      englishName: h.name,
      type: 'public',
      icon: '🏛️',
      source: 'official',
    }))
  } catch {
    return []
  }
}

// Get festivals near a date (within ±7 days)
function getNearbyFestivals(dateStr, year) {
  const target = new Date(dateStr)
  const results = []

  for (const f of INDIAN_FESTIVALS) {
    const festDate = new Date(`${year}-${f.monthDay}`)
    const diff = Math.abs(target - festDate) / (1000 * 60 * 60 * 24)
    if (diff <= 7) {
      results.push({
        date: `${year}-${f.monthDay}`,
        name: f.name,
        type: f.type,
        icon: f.icon,
        source: 'festival',
        daysAway: Math.round(target - festDate) / (1000 * 60 * 60 * 24),
      })
    }
  }
  return results
}

// Detect if date is a weekend
function isWeekend(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}

// Get country code from location name or default IN
export function guessCountryCode(locationName) {
  if (!locationName) return 'IN'
  const loc = locationName.toUpperCase()
  const map = {
    'IN': ['INDIA', ', IN'],
    'US': ['UNITED STATES', ', US'],
    'GB': ['UNITED KINGDOM', ', GB'],
    'AU': ['AUSTRALIA', ', AU'],
    'CA': ['CANADA', ', CA'],
    'DE': ['GERMANY', ', DE'],
    'FR': ['FRANCE', ', FR'],
    'SG': ['SINGAPORE', ', SG'],
    'AE': ['DUBAI', 'UAE', 'EMIRATES', ', AE'],
    'MY': ['MALAYSIA', ', MY'],
  }
  for (const [code, keywords] of Object.entries(map)) {
    if (keywords.some(k => loc.includes(k))) return code
  }
  return 'IN'
}

// Main function: detect all events for a date
export async function detectEventsForDate(dateStr, locationName = '') {
  const year = new Date(dateStr).getFullYear()
  const countryCode = guessCountryCode(locationName)
  const weekend = isWeekend(dateStr)

  const [publicHolidays, festivals] = await Promise.all([
    fetchPublicHolidays(year, countryCode),
    Promise.resolve(getNearbyFestivals(dateStr, year)),
  ])

  // Filter public holidays to exact date match
  const todayHolidays = publicHolidays.filter(h => h.date === dateStr)

  // Combine
  const allEvents = []

  if (weekend) {
    const d = new Date(dateStr + 'T12:00:00')
    allEvents.push({
      date: dateStr,
      name: d.getDay() === 6 ? 'Saturday (Weekend)' : 'Sunday (Weekend)',
      type: 'weekend',
      icon: '📅',
      source: 'auto',
      impactMultiplier: 0.72,
      impactLabel: '−28% demand',
    })
  }

  for (const h of todayHolidays) {
    allEvents.push({
      ...h,
      impactMultiplier: 0.60,
      impactLabel: '−40% demand',
    })
  }

  // Sort: past (already happened, daysAway > 0) first, today next, then upcoming (daysAway < 0) last
  const sortedFestivals = [...festivals].sort((a, b) => b.daysAway - a.daysAway)
  for (const f of sortedFestivals) {
    const label = f.daysAway === 0 ? 'Today' : f.daysAway < 0 ? `${Math.abs(f.daysAway)}d before` : `${f.daysAway}d after`
    allEvents.push({
      ...f,
      impactMultiplier: f.daysAway === 0 ? 1.25 : 1.10,
      impactLabel: f.daysAway === 0 ? '+25% demand' : `Near ${f.name} (+10%)`,
      proximityLabel: label,
    })
  }

  return { events: allEvents, countryCode, weekend }
}
