import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

/**
 * Players Table — SSB MUNDINGLAYA
 *
 * NOTE: As required by PRD Section 6.1:
 * KU (Kelompok Usia), birth_year, or age_group MUST NOT be stored in the database.
 * They are derived dynamically from `date_of_birth` at the application layer.
 */
export const players = pgTable(
  'players',
  {
    id: text('id').primaryKey(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    placeOfBirth: varchar('place_of_birth', { length: 100 }).notNull(),
    dateOfBirth: date('date_of_birth').notNull(),
    address: text('address').notNull(),
    playingPosition: varchar('playing_position', { length: 50 }).notNull(),
    parentName: varchar('parent_name', { length: 150 }).notNull(),
    parentPhone: varchar('parent_phone', { length: 30 }).notNull(),
    joinDate: date('join_date'),
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
    index('players_status_idx').on(table.status),
    index('players_full_name_idx').on(table.fullName),
    index('players_date_of_birth_idx').on(table.dateOfBirth),
  ],
)

export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
