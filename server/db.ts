import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, sites, deliveries, Client, InsertClient, Site, InsertSite, Delivery, InsertDelivery, invoices, auditLogs, driverAccounts, InsertInvoice, InsertAuditLog, InsertDriverAccount } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CLIENTS ============

export async function getClientsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(clients).where(eq(clients.userId, userId));
}

export async function getClientById(clientId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(clients).where(eq(clients.id, clientId));
  return result[0] || null;
}

export async function createClient(userId: number, data: Omit<InsertClient, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(clients).values({
    ...data,
    userId,
  });
  return (result as any).insertId;
}

export async function updateClient(clientId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(data).where(eq(clients.id, clientId));
}

export async function deleteClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(eq(clients.id, clientId));
}

// ============ SITES ============

export async function getSitesByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(sites).where(eq(sites.clientId, clientId));
}

export async function getSiteById(siteId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(sites).where(eq(sites.id, siteId));
  return result[0] || null;
}

export async function createSite(clientId: number, name: string, address: string | null = null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sites).values({
    clientId,
    name,
    address,
  });
  return (result as any).insertId;
}

export async function updateSite(siteId: number, name?: string, address?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  
  if (Object.keys(updates).length > 0) {
    await db.update(sites).set(updates).where(eq(sites.id, siteId));
  }
}

export async function deleteSite(siteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(sites).where(eq(sites.id, siteId));
}

// ============ DELIVERIES ============

export async function getDeliveriesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(deliveries).where(eq(deliveries.userId, userId));
}

export async function getDeliveryById(deliveryId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId));
  return result[0] || null;
}

export async function createDelivery(userId: number, data: Omit<InsertDelivery, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(deliveries).values({
    ...data,
    userId,
  });
  return (result as any).insertId;
}

export async function updateDelivery(deliveryId: number, data: Partial<InsertDelivery>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(deliveries).set(data).where(eq(deliveries.id, deliveryId));
}

export async function deleteDelivery(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(deliveries).where(eq(deliveries.id, deliveryId));
}

// ============ POD EMAIL ============

export async function getDeliveryWithClientInfo(deliveryId: number) {
  const delivery = await getDeliveryById(deliveryId);
  if (!delivery) return null;
  
  const client = await getClientById(delivery.clientId);
  const site = delivery.siteId ? await getSiteById(delivery.siteId) : null;
  
  return {
    delivery,
    client,
    site,
  };
}

// ============ INVOICES ============

export async function getInvoicesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoices).where(eq(invoices.userId, userId));
}

export async function getInvoicesByDelivery(deliveryId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoices).where(eq(invoices.deliveryId, deliveryId));
}

export async function getInvoiceById(invoiceId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  return result[0] || null;
}

export async function createInvoice(userId: number, data: Omit<InsertInvoice, 'userId' | 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoices).values({
    ...data,
    userId,
  });
  return (result as any).insertId;
}

export async function updateInvoiceStatus(invoiceId: number, status: 'draft' | 'sent' | 'paid') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(invoices).set({ status }).where(eq(invoices.id, invoiceId));
}

export async function deleteInvoice(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(invoices).where(eq(invoices.id, invoiceId));
}

// ============ AUDIT LOGS ============

export async function getAuditLogs(userId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(auditLogs.createdAt).limit(limit);
  }
  
  return db.select().from(auditLogs).orderBy(auditLogs.createdAt).limit(limit);
}

export async function createAuditLog(data: Omit<InsertAuditLog, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create audit log: database not available");
    return;
  }
  
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}

// ============ DRIVER ACCOUNTS ============

export async function getDriverAccountsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(driverAccounts).where(eq(driverAccounts.userId, userId));
}

export async function getDriverAccountByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(driverAccounts).where(eq(driverAccounts.username, username));
  return result[0] || null;
}

export async function createDriverAccount(userId: number, data: Omit<InsertDriverAccount, 'userId' | 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(driverAccounts).values({
    ...data,
    userId,
  });
  return (result as any).insertId;
}

export async function updateDriverAccount(driverAccountId: number, data: Partial<Omit<InsertDriverAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(driverAccounts).set(data).where(eq(driverAccounts.id, driverAccountId));
}

export async function deleteDriverAccount(driverAccountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(driverAccounts).where(eq(driverAccounts.id, driverAccountId));
}
