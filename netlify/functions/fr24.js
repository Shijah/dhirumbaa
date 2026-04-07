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

  const base = 'https://fr24api.flightradar24.com/api/live/flight-positions/light'
  const urls = [
    base + '?flights=' + flights,
    base + '?callsigns=' + flights,
    base + '?flight_numbers=' + flights,
  ]

  const allData = []
  let isLive = false

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers })
      if (res.ok) {
        const json = await res.json()
        isLive = true
        if (json.data && json.data.length > 0) {
          allData.push(...json.data)
        }
      }
    } catch (err) {}
  }

  if (isLive) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ data: allData, live: true })
    }
  }

  return { statusCode: 502, headers: {'Access-Control-Allow-Origin':'*'}, body: JSON.stringify({ error: 'All endpoints failed' }) }
}
