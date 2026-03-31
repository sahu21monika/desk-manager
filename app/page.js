'use client'
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { TIME_SLOTS, SLOT_COLORS } from '@/lib/timeSlots'
import Link from 'next/link'

const TOTAL_DESKS = 93

function getStatusForDesk(deskNum, assignments) {
  const today = new Date().toISOString().split('T')[0]
  const active = assignments.filter(
    a => a.desk_number === deskNum && a.start_date <= today && a.end_date >= today
  )
  if (active.length === 0) return { status: 'free', assignments: [] }

  const hasFullDay = active.some(a => a.time_slot === 'full_day')
  if (hasFullDay) return { status: 'full', assignments: active }

  const slots = new Set(active.map(a => a.time_slot))
  const isFull =
    (slots.has('day') && slots.has('evening')) ||
    (slots.has('morning') && slots.has('afternoon_evening'))

  return { status: isFull ? 'full' : 'partial', assignments: active }
}

export default function Dashboard() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filterSlot, setFilterSlot] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/assignments')
    const data = await res.json()
    setAssignments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const counts = { free: 0, partial: 0, full: 0 }
  const deskStatuses = {}
  for (let i = 1; i <= TOTAL_DESKS; i++) {
    const info = getStatusForDesk(i, assignments)
    deskStatuses[i] = info
    counts[info.status]++
  }

  function deskVisible(deskNum) {
    if (filterSlot === 'all') return true
    const info = deskStatuses[deskNum]
    if (filterSlot === 'free') return info.status === 'free'
    const takenSlots = info.assignments.map(a => a.time_slot)
    const wouldConflict = takenSlots.some(ts => {
      const a = TIME_SLOTS[ts]; const b = TIME_SLOTS[filterSlot]
      return a && b && a.start < b.end && b.start < a.end
    })
    return !wouldConflict
  }

  const selectedInfo = selected ? deskStatuses[selected] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Desk Overview</h1>
          <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, d MMMM yyyy')} (IST)</p>
        </div>
        <Link
          href="/assign"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Assign a Desk
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available',    count: counts.free,    bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700' },
          { label: 'Partial',      count: counts.partial, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
          { label: 'Fully Booked', count: counts.full,    bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700' },
        ].map(({ label, count, bg, border, text }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
            <div className={`text-3xl font-bold ${text}`}>{count}</div>
            <div className={`text-sm font-medium ${text} mt-1`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter by slot */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-slate-500 font-medium">Show available for:</span>
        {[
          { key: 'all',  label: 'All Desks' },
          { key: 'free', label: 'Fully Free' },
          ...Object.entries(TIME_SLOTS).map(([k, v]) => ({ key: k, label: v.short })),
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterSlot(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterSlot === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Desk grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2">
          {Array.from({ length: TOTAL_DESKS }, (_, i) => i + 1).map(num => {
            const info = deskStatuses[num]
            const visible = deskVisible(num)
            const isSelected = selected === num

            let bg = 'bg-green-100 border-green-300 hover:border-green-500 text-green-800'
            if (info.status === 'partial') bg = 'bg-yellow-100 border-yellow-300 hover:border-yellow-500 text-yellow-800'
            if (info.status === 'full')    bg = 'bg-red-100 border-red-300 hover:border-red-400 text-red-800'
            if (!visible)                  bg = 'bg-slate-100 border-slate-200 text-slate-300 opacity-40 cursor-default'

            return (
              <button
                key={num}
                onClick={() => visible && setSelected(isSelected ? null : num)}
                className={`
                  border-2 rounded-lg h-12 text-sm font-bold transition-all
                  ${bg}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-110 z-10' : ''}
                `}
              >
                {num}
              </button>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs text-slate-600">
        {[
          { color: 'bg-green-100 border-green-300',   label: 'Available' },
          { color: 'bg-yellow-100 border-yellow-300', label: 'Partially booked' },
          { color: 'bg-red-100 border-red-300',       label: 'Fully booked' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border-2 ${color}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Desk detail panel */}
      {selected && selectedInfo && (
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Desk {selected}</h2>
            <div className="flex gap-2">
              <Link
                href={`/assign?desk=${selected}`}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Assign
              </Link>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 px-2 text-lg"
              >✕</button>
            </div>
          </div>

          {selectedInfo.assignments.length === 0 ? (
            <p className="text-green-600 font-medium">All slots available today</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-500 font-medium mb-2">Active today:</p>
              {selectedInfo.assignments.map(a => (
                <div key={a.id} className={`border rounded-lg px-3 py-2 text-sm flex items-center justify-between ${SLOT_COLORS[a.time_slot]}`}>
                  <div>
                    <span className="font-semibold">{a.person_name}</span>
                    <span className="mx-2 opacity-50">·</span>
                    <span>{TIME_SLOTS[a.time_slot]?.short}</span>
                    <span className="mx-2 opacity-50">·</span>
                    <span className="text-xs">{a.start_date} → {a.end_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
