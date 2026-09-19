import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const coaches = pgTable(
  'coaches',
  {
    id: text('id').primaryKey(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    phone: varchar('phone', { length: 30 }).notNull(),
    address: text('address').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    profilePhotoKey: text('profile_photo_key'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('coaches_status_idx').on(table.status),
    index('coaches_full_name_idx').on(table.fullName),
  ],
)

export type Coach = typeof coaches.$inferSelect
export type NewCoach = typeof coaches.$inferInsert
