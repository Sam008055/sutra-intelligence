import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateFileHash } from '@/lib/hash'
import { parseAndChunk } from '@/lib/chunker'
import { generateEmbeddingsBatch } from '@/lib/embeddings'

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Only admins can upload documents' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const accessLevel = (formData.get('access_level') as string) || 'company'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(file.type)) {
      return NextResponse.json({ error: 'File must be PDF or Word Document' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileHash = generateFileHash(buffer)

    const adminSupabase = createAdminClient()
    const { data: existingDoc } = await adminSupabase
      .from('documents')
      .select('id, status')
      .eq('company_id', userData.company_id)
      .eq('file_hash', fileHash)
      .single()

    if (existingDoc) {
      if (existingDoc.status === 'failed') {
        // Clean up the failed document and its orphan chunks so user can retry
        await adminSupabase.from('chunks').delete().eq('document_id', existingDoc.id)
        await adminSupabase.from('documents').delete().eq('id', existingDoc.id)
      } else {
        return NextResponse.json({ error: 'Document already uploaded' }, { status: 409 })
      }
    }

    const { data: docData, error: insertError } = await adminSupabase
      .from('documents')
      .insert({
        company_id: userData.company_id,
        user_id: user.id,
        access_level: accessLevel,
        name: file.name,
        file_hash: fileHash,
        status: 'processing'
      })
      .select()
      .single()

    if (insertError || !docData) {
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    try {
      // 1. Upload raw file to Supabase Storage
      const storagePath = `${userData.company_id}/${docData.id}.pdf`
      const { error: storageError } = await adminSupabase.storage
        .from('documents')
        .upload(storagePath, buffer, { 
          contentType: file.type,
          upsert: true
        })

      if (storageError) {
        console.error("Storage upload error:", storageError)
        await adminSupabase.from('documents').update({ status: 'failed' }).eq('id', docData.id)
        return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
      }

      // 2. Update document with storage path
      await adminSupabase.from('documents').update({ storage_path: storagePath }).eq('id', docData.id)

      // 3. Trigger Background Job via Inngest
      const { inngest } = await import('@/lib/inngest/client')
      await inngest.send({
        name: "app/document.process",
        data: {
          documentId: docData.id,
          companyId: userData.company_id,
          storagePath: storagePath,
          fileType: file.type
        }
      })

      // 4. Return immediately!
      return NextResponse.json({ 
        success: true, 
        message: 'Document uploaded and processing started in background',
        document: docData 
      })
      
    } catch (processError) {
      console.error("Trigger error:", processError)
      await adminSupabase.from('documents').update({ status: 'failed' }).eq('id', docData.id)
      return NextResponse.json({ error: 'Failed to start processing' }, { status: 500 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
