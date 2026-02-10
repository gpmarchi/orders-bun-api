import dayjs from 'dayjs'
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm'
import type Elysia from 'elysia'
import z from 'zod'
import { db } from '../../database/connection'
import { ordersTable } from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getDailyRevenueFromPeriod = (app: Elysia) => {
  app.use(auth).get(
    '/metrics/daily-revenue-from-period',
    async ({ getLoggedInUser, query, set }) => {
      const { restaurantId } = await getLoggedInUser()

      if (!restaurantId) {
        throw new UnauthorizedError()
      }

      const { from, to } = query

      const startDate = from ? dayjs(from) : dayjs().subtract(7, 'days')
      const endDate = to ? dayjs(to) : from ? startDate.add(7, 'days') : dayjs()

      if (endDate.diff(startDate, 'days') > 7) {
        set.status = 400

        return {
          message:
            'You cannot have the daily revenue detailed by more than 7 days.',
        }
      }

      const revenuePerDay = await db
        .select({
          date: sql<string>`TO_CHAR(${ordersTable.createdAt}, 'DD/MM')`,
          revenue: sum(ordersTable.totalInCents).mapWith(Number),
        })
        .from(ordersTable)
        .where(
          and(
            eq(ordersTable.restaurantId, restaurantId),
            gte(
              ordersTable.createdAt,
              startDate
                .startOf('day')
                .add(startDate.utcOffset(), 'minutes')
                .toDate()
            ),
            lte(
              ordersTable.createdAt,
              endDate.endOf('day').add(endDate.utcOffset(), 'minutes').toDate()
            )
          )
        )
        .groupBy(sql`TO_CHAR(${ordersTable.createdAt}, 'DD/MM')`)

      const orderedRevenuePerDay = revenuePerDay.sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number)
        const [dayB, monthB] = b.date.split('/').map(Number)

        if (dayA && dayB && monthA && monthB) {
          if (monthA === monthB) {
            return dayA - dayB
          } else {
            const dateA = new Date(2026, monthA - 1)
            const dateB = new Date(2026, monthB - 1)

            return dateA.getTime() - dateB.getTime()
          }
        }

        return 0
      })

      return orderedRevenuePerDay
    },
    {
      query: z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      }),
    }
  )
}
