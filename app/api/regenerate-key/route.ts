import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // use node crypto built in or just UUID from randomUUID correctly
    const newKey = crypto.randomUUID()
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('companies')
      .update({ embed_api_key: newKey })
      .eq('id', userData.company_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update key' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newKey })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
