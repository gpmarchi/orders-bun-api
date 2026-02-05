import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { ordersTable } from './orders'
import { restaurantsTable } from './restaurants'

export const userRoleEnum = pgEnum('user_role', ['manager', 'customer'])

export const usersTable = pgTable('users', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  role: userRoleEnum('role').default('customer').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const usersRelations = relations(usersTable, ({ one, many }) => {
  return {
    managedRestaurant: one(restaurantsTable, {
      fields: [usersTable.id],
      references: [restaurantsTable.managerId],
      relationName: 'managed_restaurant',
    }),
    orders: many(ordersTable),
  }
})
