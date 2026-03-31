'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TIME_SLOTS } from '@/lib/timeSlots'
import { VALID_DESKS } from '@/lib/deskLayout'
import { format, addDays } from 'date-fns'

function AssignForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillDesk = searchParams.get('desk')

  const today = format(new Date(), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    desk_number: prefillDesk || '',
    person_name: '',
    time_slot: 'full_day',
    start_date: today,
    days: 30,
    notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const endDate = form.start_date
    ? format(addDays(new Date(form.start_date), Number(form.days) - 1), 'yyyy-MM-dd')
    : ''

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      desk_number: parseInt(form.desk_number),
      person_name: form.person_name.trim(),
      time_slot: form.time_slot,
      start_date: form.start_date,
      end_date: endDate,
      notes: form.notes,
    }

    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    router.push('/')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Assign a Desk</h1>

      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

        {/* Desk number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Desk Number <span className="text-red-500">*</span></label>
          <select
            required
            value={form.desk_number}
            onChange={e => set('desk_number', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select a desk...</option>
            {VALID_DESKS.map(n => (
              <option key={n} value={n}>Desk {n}</option>
            ))}
          </select>
        </div>

        {/* Person name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Student Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={form.person_name}
            onChange={e => set('person_name', e.target.value)}
            placeholder="Full name"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time slot */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot <span className="text-red-500">*</span></label>
          <div className="space-y-2">
            {Object.entries(TIME_SLOTS).map(([key, slot]) => (
              <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                form.time_slot === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="time_slot"
                  value={key}
                  checked={form.time_slot === key}
                  onChange={() => set('time_slot', key)}
                  className="accent-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-slate-800">{slot.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Start date + days */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Number of Days <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              max="365"
              required
              value={form.days}
              onChange={e => set('days', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* End date preview */}
        {endDate && (
          <p className="text-xs text-slate-500 -mt-2">
            Assignment ends on <strong>{endDate}</strong>
          </p>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Phone number, payment info, etc."
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Assign Desk'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AssignPage() {
  return (
    <Suspense>
      <AssignForm />
    </Suspense>
  )
}
