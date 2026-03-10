import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles, Calendar, Clock, Cloud, Star, Thermometer,
  MapPin, Search, LocateFixed, RefreshCw, X, Plus, Trash2,
  AlertCircle, CheckCircle, ChevronDown, ChevronUp, UtensilsCrossed,
} from 'lucide-react'
import { predictDemand } from '../utils/huggingface'
import { fetchWeatherByGeolocation, fetchWeatherByCoords, geocodeCity, reverseGeocode } from '../utils/weather'
import { detectEventsForDate } from '../utils/holidays'

const MENU_ITEMS = [
  'Rice & Dal', 'Chapati', 'Paneer Curry', 'Samosa',
  'Tea / Coffee', 'Idli/Dosa', 'Biryani', 'Noodles', 'Sandwich'
]

function impactColor(label) {
  if (!label) return '#64748b'
  if (label.startsWith('+')) return '#10b981'
  if (label.startsWith('−') || label.startsWith('-')) return '#ef4444'
  return '#f59e0b'
}

export default function PredictionForm({ setPredictionResults, setActivePage, loading, setLoading }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    mealTime: 'Lunch',
    weather: 'Sunny',
    temperature: '28',
    isHoliday: false,
    isEvent: false,
    eventName: '',
    historicalAvg: '300',
    selectedItems: ['Rice & Dal', 'Chapati', 'Paneer Curry', 'Samosa', 'Tea / Coffee'],
  })
  const [error, setError] = useState(null)

  // Weather
  const [weatherStatus, setWeatherStatus] = useState('idle')
  const [weatherMsg, setWeatherMsg] = useState('')
  const [locationName, setLocationName] = useState('')
  const [weatherIcon, setWeatherIcon] = useState('')
  const [extraWeather, setExtraWeather] = useState(null)
  const [cityInput, setCityInput] = useState('')
  const [citySuggestions, setCitySuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimeout = useRef(null)
  const suggestionsRef = useRef(null)

  // Holidays / events
  const [detectedEvents, setDetectedEvents] = useState([])   // auto-detected
  const [activeEvents, setActiveEvents] = useState([])        // opted-in event IDs
  const [customHolidays, setCustomHolidays] = useState([])    // user-added
  const [newHolidayName, setNewHolidayName] = useState('')
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showEventsPanel, setShowEventsPanel] = useState(true)

  // Custom food estimator
  const [foodItem, setFoodItem] = useState('')
  const [foodBaseCustomers, setFoodBaseCustomers] = useState('200')
  const [foodResult, setFoodResult] = useState(null)
  const [foodLoading, setFoodLoading] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleItem = (item) => {
    setForm(f => ({
      ...f,
      selectedItems: f.selectedItems.includes(item)
        ? f.selectedItems.filter(i => i !== item)
        : [...f.selectedItems, item]
    }))
  }

  // Auto-detect events when date or location changes
  const refreshEvents = useCallback(async (dateStr, locName) => {
    setEventsLoading(true)
    setDetectedEvents([])
    try {
      const { events } = await detectEventsForDate(dateStr, locName)
      setDetectedEvents(events)
      // Auto opt-in all detected events
      setActiveEvents(events.map((_, i) => i))
    } catch {
      setDetectedEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [])

  // When date changes, auto-refresh events
  const handleDateChange = (val) => {
    set('date', val)
    const d = new Date(val + 'T12:00:00')
    set('dayOfWeek', d.toLocaleDateString('en-US', { weekday: 'long' }))
    refreshEvents(val, locationName)
  }

  useEffect(() => {
    refreshEvents(form.date, locationName)
  }, []) // eslint-disable-line

  // Compute effective holiday/event multiplier from opted-in events
  const effectiveMultiplier = (() => {
    let m = 1.0
    for (const idx of activeEvents) {
      const ev = detectedEvents[idx]
      if (ev) m *= ev.impactMultiplier || 1.0
    }
    for (const ch of customHolidays) {
      if (ch.active) m *= 0.60
    }
    return m
  })()

  const hasHolidayEffect = effectiveMultiplier < 0.95
  const hasBoostEffect = effectiveMultiplier > 1.05

  // Sync isHoliday to form based on opted-in events
  useEffect(() => {
    const anyHoliday = activeEvents.some(idx => {
      const ev = detectedEvents[idx]
      return ev && (ev.type === 'public' || ev.type === 'weekend' || ev.type === 'national')
    }) || customHolidays.some(c => c.active)
    set('isHoliday', anyHoliday)
  }, [activeEvents, detectedEvents, customHolidays])

  // Toggle event opt-in
  const toggleEvent = (idx) => {
    setActiveEvents(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  // Add custom holiday
  const addCustomHoliday = () => {
    const name = newHolidayName.trim()
    if (!name) return
    setCustomHolidays(prev => [...prev, { name, active: true, id: Date.now() }])
    setNewHolidayName('')
  }

  const toggleCustomHoliday = (id) => {
    setCustomHolidays(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h))
  }

  const removeCustomHoliday = (id) => {
    setCustomHolidays(prev => prev.filter(h => h.id !== id))
  }

  // Weather
  const applyWeather = (data, locName) => {
    set('temperature', String(data.temperature))
    set('weather', data.weather)
    setWeatherIcon(data.icon)
    setLocationName(locName)
    setExtraWeather({ windspeed: data.windspeed, humidity: data.humidity })
    setWeatherStatus('success')
    refreshEvents(form.date, locName)
  }

  const handleAutoDetect = async () => {
    setWeatherStatus('loading')
    setWeatherMsg('Detecting your location...')
    setCityInput('')
    setShowSuggestions(false)
    try {
      const data = await fetchWeatherByGeolocation()
      const locName = await reverseGeocode(data.lat, data.lon)
      applyWeather(data, locName)
      setWeatherMsg('')
    } catch (e) {
      setWeatherStatus('error')
      setWeatherMsg(e.message || 'Could not detect location.')
    }
  }

  const handleCityInput = (val) => {
    setCityInput(val)
    setShowSuggestions(false)
    setCitySuggestions([])
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (val.trim().length < 2) return
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await geocodeCity(val.trim())
        setCitySuggestions(results)
        setShowSuggestions(true)
      } catch { setCitySuggestions([]) }
      finally { setSearchLoading(false) }
    }, 400)
  }

  const handleSelectCity = async (city) => {
    setCityInput(city.display)
    setShowSuggestions(false)
    setCitySuggestions([])
    setWeatherStatus('loading')
    setWeatherMsg(`Fetching weather for ${city.name}...`)
    try {
      const data = await fetchWeatherByCoords(city.lat, city.lon)
      applyWeather(data, city.display)
      setWeatherMsg('')
    } catch {
      setWeatherStatus('error')
      setWeatherMsg('Could not fetch weather for this city.')
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Custom food estimator
  const estimateFood = async () => {
    if (!foodItem.trim() || !foodBaseCustomers) return
    setFoodLoading(true)
    setFoodResult(null)
    try {
      // Apply same multipliers used in main prediction
      const base = Number(foodBaseCustomers)
      const dayM = {
        'Monday': 1.05, 'Tuesday': 1.08, 'Wednesday': 1.0,
        'Thursday': 1.12, 'Friday': 1.22, 'Saturday': 0.75, 'Sunday': 0.70,
      }[form.dayOfWeek] || 1.0
      const mealM = { 'Breakfast': 0.65, 'Lunch': 1.0, 'Dinner': 0.72, 'Snack': 0.35 }[form.mealTime] || 1.0
      const weatherM = { 'Sunny': 1.05, 'Cloudy': 1.0, 'Rainy': 0.85, 'Cold': 1.10, 'Hot': 0.90 }[form.weather] || 1.0
      const tempM = Number(form.temperature) < 15 ? 1.08 : Number(form.temperature) > 32 ? 0.92 : 1.0
      const eventM = effectiveMultiplier

      const totalCustomers = Math.round(base * dayM * mealM * weatherM * tempM * eventM)
      // Typical take-rate for an item: 25-45% of total customers
      const takeRate = 0.30 + Math.random() * 0.15
      const portions = Math.round(totalCustomers * takeRate)
      const buffer = Math.round(portions * 1.1)

      setFoodResult({
        item: foodItem.trim(),
        baseCustomers: base,
        expectedCustomers: totalCustomers,
        portions,
        buffer,
        takeRate: Math.round(takeRate * 100),
        multiplier: (dayM * mealM * weatherM * tempM * eventM).toFixed(2),
      })
    } finally {
      setFoodLoading(false)
    }
  }

  const handlePredict = async () => {
    setError(null)
    if (form.selectedItems.length === 0) { setError('Please select at least one menu item.'); return }
    setLoading(true)
    try {
      const result = await predictDemand({
        ...form,
        temperature: Number(form.temperature),
        historicalAvg: Number(form.historicalAvg),
        items: form.selectedItems,
      })
      setPredictionResults({ ...result, formParams: { ...form, locationName } })
      setActivePage('results')
    } catch {
      setError('Prediction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Shared style helpers ────────────────────────────────────────
  const cardStyle = { background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: '16px', padding: '20px' }

  return (
    <div>
      <h1 className="section-title">AI Demand Prediction</h1>
      <p className="section-subtitle">Configure parameters — holidays &amp; festivals auto-detected from your date</p>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Date & Time */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Calendar size={16} color="#818cf8" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Date & Time</span>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.date}
                  onChange={e => handleDateChange(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <select className="form-control" value={form.dayOfWeek} onChange={e => set('dayOfWeek', e.target.value)}>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Meal Time</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
                  <button key={m} onClick={() => set('mealTime', m)} style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.2s',
                    background: form.mealTime === m ? 'rgba(79,70,229,0.3)' : '#0f1117',
                    color: form.mealTime === m ? '#a5b4fc' : '#64748b',
                    outline: form.mealTime === m ? '1px solid #4f46e5' : '1px solid #2d3148',
                  }}>
                    <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weather */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={16} color="#38bdf8" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Weather Conditions</span>
              </div>
              {weatherStatus === 'success' && <span className="badge badge-green" style={{ fontSize: '11px' }}>✓ Live</span>}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={handleAutoDetect} disabled={weatherStatus === 'loading'} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                borderRadius: '8px', border: '1px solid #2d3148', background: '#0f1117',
                color: '#38bdf8', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2d3148'}
              >
                {weatherStatus === 'loading' && !cityInput
                  ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  : <LocateFixed size={13} />}
                Auto-detect
              </button>

              <div style={{ position: 'relative', flex: 1 }} ref={suggestionsRef}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  <input type="text" className="form-control" placeholder="Search city..."
                    value={cityInput} onChange={e => handleCityInput(e.target.value)}
                    onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                    style={{ paddingLeft: '32px', paddingRight: cityInput ? '30px' : '12px' }} />
                  {cityInput && (
                    <button onClick={() => { setCityInput(''); setCitySuggestions([]); setShowSuggestions(false) }}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
                {searchLoading && (
                  <div style={{ position: 'absolute', right: '36px', top: '50%', transform: 'translateY(-50%)' }}>
                    <span className="spinner" style={{ width: '13px', height: '13px', borderTopColor: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }} />
                  </div>
                )}
                {showSuggestions && citySuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: '10px', zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {citySuggestions.map((city, i) => (
                      <button key={i} onClick={() => handleSelectCity(city)} style={{
                        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                        padding: '10px 14px', textAlign: 'left', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        borderBottom: i < citySuggestions.length - 1 ? '1px solid #2d3148' : 'none',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <MapPin size={13} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{city.display}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {weatherStatus === 'loading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '9px 12px', marginBottom: '12px', fontSize: '13px', color: '#38bdf8' }}>
                <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }} />
                {weatherMsg}
              </div>
            )}
            {weatherStatus === 'error' && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '9px 12px', marginBottom: '12px', fontSize: '13px', color: '#f87171' }}>
                {weatherMsg}
              </div>
            )}
            {weatherStatus === 'success' && locationName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' }}>
                <MapPin size={12} color="#10b981" />
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>{locationName}</span>
                {extraWeather && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
                    💨 {extraWeather.windspeed} km/h · 💧 {extraWeather.humidity}%
                  </span>
                )}
              </div>
            )}
            {weatherStatus === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0f1117', border: '1px solid #2d3148', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>{weatherIcon}</span>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#e2e8f0' }}>{form.temperature}°C</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>{form.weather}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Open-Meteo</div>
                  <div style={{ fontSize: '11px', color: '#4f46e5', marginTop: '2px' }}>Free · No key</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Condition {weatherStatus === 'success' ? '(override)' : ''}</label>
                <select className="form-control" value={form.weather}
                  onChange={e => { set('weather', e.target.value); if (weatherStatus === 'success') setWeatherIcon('') }}>
                  {[{ val: 'Sunny', icon: '☀️' }, { val: 'Cloudy', icon: '☁️' }, { val: 'Rainy', icon: '🌧️' }, { val: 'Cold', icon: '❄️' }, { val: 'Hot', icon: '🥵' }]
                    .map(w => <option key={w.val} value={w.val}>{w.icon} {w.val}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Temp °C {weatherStatus === 'success' ? '(override)' : ''}</label>
                <input type="number" className="form-control" value={form.temperature}
                  onChange={e => set('temperature', e.target.value)} min="-10" max="55" />
              </div>
            </div>
            {weatherStatus === 'idle' && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                Click <strong style={{ color: '#38bdf8' }}>Auto-detect</strong> for live weather, or search a city.
              </div>
            )}
          </div>

          {/* Historical Baseline */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Thermometer size={16} color="#f59e0b" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Historical Baseline</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Avg Meals Served (this slot, normal day)</label>
              <input type="number" className="form-control" value={form.historicalAvg}
                onChange={e => set('historicalAvg', e.target.value)} min="50" max="2000" />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Normal weekday average — no holidays or events.
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── HOLIDAYS & EVENTS CARD ── */}
          <div style={cardStyle}>
            <button onClick={() => setShowEventsPanel(p => !p)} style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showEventsPanel ? '16px' : 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#fbbf24" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Holidays &amp; Festivals</span>
                {eventsLoading && <span className="spinner" style={{ width: '13px', height: '13px' }} />}
                {!eventsLoading && detectedEvents.length > 0 && (
                  <span className="badge badge-yellow" style={{ fontSize: '11px' }}>{detectedEvents.length} detected</span>
                )}
                {(hasHolidayEffect || hasBoostEffect) && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: hasHolidayEffect ? '#ef4444' : '#10b981' }}>
                    {hasHolidayEffect ? `×${effectiveMultiplier.toFixed(2)} demand` : `×${effectiveMultiplier.toFixed(2)} demand`}
                  </span>
                )}
              </div>
              {showEventsPanel ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
            </button>

            {showEventsPanel && (
              <>
                {/* Auto-detected events */}
                {eventsLoading && (
                  <div style={{ fontSize: '13px', color: '#64748b', padding: '8px 0' }}>Checking holidays for {form.date}...</div>
                )}

                {!eventsLoading && detectedEvents.length === 0 && (
                  <div style={{ fontSize: '13px', color: '#64748b', padding: '6px 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} color="#10b981" />
                    No public holidays or festivals detected for this date.
                  </div>
                )}

                {!eventsLoading && (() => {
                  // Split into: current (today / exact-date / past) vs upcoming (daysAway < 0)
                  const currentEvents = detectedEvents.filter(ev => !ev.proximityLabel || !ev.proximityLabel.includes('before'))
                  const upcomingEvents = detectedEvents.filter(ev => ev.proximityLabel && ev.proximityLabel.includes('before'))

                  const renderEventRow = (ev, i) => {
                    const isActive = activeEvents.includes(i)
                    return (
                      <label key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: isActive ? 'rgba(245,158,11,0.08)' : '#0f1117',
                        border: `1px solid ${isActive ? 'rgba(245,158,11,0.35)' : '#2d3148'}`,
                        borderRadius: '10px', padding: '10px 12px', cursor: 'pointer',
                        marginBottom: '8px', transition: 'all 0.2s',
                      }}>
                        <input type="checkbox" checked={isActive} onChange={() => toggleEvent(i)}
                          style={{ accentColor: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: '18px' }}>{ev.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{ev.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {ev.proximityLabel ? `${ev.proximityLabel} · ` : ''}{ev.date}
                            {ev.source === 'official' ? ' · Official holiday' : ev.source === 'festival' ? ' · Festival' : ''}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                          color: impactColor(ev.impactLabel),
                          background: `${impactColor(ev.impactLabel)}18`,
                          border: `1px solid ${impactColor(ev.impactLabel)}33`,
                          whiteSpace: 'nowrap',
                        }}>
                          {ev.impactLabel}
                        </span>
                      </label>
                    )
                  }

                  return (
                    <>
                      {currentEvents.map((ev, idx) => renderEventRow(ev, detectedEvents.indexOf(ev)))}
                      {upcomingEvents.length > 0 && (
                        <>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '10px 0 6px' }}>
                            📅 Upcoming Holidays
                          </div>
                          {upcomingEvents.map((ev) => renderEventRow(ev, detectedEvents.indexOf(ev)))}
                        </>
                      )}
                    </>
                  )
                })()}

                {/* Custom holidays */}
                {customHolidays.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Holidays</div>
                    {customHolidays.map(h => (
                      <div key={h.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: h.active ? 'rgba(239,68,68,0.08)' : '#0f1117',
                        border: `1px solid ${h.active ? 'rgba(239,68,68,0.3)' : '#2d3148'}`,
                        borderRadius: '10px', padding: '9px 12px', marginBottom: '6px',
                      }}>
                        <input type="checkbox" checked={h.active} onChange={() => toggleCustomHoliday(h.id)}
                          style={{ accentColor: '#ef4444' }} />
                        <span style={{ fontSize: '15px' }}>🏖️</span>
                        <span style={{ fontSize: '13px', color: '#e2e8f0', flex: 1 }}>{h.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginRight: '4px' }}>−40%</span>
                        <button onClick={() => removeCustomHoliday(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add custom holiday input */}
                <div style={{ borderTop: '1px solid #2d3148', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                    + Add custom holiday / closure day
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="form-control" placeholder="e.g. Founder's Day, Annual Maintenance..."
                      value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomHoliday()}
                      style={{ flex: 1 }} />
                    <button onClick={addCustomHoliday} style={{
                      background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)',
                      borderRadius: '8px', padding: '0 12px', cursor: 'pointer', color: '#a5b4fc',
                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontFamily: 'inherit',
                    }}>
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                {/* Special event */}
                <div style={{ borderTop: '1px solid #2d3148', paddingTop: '12px', marginTop: '12px' }}>
                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    background: form.isEvent ? 'rgba(79,70,229,0.1)' : '#0f1117',
                    border: `1px solid ${form.isEvent ? '#4f46e5' : '#2d3148'}`,
                    borderRadius: '10px', padding: '12px', cursor: 'pointer',
                  }}>
                    <input type="checkbox" checked={form.isEvent} onChange={e => set('isEvent', e.target.checked)}
                      style={{ marginTop: '2px', accentColor: '#4f46e5' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>🎉 Special Event on Campus</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Sports day, cultural fest, exam week, etc. (+35% demand)</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 7px', borderRadius: '10px' }}>+35%</span>
                  </label>
                  {form.isEvent && (
                    <input type="text" className="form-control" placeholder="Event name (e.g. Annual Sports Day)..."
                      value={form.eventName} onChange={e => set('eventName', e.target.value)}
                      style={{ marginTop: '8px' }} />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Menu Items */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px' }}>🍽️</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Menu Items to Predict</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {MENU_ITEMS.map(item => (
                <button key={item} onClick={() => toggleItem(item)} style={{
                  padding: '7px 13px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s',
                  background: form.selectedItems.includes(item) ? 'rgba(79,70,229,0.25)' : '#0f1117',
                  color: form.selectedItems.includes(item) ? '#a5b4fc' : '#64748b',
                  outline: form.selectedItems.includes(item) ? '1px solid #4f46e5' : '1px solid #2d3148',
                }}>
                  {form.selectedItems.includes(item) ? '✓ ' : '+ '}{item}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
              {form.selectedItems.length} items selected
            </div>
          </div>

          {/* ── CUSTOM FOOD ESTIMATOR ── */}
          <div style={{ ...cardStyle, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <UtensilsCrossed size={16} color="#10b981" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Custom Food Estimator</span>
              <span className="badge badge-green" style={{ fontSize: '11px' }}>Quick check</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
              Enter any food item + your average customer count (normal day, no events) to estimate how many portions to prepare.
            </p>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Food Item</label>
                <input type="text" className="form-control" placeholder="e.g. Poha, Pav Bhaji..."
                  value={foodItem} onChange={e => setFoodItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && estimateFood()} />
              </div>
              <div className="form-group">
                <label className="form-label">Avg Customers (normal day)</label>
                <input type="number" className="form-control" placeholder="e.g. 200"
                  value={foodBaseCustomers} onChange={e => setFoodBaseCustomers(e.target.value)} min="10" max="2000" />
              </div>
            </div>
            <button onClick={estimateFood} disabled={!foodItem.trim() || foodLoading}
              style={{
                width: '100%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '8px', padding: '10px', cursor: 'pointer', color: '#10b981',
                fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s', marginBottom: foodResult ? '14px' : 0,
              }}>
              {foodLoading ? <><span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }} />Estimating...</>
                : <><Sparkles size={14} />Estimate Portions</>}
            </button>

            {foodResult && (
              <div style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginBottom: '10px' }}>
                  {foodResult.item} — Estimation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    ['Expected Visitors', foodResult.expectedCustomers, '#a5b4fc'],
                    ['Est. Take-rate', `~${foodResult.takeRate}%`, '#f59e0b'],
                    ['Portions Needed', foodResult.portions, '#10b981'],
                    ['With 10% Buffer', foodResult.buffer, '#34d399'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ background: '#1a1d2e', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                  All factors applied (day ×{(form.dayOfWeek === 'Friday' ? 1.22 : 1.0).toFixed(2)}, meal, weather, events). Multiplier: ×{foodResult.multiplier}
                </div>
              </div>
            )}
          </div>

          {/* Summary & Run */}
          <div style={{ ...cardStyle, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#a5b4fc', marginBottom: '12px' }}>Prediction Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
              {[
                ['Day', form.dayOfWeek],
                ['Meal', form.mealTime],
                ['Weather', `${weatherIcon} ${form.weather} ${form.temperature}°C`],
                ['Location', locationName || 'Manual'],
                ['Events Active', `${activeEvents.length + customHolidays.filter(c=>c.active).length} of ${detectedEvents.length + customHolidays.length}`],
                ['Demand Factor', `×${effectiveMultiplier.toFixed(2)}`],
                ['Base Avg', `${form.historicalAvg} meals`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', gap: '4px' }}>
                  <span style={{ color: '#64748b', flexShrink: 0 }}>{k}:</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 500, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{v}</span>
                </div>
              ))}
            </div>

            {(hasHolidayEffect || hasBoostEffect) && (
              <div style={{
                display: 'flex', gap: '8px', alignItems: 'flex-start',
                background: hasHolidayEffect ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${hasHolidayEffect ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                borderRadius: '8px', padding: '9px 12px', marginBottom: '12px',
              }}>
                <AlertCircle size={14} color={hasHolidayEffect ? '#ef4444' : '#10b981'} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '12px', color: hasHolidayEffect ? '#fca5a5' : '#6ee7b7' }}>
                  {hasHolidayEffect
                    ? `Holiday/weekend effect active — demand reduced to ×${effectiveMultiplier.toFixed(2)} of baseline.`
                    : `Event boost active — demand increased to ×${effectiveMultiplier.toFixed(2)} of baseline.`}
                </span>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#f87171', marginBottom: '12px' }}>
                {error}
              </div>
            )}
            <button className="btn-primary" onClick={handlePredict} disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <><span className="spinner" />Predicting with AI...</> : <><Sparkles size={16} />Run Prediction</>}
            </button>
            <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
              Holidays via Nager.Date · Weather via Open-Meteo · AI via HuggingFace
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
