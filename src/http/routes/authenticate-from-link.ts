import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { authLinksTable } from '../../database/schema'
import { auth } from '../auth'

export const authenticateFromLink = new Elysia().use(auth).get(
  '/auth-links/authenticate',
  async ({ query, signIn, redirect }) => {
    const { code, redirect: redirectUrl } = query

    const authLinkFromCode = await db.query.authLinksTable.findFirst({
      where(fields, { eq }) {
        return eq(fields.code, code)
      },
    })

    if (!authLinkFromCode) {
      throw new Error('Auth link not found.')
    }

    const daysSinceAuthLinkCreation = dayjs().diff(
      authLinkFromCode.createdAt,
      'days'
    )

    if (daysSinceAuthLinkCreation > 7) {
      throw new Error('Auth link expired, please generate a new one.')
    }

    const managedRestaurant = await db.query.restaurantsTable.findFirst({
      where(fields, { eq }) {
        return eq(fields.managerId, authLinkFromCode.userId)
      },
    })

    await signIn({
      sub: authLinkFromCode.userId,
      restaurantId: managedRestaurant?.id,
    })

    await db.delete(authLinksTable).where(eq(authLinksTable.code, code))

    return redirect(redirectUrl)
  },
  {
    query: z.object({
      code: z.string(),
      redirect: z.url(),
    }),
  }
)
