import dayjs from 'dayjs'
import { and, count, eq, gte, sql } from 'drizzle-orm'
import type Elysia from 'elysia'
import { db } from '../../database/connection'
import { ordersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getMonthlyCanceledOrdersAmount = (app: Elysia) => {
  app
    .use(auth)
    .get(
      '/metrics/monthly-canceled-orders-amount',
      async ({ getLoggedInUser }) => {
        const { restaurantId } = await getLoggedInUser()

        if (!restaurantId) {
          throw new UnauthorizedError()
        }

        const today = dayjs()
        const lastMonth = today.subtract(1, 'month')
        const startOfLastMonth = lastMonth.startOf('month')

        const ordersPerMonth = await db
          .select({
            monthWithYear: sql`TO_CHAR(${ordersTable.createdAt}, 'YYYY-MM')`,
            amount: count(),
          })
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.restaurantId, restaurantId),
              eq(ordersTable.status, 'canceled'),
              gte(ordersTable.createdAt, startOfLastMonth.toDate())
            )
          )
          .groupBy(sql`TO_CHAR(${ordersTable.createdAt}, 'YYYY-MM')`)

        const currentMonthWithYear = today.format('YYYY-MM')
        const lastMonthWithYear = lastMonth.format('YYYY-MM')

        const currentMonthlyOrdersAmount = ordersPerMonth.find(
          orderPerMonth => {
            return orderPerMonth.monthWithYear === currentMonthWithYear
          }
        )

        const lastMonthlyOrdersAmount = ordersPerMonth.find(orderPerMonth => {
          return orderPerMonth.monthWithYear === lastMonthWithYear
        })

        const diffFromLastMonth =
          currentMonthlyOrdersAmount && lastMonthlyOrdersAmount
            ? (currentMonthlyOrdersAmount.amount * 100) /
              lastMonthlyOrdersAmount.amount
            : null

        return {
          amount: currentMonthlyOrdersAmount?.amount,
          diffFromLastMonth: diffFromLastMonth
            ? Number((diffFromLastMonth - 100).toFixed(2))
            : 0,
        }
      }
    )
}
