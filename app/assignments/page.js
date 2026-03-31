'use client'
import { useState, useEffect, useCallback } from 'react'
import { TIME_SLOTS, SLOT_COLORS } from '@/lib/timeSlots'
import { VALID_DESKS, VALID_DESK_SET } from '@/lib/deskLayout'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

const inputCls = 'border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-0.5'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')
  const [editingId, setEditingId] = useState(null)
  const [edit, setEdit] = useState({})
  const [saveError, setSaveError] = useState('')
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

  function startEdit(a) {
    setEdit({
      desk_number: String(a.desk_number),
      time_slot: a.time_slot,
      start_date: a.start_date,
      end_date: a.end_date,
      notes: a.notes || '',
    })
    setSaveError('')
    setEditingId(a.id)
  }

  async function saveEdit(a) {
    if (!VALID_DESK_SET.has(parseInt(edit.desk_number))) {
      setSaveError(`Desk ${edit.desk_number} does not exist`)
      return
    }
    if (edit.end_date < edit.start_date) {
      setSaveError('End date cannot be before start date')
      return
    }
    setSaving(true)
    setSaveError('')
    const res = await fetch(`/api/assignments/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        desk_number: parseInt(edit.desk_number),
        time_slot: edit.time_slot,
        start_date: edit.start_date,
        end_date: edit.end_date,
        notes: edit.notes,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setSaveError(data.error || 'Something went wrong')
      return
    }
    setEditingId(null)
    load()
  }

  async function remove(id) {
    if (!confirm('Remove this assignment?')) return
    await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
    setAssignments(a => a.filter(x => x.id !== id))
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
        <Link href="/assign" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
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
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 font-medium transition-colors ${filter === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
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
              <div key={a.id} className={`bg-white border rounded-xl px-4 py-3 shadow-sm transition-all ${isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Editing — {a.person_name}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Desk number */}
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Desk No.</label>
                        <select
                          value={edit.desk_number}
                          onChange={e => setEdit(v => ({ ...v, desk_number: e.target.value }))}
                          className={`block w-full bg-white ${inputCls}`}
                        >
                          {VALID_DESKS.map(n => (
                            <option key={n} value={n}>Desk {n}</option>
                          ))}
                        </select>
                      </div>

                      {/* Start date */}
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Start Date</label>
                        <input
                          type="date"
                          value={edit.start_date}
                          onChange={e => setEdit(v => ({ ...v, start_date: e.target.value }))}
                          className={`block w-full ${inputCls}`}
                        />
                      </div>

                      {/* End date */}
                      <div>
                        <label className="text-xs text-slate-500 font-medium">End Date</label>
                        <input
                          type="date"
                          value={edit.end_date}
                          min={edit.start_date}
                          onChange={e => setEdit(v => ({ ...v, end_date: e.target.value }))}
                          className={`block w-full ${inputCls}`}
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Notes</label>
                        <input
                          type="text"
                          value={edit.notes}
                          onChange={e => setEdit(v => ({ ...v, notes: e.target.value }))}
                          className={`block w-full ${inputCls}`}
                        />
                      </div>
                    </div>

                    {/* Time slot */}
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1.5">Time Slot</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(TIME_SLOTS).map(([key, slot]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEdit(v => ({ ...v, time_slot: key }))}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                              edit.time_slot === key
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {saveError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                        {saveError}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEdit(a)} disabled={saving}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="border border-slate-300 px-4 py-1.5 rounded text-sm text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                        Desk {a.desk_number}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm">{a.person_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SLOT_COLORS[a.time_slot]}`}>
                        {TIME_SLOTS[a.time_slot]?.short}
                      </span>
                      <span className="text-xs text-slate-500">{a.start_date} → {a.end_date}</span>
                      {isActive
                        ? <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                        : <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Expired</span>
                      }
                      {a.notes && <span className="text-xs text-slate-400 italic">{a.notes}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(a)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => remove(a.id)} className="text-xs text-red-500 hover:underline">Remove</button>
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
