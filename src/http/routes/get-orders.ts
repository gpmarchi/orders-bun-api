import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import type Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { ordersTable, usersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

const statusEnumValidationSchema = createSelectSchema(ordersTable).pick({
  status: true,
}).shape.status

export const getOrders = (app: Elysia) => {
  app.use(auth).get(
    '/orders',
    async ({ getLoggedInUser, query }) => {
      const { restaurantId } = await getLoggedInUser()
      const { customerName, orderId, status, pageIndex } = query

      if (!restaurantId) {
        throw new UnauthorizedError()
      }

      // const orderTableColumns = getTableColumns(ordersTable)

      const baseQuery = db
        .select({
          orderId: ordersTable.id,
          createdAt: ordersTable.createdAt,
          status: ordersTable.status,
          total: ordersTable.totalInCents,
          customerName: usersTable.name,
        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(usersTable.id, ordersTable.customerId))
        .where(
          and(
            eq(ordersTable.restaurantId, restaurantId),
            orderId ? ilike(ordersTable.id, `%${orderId}%`) : undefined,
            status ? eq(ordersTable.status, status) : undefined,
            customerName
              ? ilike(usersTable.name, `%${customerName}%`)
              : undefined
          )
        )

      const [totalOrdersQuery, fetchedOrders] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        db
          .select()
          .from(baseQuery.as('baseQuery'))
          .offset(pageIndex * 10)
          .limit(10)
          .orderBy(fields => {
            return [
              sql`CASE ${fields.status}
              WHEN 'pending' THEN 1
              WHEN 'processing' THEN 2
              WHEN 'delivering' THEN 3
              WHEN 'delivered' THEN 4
              WHEN 'canceled' THEN 99
            END`,
              desc(fields.createdAt),
            ]
          }),
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
}
