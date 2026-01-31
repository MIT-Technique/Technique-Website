import { createAdminClient } from "./supabase/admin";

// Helper function to create a log entry
export async function createLog(
  actorId: string,
  actionType: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown>
) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("admin_logs").insert({
    actor_id: actorId,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    details,
  });

  if (error) {
    console.error("Error creating log:", error);
  }
}
