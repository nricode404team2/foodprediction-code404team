import { LayoutDashboard, Sparkles, BarChart2, BookOpen, UtensilsCrossed, Recycle } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'predict', label: 'Predict', icon: Sparkles },
  { id: 'results', label: 'Results', icon: BarChart2 },
  { id: 'food-management', label: 'Food Management', icon: Recycle },
  { id: 'algorithm', label: 'How It Works', icon: BookOpen },
]

export default function Navbar({ activePage, setActivePage, canteenName }) {
  return (
    <nav style={{
      background: '#13151f',
      borderBottom: '1px solid #2d3148',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UtensilsCrossed size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#e2e8f0', lineHeight: 1 }}>
            Smart Canteen
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
            Demand Predictor
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              fontFamily: 'inherit', transition: 'all 0.2s',
              background: activePage === id ? 'rgba(79,70,229,0.2)' : 'transparent',
              color: activePage === id ? '#a5b4fc' : '#64748b',
              borderBottom: activePage === id ? '2px solid #4f46e5' : '2px solid transparent',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* HF badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(255,208,0,0.1)', border: '1px solid rgba(255,208,0,0.3)',
        borderRadius: '8px', padding: '6px 12px',
      }}>
        <span style={{ fontSize: '16px' }}>🤗</span>
        <span style={{ fontSize: '12px', color: '#ffd700', fontWeight: '600' }}>HuggingFace AI</span>
      </div>
    </nav>
  )
}
