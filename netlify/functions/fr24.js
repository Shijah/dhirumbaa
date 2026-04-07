exports.handler = async (event) => {
  const flights = event.queryStringParameters?.flights || ''

  if (!flights) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No flight numbers provided' })
    }
  }

  const apiKey = process.env.FR24_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'FR24_API_KEY not configured in Netlify environment variables' })
    }
  }

  try {
    const res = await fetch(
      `https://fr24api.flightradar24.com/api/live/flight-positions/light?flight_numbers=${flights}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `FR24 API error: ${err}` })
      }
    }

    const data = await res.json()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
