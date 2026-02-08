import { desc, eq, sum } from 'drizzle-orm'
import Elysia from 'elysia'
import { db } from '../../database/connection'
import {
  orderItemsTable,
  ordersTable,
  productsTable,
} from '../../database/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getPopularProducts = new Elysia()
  .use(auth)
  .get('/metrics/popular-products', async ({ getLoggedInUser }) => {
    const { restaurantId } = await getLoggedInUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const popularProducts = await db
      .select({
        product: productsTable.name,
        amount: sum(orderItemsTable.quantity).mapWith(Number),
      })
      .from(orderItemsTable)
      .leftJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
      .leftJoin(productsTable, eq(productsTable.id, orderItemsTable.productId))
      .where(eq(ordersTable.restaurantId, restaurantId))
      .groupBy(productsTable.name)
      .orderBy(fields => {
        return desc(fields.amount)
      })
      .limit(5)

    return popularProducts
  })
