import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// DELETE /api/assignments/[id]
export async function DELETE(request, { params }) {
  const { id } = await params
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH /api/assignments/[id]  — update end_date or notes
export async function PATCH(request, { params }) {
  const { id } = await params
  const body = await request.json()
  const allowed = ['end_date', 'notes', 'person_name']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
