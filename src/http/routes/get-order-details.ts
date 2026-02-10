import type Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getOrderDetails = (app: Elysia) => {
  app.use(auth).get(
    '/orders/:orderId',
    async ({ getLoggedInUser, params, set }) => {
      const { orderId } = params
      const { restaurantId } = await getLoggedInUser()

      if (!restaurantId) {
        throw new UnauthorizedError()
      }

      const order = await db.query.ordersTable.findFirst({
        columns: {
          id: true,
          status: true,
          totalInCents: true,
          createdAt: true,
        },
        with: {
          customer: {
            columns: {
              name: true,
              phone: true,
              email: true,
            },
          },
          items: {
            columns: {
              id: true,
              priceInCents: true,
              quantity: true,
            },
            with: {
              product: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
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

      return order
    },
    {
      params: z.object({
        orderId: z.cuid2(),
      }),
    }
  )
}
