import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { ordersTable } from './orders'
import { productsTable } from './products'
import { usersTable } from './users'

export const restaurantsTable = pgTable('restaurants', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  managerId: text('manager_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const restaurantsRelations = relations(
  restaurantsTable,
  ({ one, many }) => {
    return {
      manager: one(usersTable, {
        fields: [restaurantsTable.managerId],
        references: [usersTable.id],
        relationName: 'restaurant_manager',
      }),
      orders: many(ordersTable),
      products: many(productsTable),
    }
  }
)
