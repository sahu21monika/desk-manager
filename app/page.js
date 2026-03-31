'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth } from 'date-fns'
import { TIME_SLOTS, SLOT_COLORS } from '@/lib/timeSlots'
import { DESK_LAYOUT, VALID_DESK_SET } from '@/lib/deskLayout'
import Link from 'next/link'

const TOTAL_DESKS = 93  // DESK_COUNT === 93
const TODAY = new Date()
const TODAY_STR = format(TODAY, 'yyyy-MM-dd')

function toStr(date) { return format(date, 'yyyy-MM-dd') }

function getStatusForDesk(deskNum, assignments, dateStr) {
  const active = assignments.filter(
    a => a.desk_number === deskNum && a.start_date <= dateStr && a.end_date >= dateStr
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

// Returns dot color for a date in the mini calendar
function getDotForDate(assignments, dateStr) {
  let free = 0, partial = 0, full = 0
  for (let i = 1; i <= TOTAL_DESKS; i++) {
    const s = getStatusForDesk(i, assignments, dateStr).status
    if (s === 'free') free++
    else if (s === 'partial') partial++
    else full++
  }
  if (full > 60) return 'red'
  if (full + partial > 30) return 'yellow'
  return null
}

function MiniCalendar({ selected, onSelect, assignments }) {
  const [month, setMonth] = useState(startOfMonth(selected))
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = getDay(startOfMonth(month)) // 0=Sun

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonth(m => subMonths(m, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 text-sm">‹</button>
        <span className="text-sm font-semibold text-slate-700">{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 text-sm">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Padding */}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map(day => {
          const dateStr = toStr(day)
          const isSelected = toStr(selected) === dateStr
          const isToday = dateStr === TODAY_STR
          const dot = getDotForDate(assignments, dateStr)
          const inMonth = isSameMonth(day, month)

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(day)}
              className={`relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-xs font-medium transition-colors
                ${isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}
                ${!inMonth ? 'opacity-30' : ''}
              `}
            >
              {day.getDate()}
              {/* Occupancy dot */}
              {dot && !isSelected && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${dot === 'red' ? 'bg-red-400' : 'bg-yellow-400'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Busy</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Very busy</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [selectedDesk, setSelectedDesk] = useState(null)
  const [filterSlot, setFilterSlot] = useState('all')
  const [calendarOpen, setCalendarOpen] = useState(false)

  const dateStr = toStr(selectedDate)
  const isToday = dateStr === TODAY_STR

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/assignments')
    const data = await res.json()
    setAssignments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Recalculate desk statuses for selected date
  const counts = { free: 0, partial: 0, full: 0 }
  const deskStatuses = {}
  for (const num of VALID_DESK_SET) {
    const info = getStatusForDesk(num, assignments, dateStr)
    deskStatuses[num] = info
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

  const selectedDeskInfo = selectedDesk ? deskStatuses[selectedDesk] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Desk Overview</h1>
          <p className="text-sm text-slate-500">
            {isToday ? 'Today — ' : ''}{format(selectedDate, 'EEEE, d MMMM yyyy')} (IST)
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Calendar toggle */}
          <button
            onClick={() => setCalendarOpen(o => !o)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              calendarOpen
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>📅</span>
            <span>{calendarOpen ? format(selectedDate, 'd MMM') : (!isToday ? format(selectedDate, 'd MMM') : 'Calendar')}</span>
            <span className={`text-xs transition-transform ${calendarOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {!isToday && (
            <button
              onClick={() => { setSelectedDate(TODAY); setCalendarOpen(false) }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
            >
              Today
            </button>
          )}
          <Link href="/assign"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Assign a Desk
          </Link>
        </div>
      </div>

      {/* Collapsible Calendar */}
      {calendarOpen && (
        <div className="w-72">
          <MiniCalendar
            selected={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setSelectedDesk(null); setCalendarOpen(false) }}
            assignments={assignments}
          />
        </div>
      )}

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
          { key: 'all',  label: 'All Desks',  time: null },
          { key: 'free', label: 'Fully Free', time: null },
          ...Object.entries(TIME_SLOTS).map(([k, v]) => ({
            key: k,
            label: v.short,
            time: `${v.start < 12 ? v.start + 'am' : v.start === 12 ? '12pm' : (v.start - 12) + 'pm'} – ${v.end === 12 ? '12pm' : v.end > 12 ? (v.end - 12) + 'pm' : v.end + 'am'}`,
          })),
        ].map(({ key, label, time }) => (
          <button key={key} onClick={() => setFilterSlot(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex flex-col items-center leading-tight ${
              filterSlot === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
            }`}>
            <span>{label}</span>
            {time && <span className={`text-[10px] font-normal mt-0.5 ${filterSlot === key ? 'text-blue-100' : 'text-slate-400'}`}>{time}</span>}
          </button>
        ))}
      </div>

      {/* Desk grid — flat CSS grid, separator columns bridge row gaps for continuous lines */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : (
        // 11 desk cols + 5 separator cols = 16 grid columns
        // gap-x-1.5 (6px), gap-y-1.5 (6px). Separators are -mt-[3px] h-[calc(55px+6px)] to bridge gaps.
        <div
          className="grid gap-x-1.5 gap-y-1.5 overflow-hidden w-full"
          style={{ gridTemplateColumns: '1fr 1fr 2px 1fr 1fr 2px 1fr 1fr 2px 1fr 1fr 2px 1fr 1fr 2px 1fr' }}
        >
          {DESK_LAYOUT.map((row, rowIdx) => {
            // Map 11 desk values → 16 cells (insert separator after positions 1,3,5,7,9)
            const gridCells = []
            const insertSepAfter = new Set([1, 3, 5, 7, 9])
            row.forEach((num, colIdx) => {
              // Desk cell
              if (num === 0) {
                gridCells.push(<div key={`${rowIdx}-${colIdx}`} className="h-[55px]" />)
              } else {
                const info = deskStatuses[num]
                const visible = deskVisible(num)
                const isSelected = selectedDesk === num
                let bg = 'bg-green-100 border-green-300 hover:border-green-500 text-green-800'
                if (info?.status === 'partial') bg = 'bg-yellow-100 border-yellow-300 hover:border-yellow-500 text-yellow-800'
                if (info?.status === 'full')    bg = 'bg-red-100 border-red-300 hover:border-red-400 text-red-800'
                if (!visible)                   bg = 'bg-slate-100 border-slate-200 text-slate-300 opacity-40 cursor-default'
                gridCells.push(
                  <button
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => visible && setSelectedDesk(isSelected ? null : num)}
                    className={`h-[55px] border-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${bg} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''}`}
                  >
                    {num}
                  </button>
                )
              }
              // Separator cell after every 2nd column (not after last)
              if (insertSepAfter.has(colIdx)) {
                gridCells.push(
                  <div
                    key={`${rowIdx}-sep-${colIdx}`}
                    className="bg-slate-300 -mt-[3px] h-[calc(55px+6px)]"
                  />
                )
              }
            })
            return gridCells
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
      {selectedDesk && selectedDeskInfo && (
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Desk {selectedDesk}</h2>
              <p className="text-xs text-slate-400">{format(selectedDate, 'd MMM yyyy')}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/assign?desk=${selectedDesk}`}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700">
                Assign
              </Link>
              <button onClick={() => setSelectedDesk(null)}
                className="text-slate-400 hover:text-slate-600 px-2 text-lg">✕</button>
            </div>
          </div>

          {selectedDeskInfo.assignments.length === 0 ? (
            <p className="text-green-600 font-medium">All slots available on this day</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-500 font-medium mb-2">Booked slots:</p>
              {selectedDeskInfo.assignments.map(a => (
                <div key={a.id} className={`border rounded-lg px-3 py-2 text-sm flex items-center gap-3 ${SLOT_COLORS[a.time_slot]}`}>
                  <span className="font-semibold">{a.person_name}</span>
                  <span className="opacity-50">·</span>
                  <span>{TIME_SLOTS[a.time_slot]?.short}</span>
                  <span className="opacity-50">·</span>
                  <span className="text-xs">{a.start_date} → {a.end_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
