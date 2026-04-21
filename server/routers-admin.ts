import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

export const adminRouter = router({
  // ============ AUDIT LOGS ============
  
  // Get audit logs (admin only)
  listAuditLogs: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      // Only allow admins to view all logs, users can only view their own
      if (ctx.user.role !== "admin" && input.userId && input.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      
      return db.getAuditLogs(input.userId, input.limit);
    }),

  // Create audit log entry
  createAuditLog: protectedProcedure
    .input(z.object({
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().optional(),
      details: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.createAuditLog({
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details || {},
      });
      return { success: true };
    }),

  // ============ DRIVER ACCOUNTS ============
  
  // Get all driver accounts for current admin user
  listDriverAccounts: protectedProcedure.query(({ ctx }) => {
    return db.getDriverAccountsByUser(ctx.user.id);
  }),

  // Create driver account
  createDriverAccount: protectedProcedure
    .input(z.object({
      username: z.string().min(3),
      passwordHash: z.string(),
      role: z.enum(["driver", "admin"]).default("driver"),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createDriverAccount(ctx.user.id, {
        username: input.username,
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: true,
      });
      return { id: result };
    }),

  // Update driver account
  updateDriverAccount: protectedProcedure
    .input(z.object({
      driverAccountId: z.number(),
      username: z.string().optional(),
      passwordHash: z.string().optional(),
      role: z.enum(["driver", "admin"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateDriverAccount(input.driverAccountId, {
        username: input.username,
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: input.isActive,
      });
      return { success: true };
    }),

  // Delete driver account
  deleteDriverAccount: protectedProcedure
    .input(z.object({ driverAccountId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteDriverAccount(input.driverAccountId);
      return { success: true };
    }),

  // Get driver account by username (for login)
  getDriverByUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(({ input }) => {
      return db.getDriverAccountByUsername(input.username);
    }),
});
