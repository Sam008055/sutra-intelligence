-- Enterprise Architecture Upgrade Migration
-- Run this script in your Supabase SQL Editor

-- 1. Add standard B-Tree indices to chunks table to accelerate pre-filtering before Vector search
create index if not exists idx_chunks_company_id on public.chunks(company_id);
create index if not exists idx_chunks_document_id on public.chunks(document_id);

-- 2. Add Enterprise fields to documents table for Observability and Access Control
alter table public.documents add column if not exists failure_reason text;
alter table public.documents add column if not exists access_level text default 'company';

-- 3. Replace the match_chunks function to enforce strict company pre-filtering,
--    and return the document name for Citations.
drop function if exists public.match_chunks;

create or replace function public.match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_company_id uuid
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
    and d.access_level = 'company' -- Future-proofing for private documents
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
