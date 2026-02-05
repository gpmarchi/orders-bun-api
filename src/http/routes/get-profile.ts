import Elysia from 'elysia'
import { db } from '../../database/connection'
import { auth } from '../auth'

export const getProfile = new Elysia()
  .use(auth)
  .get('/me', async ({ getLoggedInUser }) => {
    const { userId } = await getLoggedInUser()

    const user = await db.query.usersTable.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, userId)
      },
    })

    if (!user){
      throw new Error('User not found.')
    }

    return user
  })
