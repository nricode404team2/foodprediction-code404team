import { useMemo } from 'react'
import { TrendingUp, Users, ShoppingBag, AlertTriangle, ArrowRight, Sparkles, Settings, RotateCcw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell,
} from 'recharts'
import { generateWeekForecast, generateItemForecast, generateTodayPrediction } from '../utils/storage'

const CANTEEN_TYPE_LABELS = {
  college: '🎓 College', office: '🏢 Office', hospital: '🏥 Hospital',
  school: '📚 School', factory: '🏭 Factory', public: '🏪 Public',
}

const SLOT_COLORS = { breakfast: '#4f46e5', lunch: '#7c3aed', dinner: '#a78bfa', snack: '#38bdf8' }
const ITEM_COLORS = ['#4f46e5', '#7c3aed', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#fb923c', '#e879f9']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: '10px', padding: '12px' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '13px', fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard({ setActivePage, profile, onReset }) {
  const weekForecast = generateWeekForecast(profile)
  const itemForecast = generateItemForecast(profile, weekForecast)
  const today = generateTodayPrediction(profile)

  const totalWeekMeals = weekForecast.reduce((s, d) => s + d.total, 0)
  const avgDailyMeals = Math.round(totalWeekMeals / 7)
  const peakDay = weekForecast.reduce((a, b) => a.total > b.total ? a : b)
  const lowestDay = weekForecast.reduce((a, b) => a.total < b.total ? a : b)

  const slotKeys = profile.mealSlots || ['lunch']

  // 8-week projected trend — stable seed based on totalWeekMeals so it doesn't flicker on re-render
  const trendData = useMemo(() => {
    const seed = totalWeekMeals
    return Array.from({ length: 8 }, (_, i) => {
      // Deterministic pseudo-variance per week using sine wave + slight growth
      const variance = 0.94 + Math.sin(seed * 0.001 + i * 1.3) * 0.06 + i * 0.004
      return { week: `W${i + 1}`, demand: Math.round(totalWeekMeals * variance) }
    })
  }, [totalWeekMeals])

  // Waste rate estimate: higher on weekends/holidays
  const wasteRate = ((profile.operatingDays?.includes('sat') || profile.operatingDays?.includes('sun'))
    ? 4.2 : 3.1).toFixed(1)

  const maxItemDemand = itemForecast[0]?.demand || 1

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0' }}>{profile.canteenName}</h1>
            <span style={{ fontSize: '12px', color: '#64748b', background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: '6px', padding: '2px 8px' }}>
              {CANTEEN_TYPE_LABELS[profile.canteenType] || profile.canteenType}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {profile.location ? `📍 ${profile.location} · ` : ''}
            AI-powered forecast · {profile.mealSlots?.length} slot{profile.mealSlots?.length !== 1 ? 's' : ''} · {profile.menuItems?.length} menu items
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={onReset}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <RotateCcw size={13} /> Edit Profile
          </button>
          <button className="btn-primary" onClick={() => setActivePage('predict')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> Run Prediction
          </button>
        </div>
      </div>

      {/* Today's highlight banner */}
      <div style={{
        background: today.isWeekend
          ? 'rgba(100,116,139,0.1)' : today.isFriday
          ? 'rgba(245,158,11,0.08)' : 'rgba(79,70,229,0.08)',
        border: `1px solid ${today.isWeekend ? '#2d3148' : today.isFriday ? 'rgba(245,158,11,0.3)' : 'rgba(79,70,229,0.25)'}`,
        borderRadius: '14px', padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '32px' }}>
            {today.isWeekend ? '📅' : today.isFriday ? '🔥' : '☀️'}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>
              Today · {today.dayName}, {today.date}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
              {today.isWeekend
                ? 'Weekend — reduced footfall expected'
                : today.isFriday
                ? 'Friday peak — highest demand day of the week'
                : 'Regular weekday — normal demand expected'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Today's predicted total</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: today.isFriday ? '#f59e0b' : today.isWeekend ? '#64748b' : '#a5b4fc' }}>
            {today.total.toLocaleString()} meals
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {[
          {
            icon: <Users size={20} color="#818cf8" />, bg: 'rgba(79,70,229,0.15)',
            value: today.total.toLocaleString(), label: "Today's Forecast",
            trend: today.isWeekend ? 'Weekend — lower' : today.isFriday ? '🔥 Peak day!' : 'Normal weekday',
            trendColor: today.isFriday ? '#f59e0b' : today.isWeekend ? '#64748b' : '#10b981',
          },
          {
            icon: <ShoppingBag size={20} color="#34d399" />, bg: 'rgba(16,185,129,0.15)',
            value: avgDailyMeals.toLocaleString(), label: 'Avg Daily Meals',
            trend: `${totalWeekMeals.toLocaleString()} this week`, trendColor: '#10b981',
          },
          {
            icon: <TrendingUp size={20} color="#fbbf24" />, bg: 'rgba(245,158,11,0.15)',
            value: peakDay.day, label: 'Peak Day',
            trend: `${peakDay.total} meals predicted`, trendColor: '#f59e0b',
          },
          {
            icon: <AlertTriangle size={20} color="#f87171" />, bg: 'rgba(239,68,68,0.15)',
            value: `${wasteRate}%`, label: 'Est. Waste Rate',
            trend: 'With AI forecasting', trendColor: '#10b981',
          },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-trend" style={{ color: s.trendColor }}>{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Weekly forecast chart */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>7-Day Demand Forecast</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Based on your {profile.avgCustomersTotal} avg customers/day baseline</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekForecast} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              {slotKeys.length > 1
                ? (
                  <>
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    {slotKeys.map((slot, i) => (
                      <Bar key={slot} dataKey={slot} name={slot.charAt(0).toUpperCase() + slot.slice(1)}
                        fill={SLOT_COLORS[slot] || ITEM_COLORS[i]} radius={[4, 4, 0, 0]} />
                    ))}
                  </>
                ) : (
                  <Bar dataKey="total" name="Meals" radius={[4, 4, 0, 0]}>
                    {weekForecast.map((d, i) => (
                      <Cell key={i} fill={d.isWeekend ? '#2d3148' : d.day === peakDay.day ? '#f59e0b' : '#4f46e5'} />
                    ))}
                  </Bar>
                )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 8-week trend */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>8-Week Projected Trend</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Weekly total meals estimate</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="demand" name="Weekly Total"
                stroke="#4f46e5" strokeWidth={2} fill="url(#demandGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        {/* Top menu items */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>Your Menu — Daily Demand Forecast</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Estimated portions per normal day</div>
          </div>
          {itemForecast.slice(0, 6).map((item, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: ITEM_COLORS[i % ITEM_COLORS.length], display: 'inline-block' }} />
                  {item.name}
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>~{item.demand} portions</span>
              </div>
              <div style={{ background: '#0f1117', borderRadius: '4px', height: '6px' }}>
                <div style={{
                  width: `${Math.round((item.demand / (maxItemDemand * 1.1)) * 100)}%`,
                  height: '100%', borderRadius: '4px',
                  background: `linear-gradient(90deg, ${ITEM_COLORS[i % ITEM_COLORS.length]}, ${ITEM_COLORS[(i + 1) % ITEM_COLORS.length]})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
          {itemForecast.length > 6 && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              +{itemForecast.length - 6} more items — run a prediction to see all
            </div>
          )}
        </div>

        {/* Quick Actions + Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Insights */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>
              📊 This Week's Insights
            </div>
            {[
              {
                icon: '📈',
                text: `${peakDay.day}day is your peak — prepare ${peakDay.total} meals (${Math.round((peakDay.total / avgDailyMeals - 1) * 100)}% above average)`,
                color: '#f59e0b',
              },
              {
                icon: '📉',
                text: `${lowestDay.day}day has lowest demand at ${lowestDay.total} meals — reduce prep by ${Math.round((1 - lowestDay.total / avgDailyMeals) * 100)}%`,
                color: '#64748b',
              },
              {
                icon: '🍽️',
                text: `Top item: ${itemForecast[0]?.name || '—'} needs ~${itemForecast[0]?.demand || 0} portions/day`,
                color: '#10b981',
              },
              ...(today.isFriday ? [{ icon: '🔥', text: 'Today is Friday — stock up 22% more than usual', color: '#f59e0b' }] : []),
              ...(today.isWeekend ? [{ icon: '⚠️', text: 'Weekend today — reduce preparation by ~28%', color: '#ef4444' }] : []),
            ].slice(0, 4).map((ins, i) => (
              <div key={i} style={{
                display: 'flex', gap: '8px', padding: '9px 10px', borderRadius: '8px',
                background: '#0f1117', border: '1px solid #2d3148', marginBottom: '6px',
                borderLeft: `3px solid ${ins.color}`,
              }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{ins.icon}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{ins.text}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>Quick Actions</div>
            {[
              { title: 'Predict for a Specific Day', desc: 'Run full AI model with all factors', page: 'predict', color: '#4f46e5' },
              { title: 'View Last Results', desc: 'Charts and item-wise breakdown', page: 'results', color: '#7c3aed' },
              { title: 'Learn the Algorithm', desc: 'How factors influence predictions', page: 'algorithm', color: '#0ea5e9' },
            ].map((action, i) => (
              <button key={i} onClick={() => setActivePage(action.page)}
                style={{
                  width: '100%', background: '#0f1117', border: '1px solid #2d3148',
                  borderRadius: '10px', padding: '12px 14px', marginBottom: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = action.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2d3148'}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '1px' }}>{action.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{action.desc}</div>
                </div>
                <ArrowRight size={14} color="#64748b" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
