import type Elysia from 'elysia'
import { db } from '../../database/connection'
import { auth } from '../auth'

export const getManagedRestaurant = (app: Elysia) => {
  app.use(auth).get('/managed-restaurant', async ({ getLoggedInUser }) => {
    const { restaurantId } = await getLoggedInUser()

    if (!restaurantId) {
      throw new Error('User is not a manager.')
    }

    const managedRestaurant = await db.query.restaurantsTable.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, restaurantId)
      },
    })

    return managedRestaurant
  })
}
