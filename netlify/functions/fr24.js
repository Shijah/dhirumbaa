exports.handler = async (event) => {
  const params  = event.queryStringParameters || {}
  const flights  = params.flights  || ''
  const mode     = params.mode     || 'live'
  const date     = params.date     || new Date().toISOString().slice(0,10)

  const apiKey = process.env.FR24_API_KEY
  if (!apiKey) return respond(500, { error: 'FR24_API_KEY not set' })

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept':        'application/json',
    'Accept-Version':'v1'
  }

  // Airport arrivals — gives all flights arriving at MLE with FR24 ETAs
  if (mode === 'arrivals') {
    const airport = flights || 'MLE'
    const urls = [
      `https://fr24api.flightradar24.com/api/airports/${airport}/arrivals`,
      `https://fr24api.flightradar24.com/api/airport-disruptions`,
    ]
    for (const url of urls) {
      try {
        const res  = await fetch(url, { headers })
        const text = await res.text()
        return respond(res.status, { url, body: text.slice(0,2000) })
      } catch(e) { return respond(500, { error: e.message }) }
    }
  }

  // Flight summary — try all known endpoint formats
  if (mode === 'summary') {
    const urls = [
      `https://fr24api.flightradar24.com/api/flight-summary/light?flight_numbers=${flights}&date=${date}`,
      `https://fr24api.flightradar24.com/api/flight-summary/light?callsigns=${flights}&date=${date}`,
      `https://fr24api.flightradar24.com/api/flight-summary/full?flight_numbers=${flights}&date=${date}`,
      `https://fr24api.flightradar24.com/api/flights/${flights}`,
    ]
    const results = []
    for (const url of urls) {
      try {
        const res  = await fetch(url, { headers })
        const text = await res.text()
        results.push({ url, status: res.status, body: text.slice(0,500) })
      } catch(e) {
        results.push({ url, error: e.message })
      }
    }
    return respond(200, { results })
  }

  // Live positions (default)
  const urls = [
    `https://fr24api.flightradar24.com/api/live/flight-positions/light?callsigns=${flights}`,
  ]
  for (const url of urls) {
    try {
      const res  = await fetch(url, { headers })
      const text = await res.text()
      if (res.ok) {
        const json = JSON.parse(text)
        if (json.data?.length > 0) return respond(200, { ...json, live: true })
      }
    } catch(e) {}
  }
  return respond(200, { data: [], live: true })
}

function respond(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body)
  }
}
