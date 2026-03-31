'use client'
import { useState, useEffect, useCallback } from 'react'
import { TIME_SLOTS, SLOT_COLORS } from '@/lib/timeSlots'

export default function StudentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active') // 'all', 'active', 'expired'
  const [expanded, setExpanded] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/assignments')
    const data = await res.json()
    setAssignments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Group assignments by student name
  const studentMap = {}
  for (const a of assignments) {
    const key = a.person_name.trim().toLowerCase()
    if (!studentMap[key]) {
      studentMap[key] = { name: a.person_name, assignments: [] }
    }
    studentMap[key].assignments.push(a)
  }

  // Build student list with status
  let students = Object.values(studentMap).map(s => {
    const active = s.assignments.filter(a => a.end_date >= today)
    const expired = s.assignments.filter(a => a.end_date < today)
    return {
      ...s,
      activeCount: active.length,
      expiredCount: expired.length,
      status: active.length > 0 ? 'active' : 'expired',
      latestDesk: active.length > 0
        ? active.sort((a, b) => b.start_date.localeCompare(a.start_date))[0]
        : expired.sort((a, b) => b.end_date.localeCompare(a.end_date))[0],
    }
  })

  // Filter
  students = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && s.status === 'active') ||
      (filter === 'expired' && s.status === 'expired')
    return matchSearch && matchFilter
  })

  // Sort: active first, then alphabetically
  students.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const totalActive = Object.values(studentMap).filter(s =>
    s.assignments.some(a => a.end_date >= today)
  ).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Student Master</h1>
        <p className="text-sm text-slate-500 mt-0.5">All students and their desk assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students', count: Object.keys(studentMap).length, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
          { label: 'Active',         count: totalActive,                      bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700' },
          { label: 'Expired',        count: Object.keys(studentMap).length - totalActive, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
        ].map(({ label, count, bg, border, text }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
            <div className={`text-3xl font-bold ${text}`}>{count}</div>
            <div className={`text-sm font-medium ${text} mt-1`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by student name..."
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

      {/* Student list */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No students found.</div>
      ) : (
        <div className="space-y-2">
          {students.map(s => {
            const isExpanded = expanded === s.name
            const activeAssignments = s.assignments.filter(a => a.end_date >= today)
            const expiredAssignments = s.assignments.filter(a => a.end_date < today)
            const showAssignments = isExpanded ? s.assignments : []

            return (
              <div
                key={s.name}
                className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${
                  s.status === 'active' ? 'border-slate-200' : 'border-slate-100'
                }`}
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : s.name)}
                  className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar initial */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    s.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <span className={`font-semibold text-sm flex-1 min-w-[120px] ${
                    s.status === 'active' ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {s.name}
                  </span>

                  {/* Current desk + slot */}
                  {s.latestDesk && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        s.status === 'active' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        Desk {s.latestDesk.desk_number}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SLOT_COLORS[s.latestDesk.time_slot]}`}>
                        {TIME_SLOTS[s.latestDesk.time_slot]?.short}
                      </span>
                    </div>
                  )}

                  {/* Dates */}
                  {s.latestDesk && (
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {s.latestDesk.start_date} → {s.latestDesk.end_date}
                    </span>
                  )}

                  {/* Status badge */}
                  {s.status === 'active' ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Expired
                    </span>
                  )}

                  {/* History count */}
                  {s.assignments.length > 1 && (
                    <span className="text-xs text-slate-400">
                      {s.assignments.length} sessions
                    </span>
                  )}

                  {/* Expand chevron */}
                  <span className={`text-slate-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* Expanded: all assignment history */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">
                    <p className="text-xs text-slate-500 font-medium mb-2">Assignment history</p>
                    {s.assignments
                      .sort((a, b) => b.start_date.localeCompare(a.start_date))
                      .map(a => {
                        const isActive = a.end_date >= today
                        return (
                          <div key={a.id} className={`flex flex-wrap items-center gap-2 text-xs py-1.5 px-3 rounded-lg border ${
                            isActive ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'
                          }`}>
                            <span className="font-bold text-slate-700">Desk {a.desk_number}</span>
                            <span className={`px-1.5 py-0.5 rounded border font-medium ${SLOT_COLORS[a.time_slot]}`}>
                              {TIME_SLOTS[a.time_slot]?.short}
                            </span>
                            <span className="text-slate-500">{a.start_date} → {a.end_date}</span>
                            {isActive
                              ? <span className="text-green-600 font-medium">Active</span>
                              : <span className="text-slate-400">Expired</span>
                            }
                            {a.notes && <span className="text-slate-400 italic">{a.notes}</span>}
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">{students.length} student(s) shown</p>
    </div>
  )
}
