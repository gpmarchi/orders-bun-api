import dayjs from 'dayjs'
import { and, eq, gte, sql, sum } from 'drizzle-orm'
import type Elysia from 'elysia'
import { db } from '../../database/connection'
import { ordersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getMonthlyRevenue = (app: Elysia) => {
  app.use(auth).get('/metrics/monthly-revenue', async ({ getLoggedInUser }) => {
    const { restaurantId } = await getLoggedInUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const today = dayjs()
    const lastMonth = today.subtract(1, 'month')
    const startOfLastMonth = lastMonth.startOf('month')

    const monthlyRevenue = await db
      .select({
        monthWithYear: sql<string>`TO_CHAR(${ordersTable.createdAt}, 'YYYY-MM')`,
        revenue: sum(ordersTable.totalInCents).mapWith(Number),
      })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.restaurantId, restaurantId),
          gte(ordersTable.createdAt, startOfLastMonth.toDate())
        )
      )
      .groupBy(sql`TO_CHAR(${ordersTable.createdAt}, 'YYYY-MM')`)

    const currentMonthWithYear = today.format('YYYY-MM')
    const lastMonthWithYear = lastMonth.format('YYYY-MM')

    const currentMonthlyRevenue = monthlyRevenue.find(revenue => {
      return revenue.monthWithYear === currentMonthWithYear
    })

    const lastMonthlyRevenue = monthlyRevenue.find(revenue => {
      return revenue.monthWithYear === lastMonthWithYear
    })

    const diffFromLastMonth =
      currentMonthlyRevenue && lastMonthlyRevenue
        ? (currentMonthlyRevenue.revenue * 100) / lastMonthlyRevenue.revenue
        : null

    return {
      revenue: currentMonthlyRevenue?.revenue,
      diffFromLastMonth: diffFromLastMonth
        ? Number((diffFromLastMonth - 100).toFixed(2))
        : 0,
    }
  })
}
