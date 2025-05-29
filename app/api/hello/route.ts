export async function GET() {
  return Response.json({ 
    message: 'Hello from Vercel!',
    timestamp: new Date().toISOString(),
    version: 'v1'
  })
}