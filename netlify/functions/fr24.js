exports.handler = async (event) => {
  const params  = event.queryStringParameters || {}
  const flights  = params.flights  || ''
  const mode     = params.mode     || 'live'   // live | summary
  const date     = params.date     || new Date().toISOString().slice(0,10)

  const apiKey = process.env.FR24_API_KEY
  if (!apiKey) return respond(500, { error: 'FR24_API_KEY not set' })

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept':        'application/json',
    'Accept-Version':'v1'
  }

  if (mode === 'summary') {
    // Flight summary — gives scheduled/actual dep & arr times, status
    // Try by flight_numbers first, then callsigns
    const urls = [
      `https://fr24api.flightradar24.com/api/flight-summary/light?flight_numbers=${flights}&date=${date}`,
      `https://fr24api.flightradar24.com/api/flight-summary/light?callsigns=${flights}&date=${date}`,
    ]
    for (const url of urls) {
      try {
        const res  = await fetch(url, { headers })
        const text = await res.text()
        if (res.ok) {
          const json = JSON.parse(text)
          if (json.data && json.data.length > 0) return respond(200, json)
        }
      } catch(e) {}
    }
    return respond(200, { data: [], note: 'No summary data found' })
  }

  // Default: live positions
  const urls = [
    `https://fr24api.flightradar24.com/api/live/flight-positions/light?callsigns=${flights}`,
    `https://fr24api.flightradar24.com/api/live/flight-positions/full?callsigns=${flights}`,
  ]
  for (const url of urls) {
    try {
      const res  = await fetch(url, { headers })
      const text = await res.text()
      if (res.ok) {
        const json = JSON.parse(text)
        if (json.data && json.data.length > 0) return respond(200, { ...json, live: true })
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
