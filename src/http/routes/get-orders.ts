import { and, count, eq, getTableColumns, ilike } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { ordersTable, usersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

const statusEnumValidationSchema = createSelectSchema(ordersTable).pick({
  status: true,
}).shape.status

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getLoggedInUser, query }) => {
    const { restaurantId } = await getLoggedInUser()
    const { customerName, orderId, status, pageIndex } = query

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const orderTableColumns = getTableColumns(ordersTable)

    const baseQuery = db
      .select(orderTableColumns)
      .from(ordersTable)
      .innerJoin(usersTable, eq(usersTable.id, ordersTable.customerId))
      .where(
        and(
          eq(ordersTable.restaurantId, restaurantId),
          orderId ? ilike(ordersTable.id, `%${orderId}%`) : undefined,
          status ? eq(ordersTable.status, status) : undefined,
          customerName ? ilike(usersTable.name, `%${customerName}%`) : undefined
        )
      )

    const [totalOrdersQuery, fetchedOrders] = await Promise.all([
      db.select({ count: count() }).from(baseQuery.as('baseQuery')),
      db
        .select()
        .from(baseQuery.as('baseQuery'))
        .offset(pageIndex * 10)
        .limit(10),
    ])

    const totalOrders = totalOrdersQuery[0]?.count

    return {
      orders: fetchedOrders,
      meta: {
        pageIndex,
        perPage: 10,
        totalCount: totalOrders,
      },
    }
  },
  {
    query: z.object({
      customerName: z.string().optional(),
      orderId: z.string().optional(),
      status: statusEnumValidationSchema.optional(),
      pageIndex: z.coerce.number().min(0),
    }),
  }
)
