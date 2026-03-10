import { useState } from 'react'
import { UtensilsCrossed, MapPin, Users, Clock, ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react'
import { saveProfile } from '../utils/storage'

const CANTEEN_TYPES = [
  { id: 'college', label: 'College / University', icon: '🎓' },
  { id: 'office', label: 'Office / Corporate', icon: '🏢' },
  { id: 'hospital', label: 'Hospital / Medical', icon: '🏥' },
  { id: 'school', label: 'School', icon: '📚' },
  { id: 'factory', label: 'Factory / Industrial', icon: '🏭' },
  { id: 'public', label: 'Public Cafeteria', icon: '🏪' },
]

const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', time: '7–10 AM', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', time: '12–2 PM', icon: '☀️' },
  { id: 'dinner', label: 'Dinner', time: '7–9 PM', icon: '🌙' },
  { id: 'snack', label: 'Evening Snack', time: '4–6 PM', icon: '☕' },
]

const PRESET_ITEMS = [
  'Rice & Dal', 'Chapati', 'Paneer Curry', 'Samosa', 'Tea / Coffee',
  'Idli/Dosa', 'Biryani', 'Noodles', 'Sandwich', 'Poha',
  'Pav Bhaji', 'Vada Pav', 'Dal Tadka', 'Pulao', 'Chole Bhature',
]

const OPERATING_DAYS = [
  { id: 'mon', label: 'Mon' }, { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' }, { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' }, { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]

const STEPS = [
  { id: 'basics', title: 'Canteen Details', icon: UtensilsCrossed, desc: 'Tell us about your canteen' },
  { id: 'operations', title: 'Operations', icon: Clock, desc: 'Meal slots & operating days' },
  { id: 'customers', title: 'Customer Volume', icon: Users, desc: 'Average daily footfall' },
  { id: 'menu', title: 'Menu Items', icon: UtensilsCrossed, desc: 'What do you serve?' },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    canteenName: '',
    canteenType: '',
    location: '',
    mealSlots: ['lunch'],
    operatingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    avgCustomersTotal: '300',
    avgCustomers: { breakfast: '100', lunch: '300', dinner: '150', snack: '80' },
    menuItems: ['Rice & Dal', 'Chapati', 'Paneer Curry', 'Tea / Coffee', 'Samosa'],
    customItemInput: '',
  })

  const upd = (key, val) => setData(d => ({ ...d, [key]: val }))

  const toggleSlot = (id) => {
    upd('mealSlots', data.mealSlots.includes(id)
      ? data.mealSlots.filter(s => s !== id)
      : [...data.mealSlots, id])
  }

  const toggleDay = (id) => {
    upd('operatingDays', data.operatingDays.includes(id)
      ? data.operatingDays.filter(d => d !== id)
      : [...data.operatingDays, id])
  }

  const toggleItem = (item) => {
    upd('menuItems', data.menuItems.includes(item)
      ? data.menuItems.filter(i => i !== item)
      : [...data.menuItems, item])
  }

  const addCustomItem = () => {
    const val = data.customItemInput.trim()
    if (!val || data.menuItems.includes(val)) return
    upd('menuItems', [...data.menuItems, val])
    upd('customItemInput', '')
  }

  const canProceed = () => {
    if (step === 0) return data.canteenName.trim().length > 1 && data.canteenType
    if (step === 1) return data.mealSlots.length > 0 && data.operatingDays.length > 0
    if (step === 2) return Number(data.avgCustomersTotal) > 0
    if (step === 3) return data.menuItems.length > 0
    return true
  }

  const handleFinish = () => {
    const profile = {
      canteenName: data.canteenName,
      canteenType: data.canteenType,
      location: data.location,
      mealSlots: data.mealSlots,
      operatingDays: data.operatingDays,
      avgCustomersTotal: data.avgCustomersTotal,
      avgCustomers: data.avgCustomers,
      menuItems: data.menuItems,
    }
    saveProfile(profile)
    onComplete(profile)
  }

  const card = { background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: '16px', padding: '24px' }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>

        {/* Logo header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <UtensilsCrossed size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#e2e8f0', marginBottom: '4px' }}>
            Smart Canteen Demand Predictor
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Let's set up your canteen profile — takes about 2 minutes</p>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '0' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '13px', flexShrink: 0,
                  background: i < step ? '#4f46e5' : i === step ? 'rgba(79,70,229,0.2)' : '#1a1d2e',
                  border: `2px solid ${i <= step ? '#4f46e5' : '#2d3148'}`,
                  color: i < step ? 'white' : i === step ? '#a5b4fc' : '#64748b',
                  transition: 'all 0.3s',
                }}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: '10px', color: i === step ? '#a5b4fc' : '#64748b', whiteSpace: 'nowrap', fontWeight: i === step ? 600 : 400 }}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: i < step ? '#4f46e5' : '#2d3148', margin: '0 4px', marginBottom: '16px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={card}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
              {STEPS[step].title}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>{STEPS[step].desc}</p>
          </div>

          {/* STEP 0 — Basics */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Canteen / Cafeteria Name *</label>
                <input className="form-control" type="text" placeholder="e.g. Main Block Canteen, Nourish Corner..."
                  value={data.canteenName} onChange={e => upd('canteenName', e.target.value)}
                  autoFocus style={{ fontSize: '15px', padding: '12px 14px' }} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type of Canteen *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {CANTEEN_TYPES.map(t => (
                    <button key={t.id} onClick={() => upd('canteenType', t.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left',
                      background: data.canteenType === t.id ? 'rgba(79,70,229,0.2)' : '#0f1117',
                      outline: data.canteenType === t.id ? '1.5px solid #4f46e5' : '1px solid #2d3148',
                    }}>
                      <span style={{ fontSize: '20px' }}>{t.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: data.canteenType === t.id ? '#a5b4fc' : '#94a3b8' }}>
                        {t.label}
                      </span>
                      {data.canteenType === t.id && (
                        <Check size={13} color="#4f46e5" style={{ marginLeft: 'auto' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location / City (optional)</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input className="form-control" type="text" placeholder="e.g. Mumbai, Bangalore, Delhi..."
                    value={data.location} onChange={e => upd('location', e.target.value)}
                    style={{ paddingLeft: '34px' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Used to auto-detect local holidays and festivals
                </span>
              </div>
            </div>
          )}

          {/* STEP 1 — Operations */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Meal Slots You Serve *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {MEAL_SLOTS.map(s => {
                    const active = data.mealSlots.includes(s.id)
                    return (
                      <button key={s.id} onClick={() => toggleSlot(s.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left',
                        background: active ? 'rgba(79,70,229,0.2)' : '#0f1117',
                        outline: active ? '1.5px solid #4f46e5' : '1px solid #2d3148',
                      }}>
                        <span style={{ fontSize: '20px' }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: active ? '#a5b4fc' : '#e2e8f0' }}>{s.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{s.time}</div>
                        </div>
                        {active && <Check size={13} color="#4f46e5" style={{ marginLeft: 'auto' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Operating Days *</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {OPERATING_DAYS.map(d => {
                    const active = data.operatingDays.includes(d.id)
                    return (
                      <button key={d.id} onClick={() => toggleDay(d.id)} style={{
                        width: '44px', height: '44px', borderRadius: '10px', border: 'none',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                        transition: 'all 0.2s',
                        background: active ? 'rgba(79,70,229,0.2)' : '#0f1117',
                        color: active ? '#a5b4fc' : '#64748b',
                        outline: active ? '1.5px solid #4f46e5' : '1px solid #2d3148',
                      }}>
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Customer volume */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)',
                borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6,
              }}>
                💡 Enter your <strong style={{ color: '#a5b4fc' }}>normal weekday</strong> customer numbers — no holidays or special events. This is your baseline.
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Average Total Customers Per Day (normal day) *</label>
                <input className="form-control" type="number" placeholder="e.g. 500"
                  value={data.avgCustomersTotal} onChange={e => upd('avgCustomersTotal', e.target.value)}
                  min="10" max="10000" style={{ fontSize: '20px', fontWeight: 700, padding: '12px 14px' }} />
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Total footfall across all meal slots on a normal weekday
                </span>
              </div>

              <div style={{ borderTop: '1px solid #2d3148', paddingTop: '16px' }}>
                <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                  Per-Slot Breakdown (optional — helps accuracy)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {data.mealSlots.map(slot => {
                    const slotInfo = MEAL_SLOTS.find(s => s.id === slot)
                    return (
                      <div key={slot} style={{ background: '#0f1117', borderRadius: '10px', padding: '12px', border: '1px solid #2d3148' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                          {slotInfo?.icon} {slotInfo?.label}
                        </div>
                        <input className="form-control" type="number" placeholder="Customers"
                          value={data.avgCustomers[slot] || ''}
                          onChange={e => upd('avgCustomers', { ...data.avgCustomers, [slot]: e.target.value })}
                          style={{ padding: '8px 10px', fontSize: '14px' }} />
                      </div>
                    )
                  })}
                </div>
                {(() => {
                  const slotSum = data.mealSlots.reduce((s, slot) => s + (Number(data.avgCustomers[slot]) || 0), 0)
                  const total = Number(data.avgCustomersTotal) || 0
                  const over = slotSum > total && total > 0
                  if (slotSum === 0) return null
                  return (
                    <div style={{
                      marginTop: '10px', padding: '9px 12px', borderRadius: '8px', fontSize: '12px',
                      background: over ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${over ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`,
                      color: over ? '#f87171' : '#34d399',
                    }}>
                      {over
                        ? `⚠️ Slot total (${slotSum}) exceeds your daily average (${total}) — please reduce slot numbers`
                        : `✓ Slot total: ${slotSum} / ${total} customers`}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* STEP 3 — Menu Items */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                  Select Items You Serve * ({data.menuItems.length} selected)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {PRESET_ITEMS.map(item => {
                    const active = data.menuItems.includes(item)
                    return (
                      <button key={item} onClick={() => toggleItem(item)} style={{
                        padding: '7px 13px', borderRadius: '8px', border: 'none',
                        cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s',
                        background: active ? 'rgba(79,70,229,0.25)' : '#0f1117',
                        color: active ? '#a5b4fc' : '#64748b',
                        outline: active ? '1px solid #4f46e5' : '1px solid #2d3148',
                      }}>
                        {active ? '✓ ' : '+ '}{item}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #2d3148', paddingTop: '14px' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Add Custom Item
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="form-control" type="text" placeholder="Type any food item..."
                    value={data.customItemInput}
                    onChange={e => upd('customItemInput', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                    style={{ flex: 1 }} />
                  <button onClick={addCustomItem} style={{
                    background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)',
                    borderRadius: '8px', padding: '0 14px', cursor: 'pointer', color: '#a5b4fc',
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontFamily: 'inherit',
                  }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {/* Custom items added by user */}
                {data.menuItems.filter(i => !PRESET_ITEMS.includes(i)).length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.menuItems.filter(i => !PRESET_ITEMS.includes(i)).map(item => (
                      <div key={item} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: '#10b981',
                      }}>
                        {item}
                        <button onClick={() => toggleItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 0 }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px' }}>
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: '1px solid #2d3148', borderRadius: '8px',
                padding: '10px 18px', cursor: step === 0 ? 'default' : 'pointer',
                fontSize: '14px', fontFamily: 'inherit', color: step === 0 ? '#2d3148' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={15} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canProceed()}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
              >
                <Check size={16} /> Launch My Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Step indicator dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '20px' : '6px', height: '6px', borderRadius: '3px',
              background: i === step ? '#4f46e5' : i < step ? '#7c3aed' : '#2d3148',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
