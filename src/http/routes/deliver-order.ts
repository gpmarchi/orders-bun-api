import { eq } from 'drizzle-orm'
import Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { ordersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const deliverOrder = new Elysia().use(auth).patch(
  'orders/:orderId/deliver',
  async ({ getLoggedInUser, set, params }) => {
    const { orderId } = params
    const { restaurantId } = await getLoggedInUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const order = await db.query.ordersTable.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, orderId)
      },
    })

    if (!order) {
      set.status = 400

      return { message: 'Order not found.' }
    }

    if (order.status !== 'delivering') {
      set.status = 400

      return {
        message:
          'You cannot deliver orders that are not in "delivering" status.',
      }
    }

    await db
      .update(ordersTable)
      .set({ status: 'delivered' })
      .where(eq(ordersTable.id, orderId))
  },
  {
    params: z.object({
      orderId: z.cuid2(),
    }),
  }
)
