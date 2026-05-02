'use client'

import { login } from '../actions'
import { SubmitButton } from '@/components/SubmitButton'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  async function action(formData: FormData) {
    const res = await login(formData)
    if (res?.error) {
      setError(res.error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sign in</h1>
          <p className="text-sm text-zinc-500 mt-2">Welcome back to your workspace</p>
        </div>
        
        <form action={action} className="space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-zinc-900" htmlFor="email">Work Email</label>
            <input 
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="you@company.com" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-zinc-900" htmlFor="password">Password</label>
            <input 
              id="password"
              name="password"
              type="password"
              required
              className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <SubmitButton>Sign In</SubmitButton>
        </form>
        
        <div className="mt-8 text-center text-sm text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-zinc-900 hover:text-zinc-700 transition-colors">
            Create workspace
          </Link>
        </div>
      </div>
    </div>
  )
}
