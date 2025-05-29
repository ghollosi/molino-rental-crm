import { NextResponse } from 'next/server'
import { ownerRouter } from '@/server/routers/owner'

export async function GET() {
  // Get the input schema for quickCreate
  const quickCreateProcedure = ownerRouter._def.procedures.quickCreate
  const inputSchema = quickCreateProcedure._def.inputs[0]
  
  return NextResponse.json({
    endpoints: Object.keys(ownerRouter._def.procedures),
    quickCreateInputs: inputSchema ? inputSchema._def.shape : 'No schema found',
  })
}