import { Prisma } from "@prisma/client";
import { prisma } from "./db";

// ─── Audit Log Helper ─────────────────────────────────────────
// Records every significant state change for compliance and debugging.
// This satisfies the academic requirement for DBMS audit trail.
// Records: table, record_id, action (INSERT/UPDATE/DELETE),
//          who changed it, old data snapshot, new data snapshot.
//
// The AuditLog table uses DELETE RESTRICT semantics — records are NEVER deleted.

export async function logAudit(
  tableName: string,
  recordId: number,
  action: "INSERT" | "UPDATE" | "DELETE",
  changedBy: number | null,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        table_name: tableName,
        record_id: recordId,
        action,
        changed_by: changedBy,
        old_data: oldData ? (oldData as Prisma.InputJsonValue) : undefined,
        new_data: newData ? (newData as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    // Audit log failures should not break the main flow — log to console only
    console.error("[AuditLog] Failed to write audit entry:", error);
  }
}
