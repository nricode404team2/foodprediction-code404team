import { useState } from 'react'
import Dashboard from './components/Dashboard'
import PredictionForm from './components/PredictionForm'
import Results from './components/Results'
import AlgorithmExplainer from './components/AlgorithmExplainer'
import FoodManagement from './components/FoodManagement'
import Navbar from './components/Navbar'
import Onboarding from './components/Onboarding'
import { loadProfile, clearProfile } from './utils/storage'
import './App.css'

function App() {
  const [profile, setProfile] = useState(() => loadProfile())
  const [activePage, setActivePage] = useState('dashboard')
  const [predictionResults, setPredictionResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleOnboardingComplete = (newProfile) => {
    setProfile(newProfile)
    setActivePage('dashboard')
  }

  const handleReset = () => {
    clearProfile()
    setProfile(null)
    setActivePage('dashboard')
  }

  // Show onboarding if no profile exists
  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="app-container">
      <Navbar activePage={activePage} setActivePage={setActivePage} canteenName={profile.canteenName} />
      <main className="main-content">
        {activePage === 'dashboard' && (
          <Dashboard setActivePage={setActivePage} profile={profile} onReset={handleReset} />
        )}
        {activePage === 'predict' && (
          <PredictionForm
            setPredictionResults={setPredictionResults}
            setActivePage={setActivePage}
            loading={loading}
            setLoading={setLoading}
            profile={profile}
          />
        )}
        {activePage === 'results' && (
          <Results results={predictionResults} setActivePage={setActivePage} />
        )}
        {activePage === 'food-management' && <FoodManagement />}
        {activePage === 'algorithm' && <AlgorithmExplainer />}
      </main>
    </div>
  )
}

export default App
