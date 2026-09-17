import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

// Admins Table — Single administrator storage
export const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

//  * Sessions Table — Server-side session tracking
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // 64-hex cryptographic token
  adminId: text('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type Admin = typeof admins.$inferSelect
export type NewAdmin = typeof admins.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
