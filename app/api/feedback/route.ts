import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()
    if (!userData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { question, answer, rating } = await req.json()

    await supabase.from('feedback').insert({
      company_id: userData.company_id,
      question,
      answer,
      rating
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
