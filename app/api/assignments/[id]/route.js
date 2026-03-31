import { supabase } from '@/lib/supabase'
import { slotsOverlap } from '@/lib/timeSlots'
import { VALID_DESK_SET } from '@/lib/deskLayout'
import { NextResponse } from 'next/server'

// DELETE /api/assignments/[id]
export async function DELETE(request, { params }) {
  const { id } = await params
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH /api/assignments/[id]
export async function PATCH(request, { params }) {
  const { id } = await params
  const body = await request.json()

  // Fetch current record so we have full context for conflict check
  const { data: current, error: fetchError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  const updates = {}
  if (body.start_date)  updates.start_date  = body.start_date
  if (body.end_date)    updates.end_date    = body.end_date
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null
  if (body.person_name) updates.person_name = body.person_name.trim()

  // Handle desk_number change
  if (body.desk_number !== undefined) {
    const dn = parseInt(body.desk_number)
    if (!VALID_DESK_SET.has(dn)) {
      return NextResponse.json({ error: `Desk ${dn} does not exist` }, { status: 400 })
    }
    updates.desk_number = dn
  }

  // Handle time_slot change
  if (body.time_slot) updates.time_slot = body.time_slot

  // If desk or slot or end_date changed, re-run conflict check
  const needsConflictCheck = body.desk_number !== undefined || body.time_slot || body.end_date || body.start_date
  if (needsConflictCheck) {
    const checkDesk  = updates.desk_number ?? current.desk_number
    const checkSlot  = updates.time_slot   ?? current.time_slot
    const checkStart = updates.start_date  ?? current.start_date
    const checkEnd   = updates.end_date    ?? current.end_date

    const { data: existing } = await supabase
      .from('assignments')
      .select('*')
      .eq('desk_number', checkDesk)
      .lte('start_date', checkEnd)
      .gte('end_date', checkStart)
      .neq('id', id)   // exclude self

    const conflicts = (existing || []).filter(a => slotsOverlap(a.time_slot, checkSlot))
    if (conflicts.length > 0) {
      const names = conflicts.map(c => `${c.person_name} (${c.time_slot})`).join(', ')
      return NextResponse.json(
        { error: `Conflicts with existing assignment: ${names}` },
        { status: 409 }
      )
    }
  }

  const { data, error } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
