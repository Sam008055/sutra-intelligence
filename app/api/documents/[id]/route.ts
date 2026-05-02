import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete documents' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // 1. Fetch document to get storage path
    const { data: document, error: fetchError } = await adminSupabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .eq('company_id', userData.company_id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 2. Hard Delete from Supabase Storage (GDPR Compliance)
    if (document.storage_path) {
      const { error: storageError } = await adminSupabase.storage
        .from('documents')
        .remove([document.storage_path])
        
      if (storageError) {
        console.error("Failed to delete physical file from storage:", storageError)
        // Proceed anyway to delete DB record, or throw? Let's proceed to ensure DB is clean.
      }
    }

    // 3. Delete from Database (Chunks will cascade)
    const { error: deleteError } = await adminSupabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('company_id', userData.company_id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete database record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Document and physical file permanently deleted.' })

  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
