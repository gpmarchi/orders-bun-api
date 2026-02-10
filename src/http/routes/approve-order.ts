import { eq } from 'drizzle-orm'
import type Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { ordersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const approveOrder = (app: Elysia) => {
  app.use(auth).patch(
    'orders/:orderId/approve',
    async ({ getLoggedInUser, set, params }) => {
      const { orderId } = params
      const { restaurantId } = await getLoggedInUser()

      if (!restaurantId) {
        throw new UnauthorizedError()
      }

      const order = await db.query.ordersTable.findFirst({
        where(fields, { eq, and }) {
          return and(
            eq(fields.id, orderId),
            eq(fields.restaurantId, restaurantId)
          )
        },
      })

      if (!order) {
        set.status = 400

        return { message: 'Order not found.' }
      }

      if (order.status !== 'pending') {
        set.status = 400

        return { message: 'You can only approve pending orders.' }
      }

      await db
        .update(ordersTable)
        .set({ status: 'processing' })
        .where(eq(ordersTable.id, orderId))
    },
    {
      params: z.object({
        orderId: z.cuid2(),
      }),
    }
  )
}
