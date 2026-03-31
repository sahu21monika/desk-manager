'use client'
import { useState, useEffect, useCallback } from 'react'
import { TIME_SLOTS, SLOT_COLORS } from '@/lib/timeSlots'
import { format, isAfter, isBefore, parseISO, addDays } from 'date-fns'
import Link from 'next/link'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')  // 'all', 'active', 'expired'
  const [editingId, setEditingId] = useState(null)
  const [editDays, setEditDays] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/assignments')
    const data = await res.json()
    setAssignments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function remove(id) {
    if (!confirm('Remove this assignment?')) return
    await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
    setAssignments(a => a.filter(x => x.id !== id))
  }

  async function saveEdit(a) {
    setSaving(true)
    const newEndDate = format(addDays(parseISO(a.start_date), Number(editDays) - 1), 'yyyy-MM-dd')
    await fetch(`/api/assignments/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ end_date: newEndDate, notes: editNotes }),
    })
    setSaving(false)
    setEditingId(null)
    load()
  }

  const filtered = assignments.filter(a => {
    const matchSearch = !search ||
      a.person_name.toLowerCase().includes(search.toLowerCase()) ||
      String(a.desk_number).includes(search)

    const isActive = a.end_date >= today
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && isActive) ||
      (filter === 'expired' && !isActive)

    return matchSearch && matchFilter
  })

  // Sort: active first, then by start_date desc
  filtered.sort((a, b) => {
    const aActive = a.end_date >= today
    const bActive = b.end_date >= today
    if (aActive !== bActive) return aActive ? -1 : 1
    return b.start_date.localeCompare(a.start_date)
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">All Assignments</h1>
        <Link
          href="/assign"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Assign a Desk
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or desk number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
          {[
            { key: 'active',  label: 'Active' },
            { key: 'expired', label: 'Expired' },
            { key: 'all',     label: 'All' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No assignments found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const isActive = a.end_date >= today
            const isEditing = editingId === a.id

            return (
              <div
                key={a.id}
                className={`bg-white border rounded-xl px-4 py-3 shadow-sm transition-all ${
                  isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Days (from start date)</label>
                        <input
                          type="number" min="1" max="365"
                          value={editDays}
                          onChange={e => setEditDays(e.target.value)}
                          className="block border border-slate-300 rounded px-2 py-1 text-sm w-24 mt-0.5"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 font-medium">Notes</label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          className="block border border-slate-300 rounded px-2 py-1 text-sm w-full mt-0.5"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(a)}
                        disabled={saving}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="border border-slate-300 px-3 py-1.5 rounded text-sm text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Desk badge */}
                      <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                        Desk {a.desk_number}
                      </span>
                      {/* Name */}
                      <span className="font-semibold text-slate-800 text-sm">{a.person_name}</span>
                      {/* Slot badge */}
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SLOT_COLORS[a.time_slot]}`}>
                        {TIME_SLOTS[a.time_slot]?.short}
                      </span>
                      {/* Dates */}
                      <span className="text-xs text-slate-500">
                        {a.start_date} → {a.end_date}
                      </span>
                      {/* Status */}
                      {isActive ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Expired</span>
                      )}
                      {/* Notes */}
                      {a.notes && (
                        <span className="text-xs text-slate-400 italic">{a.notes}</span>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Calculate days from start to end
                          const start = parseISO(a.start_date)
                          const end = parseISO(a.end_date)
                          const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
                          setEditDays(String(diff))
                          setEditNotes(a.notes || '')
                          setEditingId(a.id)
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">{filtered.length} record(s) shown</p>
    </div>
  )
}
