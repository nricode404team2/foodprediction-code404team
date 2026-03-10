// Open-Meteo — completely free, no API key required

const WMO_CODE_MAP = {
  0: { label: 'Sunny', icon: '☀️' },
  1: { label: 'Sunny', icon: '🌤️' },
  2: { label: 'Cloudy', icon: '⛅' },
  3: { label: 'Cloudy', icon: '☁️' },
  45: { label: 'Cloudy', icon: '🌫️' },
  48: { label: 'Cloudy', icon: '🌫️' },
  51: { label: 'Rainy', icon: '🌦️' },
  53: { label: 'Rainy', icon: '🌦️' },
  55: { label: 'Rainy', icon: '🌧️' },
  61: { label: 'Rainy', icon: '🌧️' },
  63: { label: 'Rainy', icon: '🌧️' },
  65: { label: 'Rainy', icon: '🌧️' },
  71: { label: 'Cold', icon: '🌨️' },
  73: { label: 'Cold', icon: '❄️' },
  75: { label: 'Cold', icon: '❄️' },
  80: { label: 'Rainy', icon: '🌦️' },
  81: { label: 'Rainy', icon: '🌧️' },
  82: { label: 'Rainy', icon: '⛈️' },
  95: { label: 'Rainy', icon: '⛈️' },
  96: { label: 'Rainy', icon: '⛈️' },
  99: { label: 'Rainy', icon: '⛈️' },
}

function wmoToCondition(code, tempC) {
  const mapped = WMO_CODE_MAP[code] || { label: 'Sunny', icon: '🌤️' }
  // Override with temp-based if not rain/snow
  if (!['Rainy', 'Cold'].includes(mapped.label)) {
    if (tempC <= 14) return { label: 'Cold', icon: '🥶' }
    if (tempC >= 35) return { label: 'Hot', icon: '🥵' }
  }
  return mapped
}

// Fetch weather by lat/lon using Open-Meteo
export async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather fetch failed')
  const data = await res.json()
  const temp = Math.round(data.current.temperature_2m)
  const code = data.current.weathercode
  const cond = wmoToCondition(code, temp)
  return {
    temperature: temp,
    weather: cond.label,
    icon: cond.icon,
    windspeed: Math.round(data.current.windspeed_10m),
    humidity: data.current.relative_humidity_2m,
    wmoCode: code,
  }
}

// Geocoding: city name → lat/lon + display name (Open-Meteo geocoding API)
export async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  if (!data.results || data.results.length === 0) throw new Error('City not found')
  return data.results.map(r => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1 || '',
    lat: r.latitude,
    lon: r.longitude,
    display: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}, ${r.country}`,
  }))
}

// Browser geolocation → weather
export function fetchWeatherByGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
          // Reverse geocode for display name using open-meteo nominatim style
          resolve({ ...data, lat: pos.coords.latitude, lon: pos.coords.longitude })
        } catch (e) {
          reject(e)
        }
      },
      (err) => reject(new Error('Location permission denied. Please search manually.')),
      { timeout: 8000 }
    )
  })
}

// Reverse geocode lat/lon → city name (using open-meteo's nominatim)
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Your location'
    const country = data.address?.country_code?.toUpperCase() || ''
    return `${city}${country ? ', ' + country : ''}`
  } catch {
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`
  }
}
