import { Brain, GitBranch, BarChart2, Layers, Zap, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: '📥',
    title: 'Input Collection',
    color: '#4f46e5',
    desc: 'The system collects all relevant parameters: date, day of week, meal time, weather conditions, temperature, holiday status, and special events.',
    factors: ['Day of Week', 'Meal Time Slot', 'Date / Season', 'User-defined inputs'],
  },
  {
    icon: '⚙️',
    title: 'Factor Weighting',
    color: '#7c3aed',
    desc: 'Each factor is assigned a multiplier based on historical patterns. Multipliers are applied to the baseline (historical average) to adjust the prediction.',
    factors: ['Day multiplier (e.g. Friday = +22%)', 'Meal multiplier (Lunch = peak)', 'Weather multiplier (Rain = −15%)', 'Holiday multiplier (−40%)'],
  },
  {
    icon: '🤖',
    title: 'HuggingFace LLM (Mistral-7B)',
    color: '#0ea5e9',
    desc: 'We send a structured prompt to Mistral-7B-Instruct on HuggingFace Inference API. The model uses its language understanding to reason about demand contextually.',
    factors: ['Understands event context', 'Reasons about combinations', 'Generates item-level breakdown', 'Returns JSON with insights'],
  },
  {
    icon: '🔁',
    title: 'Algorithmic Fallback',
    color: '#10b981',
    desc: 'If the LLM is unavailable or loading, a pure mathematical model applies all factor multipliers directly to the historical average.',
    factors: ['No dependency on API uptime', 'Deterministic and explainable', 'Based on research-backed multipliers', 'Always available instantly'],
  },
  {
    icon: '📊',
    title: 'Output Generation',
    color: '#f59e0b',
    desc: 'Final predictions include total meal count, per-item portions, confidence score, demand level, and actionable insights for canteen managers.',
    factors: ['Total meals forecast', 'Per-item portion count', 'Factor impact breakdown', 'Actionable recommendations'],
  },
]

const factors = [
  { name: 'Day of Week', impact: 'High', direction: 'Both', note: 'Fri +22%, Sat/Sun −25−30%', color: '#4f46e5' },
  { name: 'Meal Time', impact: 'High', direction: 'Both', note: 'Lunch = peak, Snack = low', color: '#7c3aed' },
  { name: 'Weather', impact: 'Medium', direction: 'Both', note: 'Rain −15%, Cold +8%', color: '#0ea5e9' },
  { name: 'Temperature', impact: 'Medium', direction: 'Both', note: '<15°C +8%, >32°C −8%', color: '#38bdf8' },
  { name: 'Public Holiday', impact: 'High', direction: 'Down', note: 'Reduces demand by ~40%', color: '#ef4444' },
  { name: 'Special Event', impact: 'High', direction: 'Up', note: 'Boosts demand by ~35%', color: '#10b981' },
  { name: 'Historical Avg', impact: 'Critical', direction: 'Baseline', note: 'All multipliers applied to this', color: '#f59e0b' },
]

export default function AlgorithmExplainer() {
  return (
    <div>
      <h1 className="section-title">How the Algorithm Works</h1>
      <p className="section-subtitle">A detailed explanation of the prediction model and factor incorporation</p>

      {/* Architecture overview */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Brain size={20} color="#818cf8" />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>Architecture Overview</span>
        </div>
        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '16px' }}>
          The Smart Canteen Demand Predictor uses a <strong style={{ color: '#a5b4fc' }}>hybrid approach</strong>:
          a large language model (Mistral-7B via HuggingFace) for contextual understanding,
          combined with a <strong style={{ color: '#a5b4fc' }}>rule-based weighted multiplier model</strong> for
          reliability and explainability. The LLM is the primary model; the algorithmic model serves as
          an instant fallback when the API is unavailable.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { icon: <Layers size={14} />, label: 'Hybrid Model', color: '#4f46e5' },
            { icon: <Zap size={14} />, label: 'HuggingFace Mistral-7B', color: '#ffd700' },
            { icon: <GitBranch size={14} />, label: 'Algorithmic Fallback', color: '#10b981' },
            { icon: <BarChart2 size={14} />, label: 'Factor-based Weighting', color: '#f59e0b' },
          ].map((b, i) => (
            <div key={i} className="badge" style={{ background: `${b.color}22`, color: b.color, border: `1px solid ${b.color}44` }}>
              {b.icon} {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Step by step */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
          Step-by-Step Prediction Pipeline
        </div>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: `${step.color}22`, border: `1px solid ${step.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                {step.icon}
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: '2px', flex: 1, background: '#2d3148', margin: '4px 0' }} />
              )}
            </div>
            <div className="card" style={{ flex: 1, marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: step.color,
                  background: `${step.color}22`, padding: '2px 8px', borderRadius: '12px' }}>
                  STEP {i + 1}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>{step.title}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '10px' }}>{step.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {step.factors.map((f, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', color: '#64748b',
                    background: '#0f1117', border: '1px solid #2d3148',
                    borderRadius: '6px', padding: '3px 8px',
                  }}>
                    <CheckCircle size={10} color={step.color} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Factor table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
          Influencing Factors & Their Impact
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Factor', 'Impact Level', 'Direction', 'How it affects demand'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px',
                  color: '#64748b', fontWeight: 600, borderBottom: '1px solid #2d3148' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factors.map((f, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a1d2e' }}>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{f.name}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px',
                    background: f.impact === 'Critical' ? 'rgba(239,68,68,0.15)' :
                      f.impact === 'High' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    color: f.impact === 'Critical' ? '#ef4444' : f.impact === 'High' ? '#f59e0b' : '#10b981',
                  }}>
                    {f.impact}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: f.direction === 'Up' ? '#10b981' : f.direction === 'Down' ? '#ef4444' :
                      f.direction === 'Baseline' ? '#f59e0b' : '#94a3b8',
                  }}>
                    {f.direction === 'Up' ? '↑ ' : f.direction === 'Down' ? '↓ ' : f.direction === 'Both' ? '↕ ' : '◉ '}
                    {f.direction}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#94a3b8' }}>{f.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formula */}
      <div className="card" style={{ background: '#0f1117', border: '1px solid #2d3148' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>
          📐 Core Prediction Formula
        </div>
        <div style={{
          background: '#13151f', border: '1px solid #2d3148', borderRadius: '10px',
          padding: '16px 20px', fontFamily: 'monospace', fontSize: '14px', color: '#a5b4fc',
          lineHeight: 2,
        }}>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>// Algorithmic model formula</div>
          <div><span style={{ color: '#f59e0b' }}>predicted_meals</span> =</div>
          <div style={{ paddingLeft: '20px' }}>
            <span style={{ color: '#94a3b8' }}>historical_avg</span>
            <span style={{ color: '#e2e8f0' }}> × </span>
            <span style={{ color: '#10b981' }}>day_multiplier</span>
            <span style={{ color: '#e2e8f0' }}> × </span>
            <span style={{ color: '#38bdf8' }}>meal_multiplier</span>
          </div>
          <div style={{ paddingLeft: '20px' }}>
            <span style={{ color: '#e2e8f0' }}> × </span>
            <span style={{ color: '#7c3aed' }}>weather_multiplier</span>
            <span style={{ color: '#e2e8f0' }}> × </span>
            <span style={{ color: '#a78bfa' }}>temp_effect</span>
          </div>
          <div style={{ paddingLeft: '20px' }}>
            <span style={{ color: '#e2e8f0' }}> × </span>
            <span style={{ color: '#ef4444' }}>holiday_multiplier</span>
            <span style={{ color: '#e2e8f0' }}> × </span>
            <span style={{ color: '#10b981' }}>event_multiplier</span>
          </div>
        </div>
        <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(79,70,229,0.08)',
          borderRadius: '8px', border: '1px solid rgba(79,70,229,0.2)' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.7 }}>
            <strong style={{ color: '#a5b4fc' }}>Example:</strong> Avg = 300 meals, Friday (+22%), Lunch (+0%), Rainy (−15%), 20°C (+0%), No holiday, Sports Event (+35%)
            <br />
            → 300 × 1.22 × 1.0 × 0.85 × 1.0 × 1.0 × 1.35 = <strong style={{ color: '#e2e8f0' }}>~420 meals</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
