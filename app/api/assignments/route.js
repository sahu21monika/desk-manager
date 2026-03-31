import { supabase } from '@/lib/supabase'
import { slotsOverlap } from '@/lib/timeSlots'
import { VALID_DESK_SET } from '@/lib/deskLayout'
import { NextResponse } from 'next/server'

// GET /api/assignments?date=YYYY-MM-DD&desk=1
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')   // filter: only assignments active on this date
  const desk = searchParams.get('desk')   // filter: only this desk number
  const active = searchParams.get('active') // 'true' = only current/future

  let query = supabase
    .from('assignments')
    .select('*')
    .order('start_date', { ascending: true })

  if (desk) query = query.eq('desk_number', parseInt(desk))

  if (date) {
    query = query.lte('start_date', date).gte('end_date', date)
  }

  if (active === 'true') {
    const today = new Date().toISOString().split('T')[0]
    query = query.gte('end_date', today)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/assignments
export async function POST(request) {
  const body = await request.json()
  const { desk_number, person_name, time_slot, start_date, end_date, notes } = body

  if (!desk_number || !person_name || !time_slot || !start_date || !end_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!VALID_DESK_SET.has(desk_number)) {
    return NextResponse.json({ error: `Desk ${desk_number} does not exist` }, { status: 400 })
  }

  // Check for conflicts: any active assignment on this desk in overlapping date range & time slot
  const { data: existing } = await supabase
    .from('assignments')
    .select('*')
    .eq('desk_number', desk_number)
    .lte('start_date', end_date)
    .gte('end_date', start_date)

  const conflicts = (existing || []).filter(a => slotsOverlap(a.time_slot, time_slot))

  if (conflicts.length > 0) {
    const names = conflicts.map(c => `${c.person_name} (${c.time_slot})`).join(', ')
    return NextResponse.json(
      { error: `Time slot conflicts with existing assignment: ${names}` },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('assignments')
    .insert([{ desk_number, person_name: person_name.trim(), time_slot, start_date, end_date, notes: notes?.trim() || null }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
