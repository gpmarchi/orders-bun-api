import dayjs from 'dayjs'
import { and, count, eq, gte, sql } from 'drizzle-orm'
import type Elysia from 'elysia'
import { db } from '../../database/connection'
import { ordersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getDayTotalOrdersAmount = (app: Elysia) => {
  app
    .use(auth)
    .get('/metrics/day-total-orders-amount', async ({ getLoggedInUser }) => {
      const { restaurantId } = await getLoggedInUser()

      if (!restaurantId) {
        throw new UnauthorizedError()
      }

      const today = dayjs()
      const yesterday = today.subtract(1, 'day')
      const startOfYesterday = yesterday.startOf('day')

      const ordersPerDay = await db
        .select({
          dayWithMonthAndYear: sql`TO_CHAR(${ordersTable.createdAt}, 'YYYY-MM-DD')`,
          amount: count(),
        })
        .from(ordersTable)
        .where(
          and(
            eq(ordersTable.restaurantId, restaurantId),
            gte(ordersTable.createdAt, startOfYesterday.toDate())
          )
        )
        .groupBy(sql`TO_CHAR(${ordersTable.createdAt}, 'YYYY-MM-DD')`)

      const todayWithMonthAndYear = today.format('YYYY-MM-DD')
      const yesterdayWithMonthAndYear = yesterday.format('YYYY-MM-DD')

      const todayOrdersAmount = ordersPerDay.find(orderPerDay => {
        return orderPerDay.dayWithMonthAndYear === todayWithMonthAndYear
      })

      const yesterdayOrdersAmount = ordersPerDay.find(orderPerDay => {
        return orderPerDay.dayWithMonthAndYear === yesterdayWithMonthAndYear
      })

      const diffFromYesterday =
        todayOrdersAmount && yesterdayOrdersAmount
          ? (todayOrdersAmount.amount * 100) / yesterdayOrdersAmount.amount
          : null

      return {
        amount: todayOrdersAmount?.amount,
        diffFromYesterday: diffFromYesterday
          ? Number((diffFromYesterday - 100).toFixed(2))
          : 0,
      }
    })
}
