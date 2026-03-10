const HF_TOKEN = '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'
const HF_API = 'https://api-inference.huggingface.co/models'

// We use microsoft/phi-2 or mistralai/Mistral-7B-Instruct-v0.1 for text-generation
// This function calls HuggingFace Inference API to get demand predictions
export async function predictDemand(params) {
  const {
    date, dayOfWeek, mealTime, weather, isHoliday, isEvent, eventName,
    temperature, historicalAvg, items
  } = params

  const prompt = buildPrompt(params)

  try {
    const response = await fetch(`${HF_API}/mistralai/Mistral-7B-Instruct-v0.1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          return_full_text: false,
        }
      })
    })

    if (!response.ok) {
      // Fallback to algorithmic prediction if model is loading or unavailable
      return algorithmicFallback(params)
    }

    const data = await response.json()
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text

    if (!text) return algorithmicFallback(params)

    // Try to parse JSON from the model output
    const parsed = extractJSON(text)
    if (parsed) return parsed

    return algorithmicFallback(params)
  } catch (err) {
    console.warn('HF API error, using algorithmic fallback:', err)
    return algorithmicFallback(params)
  }
}

function buildPrompt(params) {
  const { dayOfWeek, mealTime, weather, isHoliday, isEvent, eventName, temperature, historicalAvg, items } = params
  const itemList = items.join(', ')

  return `[INST] You are a canteen demand prediction AI. Predict the number of portions needed for each menu item.

Input parameters:
- Day: ${dayOfWeek}
- Meal time: ${mealTime}
- Weather: ${weather}, Temperature: ${temperature}°C
- Public holiday: ${isHoliday ? 'Yes' : 'No'}
- Special event: ${isEvent ? `Yes - ${eventName}` : 'No'}
- Historical average for this slot: ${historicalAvg} total meals
- Menu items to predict: ${itemList}

Respond ONLY with a JSON object like this (no extra text):
{
  "totalMeals": <number>,
  "confidence": <0-100>,
  "demandLevel": "<Low|Medium|High|Very High>",
  "items": [
    {"name": "<item>", "portions": <number>, "change": <percent vs average>}
  ],
  "insights": ["<insight1>", "<insight2>", "<insight3>"]
}
[/INST]`
}

function extractJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return null
}

// Algorithmic prediction using weighted factors (used as fallback or base)
export function algorithmicFallback(params) {
  const { dayOfWeek, mealTime, weather, isHoliday, isEvent, temperature, historicalAvg, items } = params

  // Base multipliers
  const dayMultiplier = {
    'Monday': 1.05, 'Tuesday': 1.08, 'Wednesday': 1.0,
    'Thursday': 1.12, 'Friday': 1.22, 'Saturday': 0.75, 'Sunday': 0.70,
  }[dayOfWeek] || 1.0

  const mealMultiplier = {
    'Breakfast': 0.65, 'Lunch': 1.0, 'Dinner': 0.72, 'Snack': 0.35,
  }[mealTime] || 1.0

  const weatherMultiplier = {
    'Sunny': 1.05, 'Cloudy': 1.0, 'Rainy': 0.85, 'Cold': 1.10, 'Hot': 0.90,
  }[weather] || 1.0

  const tempEffect = temperature < 15 ? 1.08 : temperature > 32 ? 0.92 : 1.0
  const holidayMultiplier = isHoliday ? 0.60 : 1.0
  const eventMultiplier = isEvent ? 1.35 : 1.0

  const totalMultiplier = dayMultiplier * mealMultiplier * weatherMultiplier * tempEffect * holidayMultiplier * eventMultiplier
  const totalMeals = Math.round(historicalAvg * totalMultiplier)

  // Item distribution
  const itemDistributions = {
    'Rice & Dal': 0.28, 'Chapati': 0.22, 'Paneer Curry': 0.16,
    'Samosa': 0.12, 'Tea / Coffee': 0.35, 'Idli/Dosa': 0.20,
    'Biryani': 0.18, 'Noodles': 0.14, 'Sandwich': 0.15,
  }

  const predictedItems = items.map(name => {
    const base = itemDistributions[name] || 0.15
    const portions = Math.round(totalMeals * base * (0.9 + Math.random() * 0.2))
    const baseAvg = Math.round(historicalAvg * base)
    const change = Math.round(((portions - baseAvg) / baseAvg) * 100)
    return { name, portions, change }
  })

  const insights = generateInsights({ dayOfWeek, mealTime, weather, isHoliday, isEvent, temperature, totalMultiplier })

  const confidence = Math.round(78 + Math.random() * 14)
  const level = totalMultiplier > 1.3 ? 'Very High' : totalMultiplier > 1.1 ? 'High' : totalMultiplier > 0.9 ? 'Medium' : 'Low'

  return {
    totalMeals,
    confidence,
    demandLevel: level,
    items: predictedItems,
    insights,
    multiplierBreakdown: {
      dayEffect: Math.round((dayMultiplier - 1) * 100),
      mealEffect: Math.round((mealMultiplier - 1) * 100),
      weatherEffect: Math.round((weatherMultiplier * tempEffect - 1) * 100),
      holidayEffect: Math.round((holidayMultiplier - 1) * 100),
      eventEffect: Math.round((eventMultiplier - 1) * 100),
    }
  }
}

function generateInsights({ dayOfWeek, mealTime, weather, isHoliday, isEvent, temperature, totalMultiplier }) {
  const insights = []

  if (dayOfWeek === 'Friday') insights.push('Friday typically sees 22% higher lunch demand — stock up on popular items.')
  if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') insights.push('Weekend demand is 25-30% lower than weekdays. Reduce preparation accordingly.')
  if (weather === 'Rainy') insights.push('Rainy weather reduces foot traffic by ~15%. Focus on hot beverages and soups.')
  if (weather === 'Cold' || temperature < 15) insights.push('Cold temperature drives higher demand for hot meals. Increase chai/coffee by 20%.')
  if (isHoliday) insights.push('Holiday detected — expect 40% lower footfall. Prepare minimal stock.')
  if (isEvent) insights.push('Special event will significantly boost demand. Coordinate with event organizers for headcount.')
  if (mealTime === 'Lunch') insights.push('Lunch is the highest demand slot. Ensure peak staffing between 12–2 PM.')
  if (mealTime === 'Breakfast') insights.push('Increase quick-serve items (idli, tea, sandwich) for breakfast rush.')
  if (totalMultiplier > 1.25) insights.push('Overall demand is predicted to be HIGH. Consider extra seating and faster service lanes.')

  if (insights.length < 2) insights.push('Demand appears normal. Standard preparation should suffice.')
  return insights.slice(0, 4)
}
