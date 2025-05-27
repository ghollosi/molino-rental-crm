import { TRPCError, initTRPC } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type Session } from 'next-auth'
// import { auth } from '@/auth' // Ideiglenesen kikommentelve
import { db } from '@/lib/db'
import superjson from 'superjson'
import { ZodError } from 'zod'

type CreateContextOptions = {
  session: Session | null
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
  }
}

export const createTRPCContext = async (opts: { req?: Request }) => {
  // Ideiglenesen mock session, amíg az auth probléma megoldódik
  const session = {
    user: {
      id: '1',
      email: 'admin@molino.com',
      name: 'Admin User',
      role: 'ADMIN',
      language: 'HU'
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  } as Session

  return createInnerTRPCContext({
    session,
  })
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)