-- RBAC Upgrade Migration
-- Run this script in your Supabase SQL Editor

-- 1. Add user_id to documents to track ownership
alter table public.documents add column if not exists user_id uuid references auth.users(id);

-- 2. Update match_chunks to accept an optional p_user_id and enforce Private vs Company access
drop function if exists public.match_chunks;

create or replace function public.match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_company_id uuid,
  p_user_id uuid default null
)
returns table (
  id uuid,
  document_name text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    d.name as document_name,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  join public.documents d on c.document_id = d.id
  where c.company_id = p_company_id
    and (
      d.access_level = 'company' 
      or (d.access_level = 'private' and d.user_id = p_user_id)
    )
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- 3. Secure RLS on documents
-- First, drop the old permissive policy
drop policy if exists "Company members can view documents" on public.documents;

-- Recreate policy: Users can view documents if they are 'company' OR if the user owns them
create policy "Users can view allowed documents" on public.documents
for select using (
  company_id = (select company_id from public.users where id = auth.uid())
  and (
    access_level = 'company' 
    or (access_level = 'private' and user_id = auth.uid())
  )
);
