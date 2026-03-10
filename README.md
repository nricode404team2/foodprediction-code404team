# Smart Canteen Demand Predictor

A React + Vite web app for predicting canteen/cafeteria demand using a hybrid approach:
- HuggingFace Inference API (`mistralai/Mistral-7B-Instruct-v0.1`) for contextual predictions
- A deterministic algorithmic fallback when the model/API is unavailable

The app helps canteen operators estimate meal portions, understand demand drivers, and reduce food waste.

Current app preview URL:
`https://5173-d735ae81-bc33-49da-9833-18e8f87e5dc1.orchids.cloud/?_cb=1773138927935`

## Features

- Guided onboarding to capture canteen profile, meal slots, operating days, customer volume, and menu
- Dashboard with 7-day demand forecast, 8-week projected trend, and top menu demand
- One-click run prediction from dashboard
- Prediction form with date/day/meal/weather/event inputs
- Weather auto-detection and city search
- Holiday/event detection with opt-in multipliers
- Results page with total meal prediction, confidence score, and demand level
- Item-level portions and change vs average
- Factor impact visualization, AI insights, and food surplus suggestions
- Food management reference page with storage, repurposing, and donation guidance
- "How It Works" page that explains the model pipeline and formula

## Tech Stack

- React 19
- Vite 7
- Recharts (charts/visualizations)
- Lucide React (icons)
- Browser `localStorage` for profile persistence

## External Services Used

- HuggingFace Inference API (LLM prediction)
- Open-Meteo Forecast API (weather + geocoding)
- OpenStreetMap Nominatim (reverse geocoding)
- Nager.Date API (public holidays)

## Getting Started

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Then open `http://localhost:5173`.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
src/
  components/
    Onboarding.jsx
    Dashboard.jsx
    PredictionForm.jsx
    Results.jsx
    FoodManagement.jsx
    AlgorithmExplainer.jsx
    Navbar.jsx
  utils/
    huggingface.js
    weather.js
    holidays.js
    storage.js
```

## Notes

- User onboarding data is stored in browser `localStorage`.
- If HuggingFace inference is slow/unavailable, predictions automatically fall back to the internal multiplier model.
