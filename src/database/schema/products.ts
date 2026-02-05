import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { orderItemsTable } from './order-items'
import { restaurantsTable } from './restaurants'

export const productsTable = pgTable('products', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  priceInCents: integer('price_in_cents').notNull(),
  restaurantId: text('restaurant_id')
    .notNull()
    .references(() => restaurantsTable.id, {
      onDelete: 'cascade',
    }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const productsRelations = relations(productsTable, ({ one, many }) => {
  return {
    restaurant: one(restaurantsTable, {
      fields: [productsTable.restaurantId],
      references: [restaurantsTable.id],
      relationName: 'product_restaurant',
    }),
    items: many(orderItemsTable),
  }
})
