import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Clients table
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  email: varchar("email", { length: 320 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// Sites table
export const sites = mysqlTable("sites", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

// Delivery Units table - stores individual units for each delivery
export const deliveryUnits = mysqlTable("deliveryUnits", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  unitName: varchar("unitName", { length: 255 }).notNull(),
  liters: int("liters").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliveryUnit = typeof deliveryUnits.$inferSelect;
export type InsertDeliveryUnit = typeof deliveryUnits.$inferInsert;

// Deliveries table
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientCompany: varchar("clientCompany", { length: 255 }),
  siteId: int("siteId"),
  siteName: varchar("siteName", { length: 255 }),
  driverName: varchar("driverName", { length: 255 }),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  litersDelivered: int("litersDelivered").default(0).notNull(),
  photos: json("photos").$type<string[]>().default([]).notNull(), // Array of photo URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

// Invoices table
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  clientId: int("clientId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientAddress: text("clientAddress"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  invoiceDate: timestamp("invoiceDate").notNull(),
  serviceFee: int("serviceFee").default(0).notNull(),
  pricePerLiter: int("pricePerLiter").default(200).notNull(), // Stored as cents (200 = $2.00)
  litersDelivered: int("litersDelivered").notNull(),
  subtotal: int("subtotal").notNull(), // Stored as cents
  gst: int("gst").notNull(), // Stored as cents
  qst: int("qst").notNull(), // Stored as cents
  total: int("total").notNull(), // Stored as cents
  status: mysqlEnum("status", ["draft", "sent", "paid"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// Audit Logs table
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(), // e.g., "CREATE_CLIENT", "UPDATE_DELIVERY"
  entityType: varchar("entityType", { length: 50 }).notNull(), // e.g., "CLIENT", "DELIVERY"
  entityId: varchar("entityId", { length: 50 }),
  details: json("details").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Driver Accounts table (for admin to manage)
export const driverAccounts = mysqlTable("driverAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Admin who created this driver
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["driver", "admin"]).default("driver").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverAccount = typeof driverAccounts.$inferSelect;
export type InsertDriverAccount = typeof driverAccounts.$inferInsert;
