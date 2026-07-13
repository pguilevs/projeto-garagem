import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  mileage: integer("mileage").notNull(),
  plate: text("plate").notNull().unique(),
  status: text("status", { enum: ["cadastrado", "disponivel", "reservado", "vendido"] }).notNull().default("cadastrado"),
  damages: text("damages", { mode: "json" }).$type<string[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  photoUrl: text("photo_url"),
  color: text("color").notNull().default("#69706f"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const statusHistory = sqliteTable("status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  previousStatus: text("previous_status"),
  newStatus: text("new_status").notNull(),
  reason: text("reason"),
  changedBy: text("changed_by").notNull().default("administrativo"),
  changedAt: integer("changed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
