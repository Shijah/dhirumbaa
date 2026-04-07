exports.handler = async (event) => {
  const flights = event.queryStringParameters?.flights || ''
  if (!flights) return { statusCode: 400, headers: {'Access-Control-Allow-Origin':'*'}, body: JSON.stringify({ error: 'No flights' }) }

  const apiKey = process.env.FR24_API_KEY
  if (!apiKey) return { statusCode: 500, headers: {'Access-Control-Allow-Origin':'*'}, body: JSON.stringify({ error: 'No API key' }) }

  const headers = {
    'Authorization': 'Bearer ' + apiKey,
    'Accept': 'application/json',
    'Accept-Version': 'v1'
  }

  const urls = [
    'https://fr24api.flightradar24.com/api/live/flight-positions/light?callsigns=' + flights,
    'https://fr24api.flightradar24.com/api/live/flight-positions/light?flights=' + flights,
    'https://fr24api.flightradar24.com/api/live/flight-positions/light?flight_numbers=' + flights,
  ]

  const results = []
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers })
      const text = await res.text()
      results.push({ url, status: res.status, body: text })
      if (res.ok) return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: text }
    } catch (err) {
      results.push({ url, error: err.message })
    }
  }

  return { statusCode: 502, headers: {'Access-Control-Allow-Origin':'*'}, body: JSON.stringify({ tried: results }) }
}
