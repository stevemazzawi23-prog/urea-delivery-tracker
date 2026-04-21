import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_CLIENT"
  | "UPDATE_CLIENT"
  | "DELETE_CLIENT"
  | "CREATE_SITE"
  | "UPDATE_SITE"
  | "DELETE_SITE"
  | "START_DELIVERY"
  | "COMPLETE_DELIVERY"
  | "ADD_PHOTO"
  | "CREATE_INVOICE"
  | "CREATE_DRIVER"
  | "UPDATE_DRIVER"
  | "DELETE_DRIVER"
  | "VIEW_INVOICE"
  | "ACCESS_DENIED";

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  status: "success" | "failure";
  errorMessage?: string;
}

const AUDIT_LOGS_KEY = "audit_logs";
const MAX_LOGS = 1000; // Keep last 1000 logs

/**
 * Log an action to the audit trail
 */
export async function logAuditAction(
  userId: string,
  userName: string,
  userRole: string,
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  resourceName?: string,
  details?: Record<string, any>,
  status: "success" | "failure" = "success",
  errorMessage?: string
): Promise<void> {
  try {
    const auditLog: AuditLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId,
      userName,
      userRole,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      status,
      errorMessage,
    };

    // Get existing logs
    const logsJson = await AsyncStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLog[] = logsJson ? JSON.parse(logsJson) : [];

    // Add new log
    logs.push(auditLog);

    // Keep only the last MAX_LOGS entries
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }

    // Save updated logs
    await AsyncStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));

    console.log(`[AUDIT] ${action} by ${userName} (${userRole})`);
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}

/**
 * Get all audit logs
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const logsJson = await AsyncStorage.getItem(AUDIT_LOGS_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return [];
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
  try {
    const logs = await getAuditLogs();
    return logs.filter((log) => log.userId === userId);
  } catch (error) {
    console.error("Failed to get audit logs for user:", error);
    return [];
  }
}

/**
 * Get audit logs for a specific action
 */
export async function getAuditLogsByAction(action: AuditAction): Promise<AuditLog[]> {
  try {
    const logs = await getAuditLogs();
    return logs.filter((log) => log.action === action);
  } catch (error) {
    console.error("Failed to get audit logs for action:", error);
    return [];
  }
}

/**
 * Get audit logs for a date range
 */
export async function getAuditLogsByDateRange(
  startDate: number,
  endDate: number
): Promise<AuditLog[]> {
  try {
    const logs = await getAuditLogs();
    return logs.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate);
  } catch (error) {
    console.error("Failed to get audit logs for date range:", error);
    return [];
  }
}

/**
 * Clear all audit logs (admin only)
 */
export async function clearAuditLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUDIT_LOGS_KEY);
    console.log("[AUDIT] All logs cleared");
  } catch (error) {
    console.error("Failed to clear audit logs:", error);
  }
}

/**
 * Export audit logs as JSON
 */
export async function exportAuditLogs(): Promise<string> {
  try {
    const logs = await getAuditLogs();
    return JSON.stringify(logs, null, 2);
  } catch (error) {
    console.error("Failed to export audit logs:", error);
    return "[]";
  }
}
