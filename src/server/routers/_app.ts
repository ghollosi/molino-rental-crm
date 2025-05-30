import { createTRPCRouter } from '../trpc'
import { authRouter } from './auth'
import { userRouter } from './user'
import { propertyRouter } from './property'
import { ownerRouter } from './owner'
import { tenantRouter } from './tenant'
import { providerRouter } from './provider'
import { issueRouter } from './issue'
import { offerRouter } from './offer'
import { contractRouter } from './contract'
import { analyticsRouter } from './analytics'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  property: propertyRouter,
  owner: ownerRouter,
  tenant: tenantRouter,
  provider: providerRouter,
  issue: issueRouter,
  offer: offerRouter,
  contract: contractRouter,
  analytics: analyticsRouter,
})

export type AppRouter = typeof appRouter

export type RouterInputs = {
  [K in keyof AppRouter]: AppRouter[K] extends { _def: { inputs: infer T } } ? T : never
}

export type RouterOutputs = {
  [K in keyof AppRouter]: AppRouter[K] extends { _def: { outputs: infer T } } ? T : never
}