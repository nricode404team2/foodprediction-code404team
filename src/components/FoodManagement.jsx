import { useState } from 'react'
import { Search, Plus, Sparkles, X } from 'lucide-react'

const HF_TOKEN = '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'
const HF_API = 'https://api-inference.huggingface.co/models'

async function fetchAIFoodGuidance(foodName) {
  const prompt = `[INST] You are a canteen food management expert. For the food item "${foodName}", provide practical guidance for a canteen or cafeteria setting.

Respond ONLY with a valid JSON object (no extra text, no markdown):
{
  "icon": "<single relevant food emoji>",
  "storage": "<1-2 sentences on how to store this food safely>",
  "repurpose": "<1-2 sentences on how to repurpose or reuse leftovers>",
  "donate": "<1-2 sentences on donation suitability and tips>",
  "tips": ["<practical tip 1>", "<practical tip 2>"]
}
[/INST]`

  const response = await fetch(`${HF_API}/mistralai/Mistral-7B-Instruct-v0.1`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.4, return_full_text: false },
    }),
  })

  if (!response.ok) throw new Error('API unavailable')

  const data = await response.json()
  const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text
  if (!text) throw new Error('Empty response')

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

const FOOD_GUIDANCE = {
  'Rice & Dal': {
    icon: '🍛',
    storage: 'Refrigerate in airtight container within 2 hours of cooking. Consume within 24h.',
    repurpose: 'Use as base for khichdi, add fresh tadka for next meal, or mix into a rice soup.',
    donate: 'Suitable for food banks if packed within 1 hour of cooking and transported hot.',
    tips: ['Keep dal and rice separate for better reheating', 'Add a splash of water when reheating to restore moisture'],
  },
  'Chapati': {
    icon: '🫓',
    storage: 'Wrap in foil or damp cloth, refrigerate up to 2 days. Freeze up to 1 month.',
    repurpose: 'Use for wraps and rolls with leftover sabzi, or reheat with butter as next-day breakfast.',
    donate: 'Pack in clean foil packets — widely accepted by shelters and community kitchens.',
    tips: ['Stack with parchment between each chapati to prevent sticking', 'Reheat on tawa for best texture'],
  },
  'Paneer Curry': {
    icon: '🧆',
    storage: 'Refrigerate in sealed container up to 2 days. Reheat gently on low flame.',
    repurpose: 'Blend gravy into a base sauce, use paneer as stuffing for parathas or sandwiches.',
    donate: 'Dairy-based — ensure proper cold chain. Best consumed same day if donating.',
    tips: ['Do not overheat — paneer becomes rubbery', 'Add a squeeze of lemon to refresh day-old curry'],
  },
  'Samosa': {
    icon: '🔺',
    storage: 'Store in airtight box at room temperature same day. Freeze unfried for up to 2 weeks.',
    repurpose: 'Crush into chaat topping with curd and chutney, or serve with extra dips to boost sales.',
    donate: 'Room-temperature snacks are easy to distribute — good for community events.',
    tips: ['Re-crisp in air fryer or oven at 180°C for 5 min', 'Never microwave — makes pastry soggy'],
  },
  'Tea / Coffee': {
    icon: '☕',
    storage: 'Do not store brewed tea/coffee — discard after 2 hours. Dry leaves/grounds keep for months.',
    repurpose: 'Reduce batch brewing size for next service. Used coffee grounds work as a compost additive.',
    donate: 'Cannot be donated — brew fresh in smaller batches to avoid waste.',
    tips: ['Use a measured brewing schedule aligned with peak times', 'Pre-heat urns only when demand is confirmed'],
  },
  'Idli/Dosa': {
    icon: '🥞',
    storage: 'Refrigerate batter up to 3 days. Cooked idli up to 1 day in airtight container.',
    repurpose: 'Crumble leftover idli into upma or fry with mustard seeds as idli fry for evening snack.',
    donate: 'Idlis are ideal for donation — easy to pack, nutritious, and widely accepted.',
    tips: ['Steam idlis in a damp cloth to reheat without drying', 'Batter improves with fermentation — use next day for better dosas'],
  },
  'Biryani': {
    icon: '🍚',
    storage: 'Refrigerate in sealed container up to 2 days. Reheat with a sprinkle of water, covered.',
    repurpose: 'Repurpose as biryani fried rice with egg, or serve with extra raita as next meal.',
    donate: 'High value donation item — coordinate with local NGOs for same-day pickup.',
    tips: ['Reheat in oven at 160°C covered with foil for best results', 'Separate and refrigerate raita immediately'],
  },
  'Noodles': {
    icon: '🍜',
    storage: 'Refrigerate up to 1 day. Toss with a little oil immediately after cooking to prevent sticking.',
    repurpose: 'Stir-fry with egg or vegetables for a quick Indo-Chinese snack or fried noodle dish.',
    donate: 'Acceptable if hot-packed. Pair with soup for a complete donation meal.',
    tips: ['Undercook slightly if expecting leftovers — finish cooking when reheating', 'Add soy sauce and vinegar when re-tossing to refresh flavour'],
  },
  'Sandwich': {
    icon: '🥪',
    storage: 'Refrigerate fillings separately. Assembled sandwiches keep only 4h. Bread keeps 2 days.',
    repurpose: 'Use leftover fillings as toast toppings or as stuffing for rolls and wraps.',
    donate: 'Use filling ingredients only — reassemble fresh at the donation point.',
    tips: ['Keep wet fillings (tomato, chutney) separate until serving', 'Grill day-old bread for croutons or bread toast'],
  },
  'Poha': {
    icon: '🍽️',
    storage: 'Best consumed fresh. Refrigerate up to 1 day in airtight container.',
    repurpose: 'Pan-fry with extra oil and mustard seeds to revive, or mix with curd for quick meal.',
    donate: 'Light and easy to pack — good for morning community meals.',
    tips: ['Add a splash of lemon when reheating to brighten flavour', 'Avoid reheating more than once'],
  },
  'Pav Bhaji': {
    icon: '🍞',
    storage: 'Refrigerate bhaji up to 2 days. Keep pav wrapped in cloth at room temperature same day.',
    repurpose: 'Use bhaji as a pizza topping, stuffing for rolls, or thinned into a soup base.',
    donate: 'Pack bhaji separately — excellent for community kitchens.',
    tips: ['Add butter and a squeeze of lemon when reheating bhaji', 'Freeze pav bhaji masala in portions for faster future cooking'],
  },
  'Vada Pav': {
    icon: '🫔',
    storage: 'Keep vada and pav separate. Vada stays crisp up to 4h at room temp, re-fry to refresh.',
    repurpose: 'Crumble vada into a spiced potato filling for parathas or aloo sabzi.',
    donate: 'Popular street-food donation — easy to distribute in individual wraps.',
    tips: ['Re-fry vada at high heat for 2 min to restore crunch', 'Chutney keeps refrigerated for 3 days separately'],
  },
  'Dal Tadka': {
    icon: '🥣',
    storage: 'Refrigerate up to 2 days. Add water when reheating as dal thickens overnight.',
    repurpose: 'Use as soup base, mix into rice, or thin down and serve as a lentil broth.',
    donate: 'Nutritious and widely accepted — high-value donation item.',
    tips: ['Always bring to a rolling boil when reheating refrigerated dal', 'A fresh tadka when reheating makes day-old dal taste fresh'],
  },
  'Pulao': {
    icon: '🍚',
    storage: 'Refrigerate in airtight container up to 2 days. Reheat with a sprinkle of water, covered.',
    repurpose: 'Stir-fry into a vegetable rice dish or mix with beaten egg for a quick fried rice.',
    donate: 'Excellent for donation — nutritious, easy to pack and transport.',
    tips: ['Spread pulao on a tray to cool quickly before refrigerating', 'Add whole spices and a drop of oil when reheating'],
  },
  'Chole Bhature': {
    icon: '🫘',
    storage: 'Refrigerate chole up to 2 days. Bhature must be eaten fresh — cannot be stored well.',
    repurpose: 'Use leftover chole as a filling for wraps, sandwiches, or serve as chole rice.',
    donate: 'Pack chole only for donation — pair with available bread at the distribution point.',
    tips: ['Bhature dough can be refrigerated unfried for 1 day', 'Add amchur to reheated chole to refresh the tang'],
  },
}

const DEFAULT_GUIDANCE = {
  icon: '🍱',
  storage: 'Refrigerate promptly in sealed containers within 2 hours of cooking. Consume within 24h.',
  repurpose: 'Incorporate into tomorrow\'s menu, offer at a reduced price, or blend into a mixed dish.',
  donate: 'Contact local food banks or NGOs for same-day pickup guidelines in your area.',
  tips: ['Label containers with date and time', 'First In First Out — use oldest stock first'],
}

export default function FoodManagement() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [customItems, setCustomItems] = useState({})
  const [newFoodName, setNewFoodName] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const allGuidance = { ...FOOD_GUIDANCE, ...customItems }
  const allItems = Object.keys(allGuidance)

  const filtered = allItems.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  const guide = selected ? (allGuidance[selected] || DEFAULT_GUIDANCE) : null

  const handleAskAI = async () => {
    const name = newFoodName.trim()
    if (!name) return
    if (allGuidance[name]) {
      setSelected(name)
      setShowAddForm(false)
      setNewFoodName('')
      return
    }
    setAiLoading(true)
    setAiError('')
    try {
      const result = await fetchAIFoodGuidance(name)
      const guidance = {
        icon: result.icon || '🍱',
        storage: result.storage || DEFAULT_GUIDANCE.storage,
        repurpose: result.repurpose || DEFAULT_GUIDANCE.repurpose,
        donate: result.donate || DEFAULT_GUIDANCE.donate,
        tips: Array.isArray(result.tips) && result.tips.length ? result.tips : DEFAULT_GUIDANCE.tips,
      }
      setCustomItems(prev => ({ ...prev, [name]: guidance }))
      setSelected(name)
      setShowAddForm(false)
      setNewFoodName('')
    } catch {
      setAiError('AI could not generate guidance. Using defaults.')
      const fallback = { ...DEFAULT_GUIDANCE }
      setCustomItems(prev => ({ ...prev, [name]: fallback }))
      setSelected(name)
      setShowAddForm(false)
      setNewFoodName('')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
          ♻️ Additional Food Management
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Per-item storage, repurposing, and donation guidance for canteen leftovers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left — item list */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="form-control"
              placeholder="Search food item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filtered.map(name => {
              const g = allGuidance[name]
              const isCustom = !!customItems[name]
              return (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    background: selected === name ? 'rgba(79,70,229,0.18)' : 'transparent',
                    color: selected === name ? '#a5b4fc' : '#94a3b8',
                    borderLeft: selected === name ? '3px solid #4f46e5' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{g.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: selected === name ? 600 : 400, flex: 1 }}>{name}</span>
                  {isCustom && (
                    <span style={{ fontSize: '10px', background: 'rgba(79,70,229,0.25)', color: '#a5b4fc', borderRadius: '4px', padding: '1px 5px' }}>AI</span>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ fontSize: '13px', color: '#64748b', padding: '12px', textAlign: 'center' }}>
                No items found
              </div>
            )}
          </div>

          {/* Add new food */}
          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            {!showAddForm ? (
              <button
                onClick={() => { setShowAddForm(true); setAiError('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1px dashed rgba(79,70,229,0.45)', background: 'transparent',
                  color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '13px', fontWeight: 500, transition: 'all 0.15s',
                }}
              >
                <Plus size={14} />
                Add new food item
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>New food item</span>
                  <button
                    onClick={() => { setShowAddForm(false); setNewFoodName(''); setAiError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <input
                  className="form-control"
                  placeholder="e.g. Pasta, Khichdi..."
                  value={newFoodName}
                  onChange={e => setNewFoodName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                  style={{ fontSize: '13px' }}
                  autoFocus
                />
                {aiError && (
                  <div style={{ fontSize: '11px', color: '#f87171' }}>{aiError}</div>
                )}
                <button
                  onClick={handleAskAI}
                  disabled={!newFoodName.trim() || aiLoading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '9px 12px', borderRadius: '8px', border: 'none',
                    background: newFoodName.trim() && !aiLoading ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(79,70,229,0.2)',
                    color: newFoodName.trim() && !aiLoading ? '#fff' : '#64748b',
                    cursor: newFoodName.trim() && !aiLoading ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {aiLoading ? (
                    <>
                      <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Ask AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right — detail */}
        {guide ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Title */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px 24px' }}>
              <span style={{ fontSize: '42px' }}>{guide.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{selected}</div>
                  {customItems[selected] && (
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                      background: 'linear-gradient(135deg,rgba(79,70,229,0.3),rgba(124,58,237,0.3))',
                      color: '#a5b4fc', border: '1px solid rgba(79,70,229,0.4)',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      ✨ AI-generated
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Canteen food management guide
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Storage */}
              <div className="card" style={{ borderLeft: '3px solid #38bdf8' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🧊 Storage Instructions
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  {guide.storage}
                </div>
              </div>

              {/* Repurpose */}
              <div className="card" style={{ borderLeft: '3px solid #34d399' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ♻️ Repurpose Ideas
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  {guide.repurpose}
                </div>
              </div>

              {/* Donate */}
              <div className="card" style={{ borderLeft: '3px solid #fbbf24' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🤝 Donation Guidance
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  {guide.donate}
                </div>
              </div>

              {/* Tips */}
              <div className="card" style={{ borderLeft: '3px solid #a78bfa' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💡 Pro Tips
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {guide.tips.map((tip, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '4px' }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>♻️</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Select a food item
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', maxWidth: '300px' }}>
              Choose any item from the list to view its storage, repurposing, donation, and handling guidance.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
