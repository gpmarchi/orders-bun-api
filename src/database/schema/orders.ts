import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { orderItemsTable } from './order-items'
import { restaurantsTable } from './restaurants'
import { usersTable } from './users'

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'delivering',
  'delivered',
  'canceled',
])

export const ordersTable = pgTable('orders', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  customerId: text('customer_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  restaurantId: text('restaurant_id')
    .notNull()
    .references(() => restaurantsTable.id, {
      onDelete: 'cascade',
    }),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalInCents: integer('total_in_cents').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const ordersRelations = relations(ordersTable, ({ one, many }) => {
  return {
    customer: one(usersTable, {
      fields: [ordersTable.customerId],
      references: [usersTable.id],
      relationName: 'order_customer',
    }),
    restaurant: one(restaurantsTable, {
      fields: [ordersTable.restaurantId],
      references: [restaurantsTable.id],
      relationName: 'order_restaurant',
    }),
    items: many(orderItemsTable),
  }
})
