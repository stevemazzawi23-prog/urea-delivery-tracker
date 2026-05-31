/**
 * db-portal.ts
 * Pont entre l'application mobile SP Logistix et la base de données TiDB Cloud du portail.
 * Ce fichier utilise des requêtes SQL directes pour interagir avec les vraies tables du portail :
 * - clients (id, code, name, userId, ...)
 * - delivery_tickets (id, clientId, ticketNumber, volumeTotal, deliveryDate, startTime, endTime, driverName, siteName, source)
 * - users (id, openId, name, email, loginMethod, role, passwordHash)
 */
import mysql from "mysql2/promise";

let _conn: mysql.Connection | null = null;

async function getConn(): Promise<mysql.Connection> {
  if (_conn) {
    try {
      await _conn.ping();
      return _conn;
    } catch {
      _conn = null;
    }
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  _conn = await mysql.createConnection(url);
  return _conn;
}

// ============ USERS / AUTH ============

export async function getUserByUsername(username: string) {
  const conn = await getConn();
  const [rows] = await conn.query(
    "SELECT * FROM users WHERE name = ? LIMIT 1",
    [username]
  ) as [any[], any];
  return rows[0] || null;
}

export async function getUserByOpenId(openId: string) {
  const conn = await getConn();
  const [rows] = await conn.query(
    "SELECT * FROM users WHERE openId = ? LIMIT 1",
    [openId]
  ) as [any[], any];
  return rows[0] || null;
}

export async function upsertPortalUser(data: {
  openId: string;
  name: string;
  email: string | null;
  loginMethod: string;
  role: string;
  passwordHash?: string;
}) {
  const conn = await getConn();
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await conn.query(
      "UPDATE users SET lastSignedIn = NOW() WHERE openId = ?",
      [data.openId]
    );
    return existing;
  }
  await conn.query(
    `INSERT INTO users (openId, name, email, loginMethod, role, passwordHash, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [data.openId, data.name, data.email, data.loginMethod, data.role, data.passwordHash || null]
  );
  return getUserByOpenId(data.openId);
}

// ============ CLIENTS ============

export async function getPortalClients() {
  const conn = await getConn();
  const [rows] = await conn.query(
    "SELECT id, code, name, address, city, province, postalCode FROM clients ORDER BY name ASC"
  ) as [any[], any];
  return rows;
}

export async function getPortalClientById(clientId: number) {
  const conn = await getConn();
  const [rows] = await conn.query(
    "SELECT id, code, name, address, city, province, postalCode FROM clients WHERE id = ? LIMIT 1",
    [clientId]
  ) as [any[], any];
  return rows[0] || null;
}

// ============ DELIVERY TICKETS ============

export async function getPortalDeliveries() {
  const conn = await getConn();
  const [rows] = await conn.query(
    `SELECT dt.*, c.name as clientName, c.code as clientCode
     FROM delivery_tickets dt
     LEFT JOIN clients c ON dt.clientId = c.id
     WHERE dt.source = 'mobile'
     ORDER BY dt.deliveryDate DESC`
  ) as [any[], any];
  return rows;
}

export async function getPortalDeliveryById(id: number) {
  const conn = await getConn();
  const [rows] = await conn.query(
    `SELECT dt.*, c.name as clientName, c.code as clientCode
     FROM delivery_tickets dt
     LEFT JOIN clients c ON dt.clientId = c.id
     WHERE dt.id = ? LIMIT 1`,
    [id]
  ) as [any[], any];
  return rows[0] || null;
}

export async function createPortalDelivery(data: {
  clientId: number;
  clientName: string;
  siteName?: string | null;
  driverName?: string | null;
  startTime: Date;
  endTime?: Date | null;
  litersDelivered?: number;
}) {
  const conn = await getConn();
  // Generate ticket number: MOB-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  const ticketNumber = `MOB-${dateStr}-${rand}`;

  const deliveryDate = data.startTime || now;
  const volumeTotal = data.litersDelivered || 0;

  const [result] = await conn.query(
    `INSERT INTO delivery_tickets
     (clientId, ticketNumber, volumeTotal, volumeTotalDef, deliveryDate, startTime, endTime, driverName, siteName, source, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'mobile', NOW())`,
    [
      data.clientId,
      ticketNumber,
      volumeTotal,
      volumeTotal,
      deliveryDate,
      data.startTime || null,
      data.endTime || null,
      data.driverName || null,
      data.siteName || null,
    ]
  ) as [any, any];

  return { id: (result as any).insertId, ticketNumber };
}

export async function updatePortalDelivery(id: number, data: {
  endTime?: Date | null;
  litersDelivered?: number;
  driverName?: string | null;
}) {
  const conn = await getConn();
  const sets: string[] = [];
  const values: any[] = [];

  if (data.endTime !== undefined) {
    sets.push("endTime = ?");
    values.push(data.endTime);
  }
  if (data.litersDelivered !== undefined) {
    sets.push("volumeTotal = ?");
    values.push(data.litersDelivered);
    sets.push("volumeTotalDef = ?");
    values.push(data.litersDelivered);
  }
  if (data.driverName !== undefined) {
    sets.push("driverName = ?");
    values.push(data.driverName);
  }

  if (sets.length === 0) return;
  values.push(id);
  await conn.query(`UPDATE delivery_tickets SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deletePortalDelivery(id: number) {
  const conn = await getConn();
  await conn.query("DELETE FROM delivery_tickets WHERE id = ? AND source = 'mobile'", [id]);
}
