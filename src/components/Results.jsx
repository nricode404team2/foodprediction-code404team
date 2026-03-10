import { ArrowLeft, TrendingUp, TrendingDown, Minus, Download, RotateCcw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: '10px', padding: '12px' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#a5b4fc', fontSize: '13px', fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const ITEM_COLORS = ['#4f46e5', '#7c3aed', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#fb923c', '#e879f9']

export default function Results({ results, setActivePage }) {
  if (!results) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h2 style={{ fontSize: '20px', color: '#e2e8f0', marginBottom: '8px' }}>No Results Yet</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Run a prediction first to see results here.</p>
        <button className="btn-primary" onClick={() => setActivePage('predict')}>
          Go to Prediction
        </button>
      </div>
    )
  }

  const { totalMeals, confidence, demandLevel, items, insights, multiplierBreakdown, formParams } = results

  const demandColor = {
    'Low': '#64748b', 'Medium': '#10b981', 'High': '#f59e0b', 'Very High': '#ef4444'
  }[demandLevel] || '#a5b4fc'

  const factorData = multiplierBreakdown ? [
    { factor: 'Day of Week', effect: multiplierBreakdown.dayEffect },
    { factor: 'Meal Time', effect: multiplierBreakdown.mealEffect },
    { factor: 'Weather', effect: multiplierBreakdown.weatherEffect },
    { factor: 'Holiday', effect: multiplierBreakdown.holidayEffect },
    { factor: 'Event', effect: multiplierBreakdown.eventEffect },
  ] : []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => setActivePage('predict')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="section-title" style={{ marginBottom: 0 }}>Prediction Results</h1>
            {formParams && (
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {formParams.dayOfWeek} · {formParams.mealTime} · {formParams.weather} {formParams.temperature}°C
                {formParams.isEvent ? ` · 🎉 ${formParams.eventName || 'Special Event'}` : ''}
                {formParams.isHoliday ? ' · 🏖️ Holiday' : ''}
              </p>
            )}
          </div>
        </div>
        <button className="btn-secondary" onClick={() => setActivePage('predict')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RotateCcw size={14} /> New Prediction
        </button>
      </div>

      {/* Top stats */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.3)' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>PREDICTED TOTAL MEALS</div>
          <div style={{ fontSize: '42px', fontWeight: 800, color: '#a5b4fc', lineHeight: 1 }}>{totalMeals}</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>portions to prepare</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>AI CONFIDENCE</div>
          <div style={{ fontSize: '42px', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{confidence}%</div>
          <div style={{ height: '6px', background: '#0f1117', borderRadius: '4px', marginTop: '8px' }}>
            <div style={{ width: `${confidence}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>DEMAND LEVEL</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: demandColor, lineHeight: 1.2 }}>{demandLevel}</div>
          <div className={`badge badge-${demandLevel === 'Very High' ? 'red' : demandLevel === 'High' ? 'yellow' : demandLevel === 'Medium' ? 'green' : 'blue'}`}
            style={{ marginTop: '4px' }}>
            {demandLevel === 'Very High' ? '🔴' : demandLevel === 'High' ? '🟡' : demandLevel === 'Medium' ? '🟢' : '🔵'} {demandLevel} demand
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Item-wise predictions */}
        <div className="card">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
            Item-wise Demand Forecast
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={items} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="portions" name="Portions" radius={[0,4,4,0]}>
                {items.map((_, i) => <Cell key={i} fill={ITEM_COLORS[i % ITEM_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Factor impact */}
        {factorData.length > 0 && (
          <div className="card">
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
              Factor Impact (% vs baseline)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={factorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis dataKey="factor" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} />
                <Tooltip content={<CustomTooltip />} formatter={(v) => [`${v > 0 ? '+' : ''}${v}%`]} />
                <Bar dataKey="effect" name="Effect" radius={[4,4,0,0]}>
                  {factorData.map((d, i) => (
                    <Cell key={i} fill={d.effect > 0 ? '#4f46e5' : d.effect < 0 ? '#ef4444' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Surplus food guidance — shown when demand is Low or any item is below average */}
      {(() => {
        const surplusItems = items.filter(item => item.change < -5)
        if (surplusItems.length === 0) return null

        const FOOD_GUIDANCE = {
          'Rice & Dal':       { storage: 'Refrigerate in airtight container, consume within 24h', repurpose: 'Use as base for khichdi or add tadka for next meal' },
          'Chapati':          { storage: 'Wrap in foil and refrigerate up to 2 days', repurpose: 'Use for wraps, rolls, or reheat with butter as next-day breakfast' },
          'Paneer Curry':     { storage: 'Refrigerate up to 2 days, reheat gently to preserve texture', repurpose: 'Blend into a gravy base or use as filling for stuffed parathas' },
          'Samosa':           { storage: 'Store in airtight box at room temp for same day, or freeze', repurpose: 'Crush into chaat topping or serve with extra chutney to boost sales' },
          'Tea / Coffee':     { storage: 'Do not store — discard unused brew after 2 hours', repurpose: 'Reduce batch size for next service; brew fresh in smaller quantities' },
          'Idli/Dosa':        { storage: 'Refrigerate batter up to 3 days; cooked idli up to 1 day', repurpose: 'Crumble leftover idli into upma or fry into idli fry as evening snack' },
          'Biryani':          { storage: 'Refrigerate in sealed container up to 2 days', repurpose: 'Repurpose as biryani fried rice or serve with extra raita at next meal' },
          'Noodles':          { storage: 'Refrigerate up to 1 day; toss with a little oil to prevent sticking', repurpose: 'Stir-fry with egg/veg for a quick next-day snack or Indo-Chinese dish' },
          'Sandwich':         { storage: 'Refrigerate fillings separately; assemble fresh only', repurpose: 'Use leftover filling as toast topping or as stuffing for rolls' },
        }
        const defaultGuidance = { storage: 'Refrigerate promptly in sealed containers', repurpose: 'Incorporate into tomorrow\'s menu or offer at reduced price' }

        return (
          <div className="card" style={{ marginBottom: '24px', border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
              ♻️ Additional Food Management
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              These items are predicted below your usual average — here's what to do with any extras.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {surplusItems.map((item, i) => {
                const guide = FOOD_GUIDANCE[item.name] || defaultGuidance
                return (
                  <div key={i} style={{
                    background: '#0f1117', border: '1px solid #2d3148', borderRadius: '10px',
                    padding: '12px 14px', borderLeft: '3px solid #f59e0b',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.name}
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>{item.change}% vs avg</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '5px', display: 'flex', gap: '6px' }}>
                      <span style={{ color: '#38bdf8', flexShrink: 0 }}>🧊 Store:</span>
                      {guide.storage}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '6px' }}>
                      <span style={{ color: '#34d399', flexShrink: 0 }}>♻️ Use:</span>
                      {guide.repurpose}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      <div className="grid-2">
        {/* Item table */}
        <div className="card">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
            Detailed Item Breakdown
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Menu Item', 'Portions', 'vs Avg'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '12px',
                    color: '#64748b', fontWeight: 600, borderBottom: '1px solid #2d3148' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1a1d2e' }}>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#e2e8f0' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px',
                      background: ITEM_COLORS[i % ITEM_COLORS.length], marginRight: '8px', verticalAlign: 'middle' }} />
                    {item.name}
                  </td>
                  <td style={{ padding: '10px', fontSize: '14px', color: '#a5b4fc', fontWeight: 700 }}>
                    {item.portions}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '12px', fontWeight: 600,
                      color: item.change > 0 ? '#10b981' : item.change < 0 ? '#ef4444' : '#64748b',
                    }}>
                      {item.change > 0 ? <TrendingUp size={12} /> : item.change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insights */}
        <div className="card">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
            🤖 AI Insights & Recommendations
          </div>
          {insights && insights.map((insight, i) => (
            <div key={i} style={{
              background: '#0f1117', border: '1px solid #2d3148', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '10px',
              borderLeft: '3px solid #4f46e5',
            }}>
              <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5 }}>
                💡 {insight}
              </div>
            </div>
          ))}
          <hr className="divider" />
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
              ✅ Action Plan
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              Prepare <strong style={{ color: '#e2e8f0' }}>{totalMeals}</strong> total meals.
              Start preparation <strong style={{ color: '#e2e8f0' }}>90 minutes</strong> before service.
              Keep <strong style={{ color: '#e2e8f0' }}>10% buffer stock</strong> for peak demand variations.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
