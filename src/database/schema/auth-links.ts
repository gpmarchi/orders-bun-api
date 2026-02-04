import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { usersTable } from './users'

export const authLinksTable = pgTable('auth_links', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  code: text('code').notNull().unique(),
  userId: text('user_id')
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
