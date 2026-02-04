import { createId } from '@paralleldrive/cuid2'
import Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { authLinksTable } from '../../database/schema'
import { env } from '../../env'

export const sendAuthLink = new Elysia().post(
  '/authenticate',
  async ({ body }) => {
    const { email } = body

    // const [userFromEmail] = await db
    //   .select()
    //   .from(usersTable)
    //   .where(eq(usersTable.email, email))

    const userFromEmail = await db.query.usersTable.findFirst({
      where(fields, { eq }) {
        return eq(fields.email, email)
      },
    })

    if (!userFromEmail) {
      throw new Error('User not found.')
    }

    const authLinkCode = createId()

    await db.insert(authLinksTable).values({
      userId: userFromEmail.id,
      code: authLinkCode,
    })

    // TODO: Send email with the link containing the code

    const authLink = new URL('/auth-links/authenticate', env.API_BASE_URL)

    authLink.searchParams.set('code', authLinkCode)
    authLink.searchParams.set('redirect', env.AUTH_REDIRECT_URL)

    console.log(authLink.toString())
  },
  {
    body: z.object({
      email: z.email(),
    }),
  }
)
