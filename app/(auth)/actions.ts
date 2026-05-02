'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const companyName = formData.get('companyName') as string

  if (!email || !password || !companyName) {
    return { error: 'All fields are required' }
  }

  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const adminSupabase = createAdminClient()
    
    // Create company
    const { data: companyData, error: companyError } = await adminSupabase
      .from('companies')
      .insert({ name: companyName, email })
      .select()
      .single()

    if (companyError || !companyData) {
      return { error: 'Failed to create company' }
    }

    // Create public user as admin
    const { error: userError } = await adminSupabase
      .from('users')
      .insert({
        id: data.user.id,
        company_id: companyData.id,
        role: 'admin',
        email: data.user.email
      })

    if (userError) {
      return { error: 'Failed to create user profile' }
    }
  }

  // trigger resend here (async) if required later

  redirect('/dashboard')
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'All fields are required' }
  }

  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

