exports.handler = async (event) => {
  const flights = event.queryStringParameters?.flights || ''

  if (!flights) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'No flight numbers provided' })
    }
  }

  const apiKey = process.env.FR24_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'FR24_API_KEY not configured' })
    }
  }

  const urls = [
    `https://fr24api.flightradar24.com/api/live/flight-positions/light?flight_numbers=${flights}`,
    `https://fr24api.flightradar24.com/v1/live/flight-positions/light?flight_numbers=${flights}`,
    `https://fr24api.flightradar24.com/api/live/flight-positions/full?flight_numbers=${flights}`,
  ]

  let lastError = ''

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Accept-Version': 'v1'
        }
      })
      const text = await res.text()
      if (res.ok) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: text
        }
      }
      lastError = `${url} → ${res.status}: ${text}`
    } catch (err) {
      lastError = err.message
    }
  }

  return {
    statusCode: 502,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: lastError })
  }
}
