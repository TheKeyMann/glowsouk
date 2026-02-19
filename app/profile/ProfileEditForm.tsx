'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

const SKIN_TYPES = [
  { value: 'oily',        label: 'Oily' },
  { value: 'dry',         label: 'Dry' },
  { value: 'combination', label: 'Combination' },
  { value: 'normal',      label: 'Normal' },
  { value: 'sensitive',   label: 'Sensitive' },
]

interface ProfileEditFormProps {
  profile: User
}

export default function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false)
  const [skinType, setSkinType] = useState(profile.skin_type || '')
  const [nationality, setNationality] = useState(profile.nationality || '')
  const [username, setUsername] = useState(profile.username || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('users')
      .update({
        username:    username.trim() || null,
        skin_type:   skinType || null,
        nationality: nationality.trim() || null,
      })
      .eq('id', profile.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setSkinType(profile.skin_type || '')
    setNationality(profile.nationality || '')
    setUsername(profile.username || '')
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-glowsouk-cream rounded-xl p-3">
            <p className="text-xs text-glowsouk-dark-muted/60 uppercase tracking-wide mb-1">Username</p>
            <p className="font-medium text-glowsouk-dark">{profile.username || '—'}</p>
          </div>
          <div className="bg-glowsouk-cream rounded-xl p-3">
            <p className="text-xs text-glowsouk-dark-muted/60 uppercase tracking-wide mb-1">Skin Type</p>
            <p className="font-medium text-glowsouk-dark capitalize">{profile.skin_type || '—'}</p>
          </div>
          <div className="bg-glowsouk-cream rounded-xl p-3">
            <p className="text-xs text-glowsouk-dark-muted/60 uppercase tracking-wide mb-1">Nationality</p>
            <p className="font-medium text-glowsouk-dark">{profile.nationality || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm gap-2">
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </button>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="glowguru"
            maxLength={30}
            className="input text-sm"
          />
        </div>
        <div>
          <label className="label">Skin Type</label>
          <select
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
            className="input text-sm"
          >
            <option value="">Select skin type</option>
            {SKIN_TYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Nationality</label>
          <input
            type="text"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="e.g. Emirati, British…"
            maxLength={50}
            className="input text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
      )}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={handleCancel} className="btn-ghost text-sm">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  )
}
