import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { ordersTable } from './orders'
import { productsTable } from './products'

export const orderItemsTable = pgTable('order_items', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => ordersTable.id, {
      onDelete: 'cascade',
    }),
  productId: text('product_id').references(() => productsTable.id, {
    onDelete: 'set null',
  }),
  priceInCents: integer('price_in_cents').notNull(),
  quantity: integer('quantity').notNull(),
})

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => {
  return {
    order: one(ordersTable, {
      fields: [orderItemsTable.orderId],
      references: [ordersTable.id],
      relationName: 'order_item_order',
    }),
    product: one(productsTable, {
      fields: [orderItemsTable.productId],
      references: [productsTable.id],
      relationName: 'order_item_product',
    }),
  }
})
