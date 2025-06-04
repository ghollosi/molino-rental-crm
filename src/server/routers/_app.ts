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
import { contractTemplateRouter } from './contractTemplate'
import { analyticsRouter } from './analytics'
import { providerMatchingRouter } from './provider-matching'
import { providerRatingRouter } from './provider-rating'
import { financialForecastingRouter } from './financial-forecasting'
import { companyRouter } from './company'
import { zohoRouter } from './zoho'
import { caixabankRouter } from './caixabank'
import { whatsappRouter } from './whatsapp'
import { bookingRouter } from './booking'
import { reconciliationRouter } from './reconciliation'
import { integrationConfigRouter } from './integrationConfig'
import { aiPricingRouter } from './ai-pricing'
import { smartLockRouter } from './smart-lock'

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
  contractTemplate: contractTemplateRouter,
  analytics: analyticsRouter,
  providerMatching: providerMatchingRouter,
  providerRating: providerRatingRouter,
  financialForecasting: financialForecastingRouter,
  company: companyRouter,
  zoho: zohoRouter,
  caixabank: caixabankRouter,
  whatsapp: whatsappRouter,
  booking: bookingRouter,
  reconciliation: reconciliationRouter,
  integrationConfig: integrationConfigRouter,
  aiPricing: aiPricingRouter,
  smartLock: smartLockRouter,
})

export type AppRouter = typeof appRouter

export type RouterInputs = {
  [K in keyof AppRouter]: AppRouter[K] extends { _def: { inputs: infer T } } ? T : never
}

export type RouterOutputs = {
  [K in keyof AppRouter]: AppRouter[K] extends { _def: { outputs: infer T } } ? T : never
}