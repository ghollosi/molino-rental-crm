import { createTRPCReact } from '@trpc/react-query'
import { type AppRouter } from '@/server/routers/_app'

export const api = createTRPCReact<AppRouter>()
export const trpc = api // Add alias for backward compatibility

export { type RouterInputs, type RouterOutputs } from '@/server/routers/_app'