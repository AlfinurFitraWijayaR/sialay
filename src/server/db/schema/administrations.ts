import { relations } from 'drizzle-orm'
import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { players } from './players'

export const administrations = pgTable(
  'administrations',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' })
      .unique(),
    // 4 Berkas Wajib Masuk SSB: 'ada' | 'belum_ada'
    registrationForm: varchar('registration_form', { length: 20 })
      .notNull()
      .default('belum_ada'),
    familyCard: varchar('family_card', { length: 20 })
      .notNull()
      .default('belum_ada'),
    birthCertificate: varchar('birth_certificate', { length: 20 })
      .notNull()
      .default('belum_ada'),
    pasPhoto: varchar('pas_photo', { length: 20 })
      .notNull()
      .default('belum_ada'),
    // Status Kelengkapan: 'lengkap' | 'belum_lengkap'
    status: varchar('status', { length: 20 })
      .notNull()
      .default('belum_lengkap'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('administrations_player_id_idx').on(table.playerId),
    index('administrations_status_idx').on(table.status),
  ],
)

// Relasi Drizzle ORM
export const administrationsRelations = relations(
  administrations,
  ({ one }) => ({
    player: one(players, {
      fields: [administrations.playerId],
      references: [players.id],
    }),
  }),
)

export const playersRelations = relations(players, ({ one }) => ({
  administration: one(administrations, {
    fields: [players.id],
    references: [administrations.playerId],
  }),
}))

export type AdministrationDocStatus = 'ada' | 'belum_ada'
export type AdministrationStatus = 'lengkap' | 'belum_lengkap'
export type Administration = typeof administrations.$inferSelect
export type NewAdministration = typeof administrations.$inferInsert
