import jwt from '@elysiajs/jwt'
import Elysia, { type Static, t } from 'elysia'
import { env } from '../env'

const jwtPayloadSchema = t.Object({
  sub: t.String(),
  restaurantId: t.Optional(t.String()),
})

export const auth = new Elysia().use(
  jwt({
    secret: env.JWT_SECRET_KEY,
    schema: jwtPayloadSchema,
  }).derive({ as: 'global' }, ({ jwt, cookie: { authCookie } }) => {
    if (!authCookie) {
      throw new Error('Auth cookie is not available in this context.')
    }

    return {
      signIn: async (payload: Static<typeof jwtPayloadSchema>) => {
        const token = await jwt.sign(payload)

        authCookie.value = token
        authCookie.httpOnly = true
        authCookie.maxAge = 60 * 60 * 24 * 7 // 7 days
        authCookie.path = '/'
      },

      signOut: () => {
        authCookie.remove()
      },
    }
  })
)
