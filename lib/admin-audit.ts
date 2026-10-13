import { createSupabaseServiceClient } from '@/lib/supabase-service'

export type AdminAuditAction =
  | 'user_role_changed'
  | 'user_status_changed'
  | 'gateway_secrets_saved'

/** Persist an admin audit entry (never store raw secrets). */
export async function recordAdminAudit(params: {
  actorId: string
  action: AdminAuditAction
  targetUserId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const service = createSupabaseServiceClient()
    const { error } = await service.from('admin_audit_log').insert({
      actor_id: params.actorId,
      action: params.action,
      target_user_id: params.targetUserId ?? null,
      metadata: params.metadata ?? {},
    })

    if (error) {
      // Table may not exist until migration is run — do not block the admin action.
      console.error('admin_audit_log insert failed:', error.message)
    }
  } catch (err) {
    console.error('admin_audit_log insert error:', err)
  }
}
