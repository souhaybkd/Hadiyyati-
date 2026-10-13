'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminAuditLog, type AdminAuditLogEntry } from '@/lib/actions/admin'
import { Loader2, ScrollText } from 'lucide-react'

function describeEntry(entry: AdminAuditLogEntry): string {
  const actor = entry.actor_name || entry.actor_email || entry.actor_id.slice(0, 8)
  const target = entry.target_name || entry.target_email

  switch (entry.action) {
    case 'user_role_changed': {
      const meta = entry.metadata
      const from = meta.previousRole ?? '?'
      const to = meta.newRole ?? '?'
      return `${actor} changed role for ${target || 'user'} (${from} → ${to})`
    }
    case 'user_status_changed': {
      const meta = entry.metadata
      const from = meta.previousStatus ?? '?'
      const to = meta.newStatus ?? '?'
      if (to === 'banned') {
        return `${actor} banned ${target || 'user'}`
      }
      if (from === 'banned' && to === 'active') {
        return `${actor} unbanned ${target || 'user'}`
      }
      return `${actor} set status for ${target || 'user'} (${from} → ${to})`
    }
    case 'gateway_secrets_saved': {
      const gateway = entry.metadata.gateway ?? 'gateway'
      const fields = Array.isArray(entry.metadata.fieldsChanged)
        ? (entry.metadata.fieldsChanged as string[]).join(', ')
        : 'secrets'
      return `${actor} updated ${gateway} credentials (${fields})`
    }
    default:
      return `${actor}: ${entry.action}`
  }
}

export function AdminAuditLog() {
  const [entries, setEntries] = useState<AdminAuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getAdminAuditLog(40)
      if (result.error) {
        setError(result.error)
        setEntries([])
      } else {
        setEntries(result.data)
        setError(null)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScrollText className="h-5 w-5" />
          Recent admin actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-design-primary" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-design-text-muted">No audited actions yet.</p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {entries.map((entry) => (
              <li key={entry.id} className="text-sm border-b border-design-gray-100 pb-2 last:border-0">
                <p className="text-design-text-heading">{describeEntry(entry)}</p>
                <p className="text-xs text-design-text-muted mt-0.5">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
