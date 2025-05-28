// Direct test of analytics API
async function testAnalyticsAPI() {
  try {
    const response = await fetch('http://localhost:3333/api/trpc/analytics.issuesByCategory', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('API Response:', JSON.stringify(data, null, 2))
    } else {
      console.log('Error response:', await response.text())
    }
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

testAnalyticsAPI()