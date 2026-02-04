import Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { restaurantsTable, usersTable } from '../../database/schema'

export const registerRestaurant = new Elysia().post(
  '/restaurants',
  async ({ body, set }) => {
    const { restaurantName, managerName, email, phone } = body

    const [manager] = await db
      .insert(usersTable)
      .values({
        name: managerName,
        email,
        phone,
        role: 'manager',
      })
      .returning({
        id: usersTable.id,
      })

    await db.insert(restaurantsTable).values({
      name: restaurantName,
      managerId: manager?.id,
    })

    set.status = 204
  },
  {
    body: z.object({
      restaurantName: z.string(),
      managerName: z.string(),
      email: z.email(),
      phone: z.string(),
    }),
  }
)
