exports.handler = async (event) => {
  const flights = event.queryStringParameters?.flights || ''
  if (!flights) return { statusCode: 400, body: JSON.stringify({ error: 'No flights' }) }

  const apiKey = process.env.FR24_API_KEY
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'No API key' }) }

  const url = https://fr24api.flightradar24.com/api/live/flight-positions/light?flight_numbers= + flights

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Accept': 'application/json',
        'Accept-Version': 'v1'
      }
    })
    const text = await res.text()
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: text
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
