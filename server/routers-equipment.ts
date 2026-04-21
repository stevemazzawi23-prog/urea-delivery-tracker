import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";

// In-memory storage for equipment (until database tables are created)
interface EquipmentData {
  id: number;
  userId: number;
  name: string;
  capacity?: number;
  createdAt: string;
}

interface ClientEquipmentData {
  clientId: number;
  equipmentIds: number[];
}

// Simple in-memory store
const equipmentStore = new Map<number, EquipmentData>();
const clientEquipmentStore = new Map<number, ClientEquipmentData>();
let nextEquipmentId = 1;

export const equipmentRouter = router({
  // List all equipment for current user
  listEquipment: protectedProcedure.query(({ ctx }) => {
    const userEquipment = Array.from(equipmentStore.values()).filter(
      (eq) => eq.userId === ctx.user.id
    );
    return userEquipment;
  }),

  // Create equipment
  createEquipment: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        capacity: z.number().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const id = nextEquipmentId++;
      const equipment: EquipmentData = {
        id,
        userId: ctx.user.id,
        name: input.name,
        capacity: input.capacity,
        createdAt: new Date().toISOString(),
      };
      equipmentStore.set(id, equipment);
      return equipment;
    }),

  // Delete equipment
  deleteEquipment: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .mutation(({ ctx, input }) => {
      const equipment = equipmentStore.get(input.equipmentId);
      if (!equipment || equipment.userId !== ctx.user.id) {
        throw new Error("Equipment not found or unauthorized");
      }
      equipmentStore.delete(input.equipmentId);

      // Remove from all client associations
      for (const [clientId, data] of clientEquipmentStore.entries()) {
        data.equipmentIds = data.equipmentIds.filter(
          (id) => id !== input.equipmentId
        );
      }

      return { success: true };
    }),

  // Get equipment for a client
  getClientEquipment: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => {
      const clientEquip = clientEquipmentStore.get(input.clientId);
      if (!clientEquip) {
        return [];
      }

      return clientEquip.equipmentIds
        .map((id) => equipmentStore.get(id))
        .filter((eq) => eq !== undefined) as EquipmentData[];
    }),

  // Set equipment for a client
  setClientEquipment: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        equipmentIds: z.array(z.number()),
      })
    )
    .mutation(({ input }) => {
      clientEquipmentStore.set(input.clientId, {
        clientId: input.clientId,
        equipmentIds: input.equipmentIds,
      });
      return { success: true };
    }),
});
