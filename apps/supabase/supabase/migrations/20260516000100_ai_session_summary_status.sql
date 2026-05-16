alter table public.ai_sessions
  add column if not exists summary_generation_status text not null default 'pending';

alter table public.ai_sessions
  drop constraint if exists ai_sessions_summary_generation_status_check;

alter table public.ai_sessions
  add constraint ai_sessions_summary_generation_status_check check (
    summary_generation_status in ('pending', 'generating', 'completed', 'failed')
  );

update public.ai_sessions
set summary_generation_status = 'completed'
where summary_generated_at is not null;

update public.ai_sessions
set summary_generation_status = 'failed'
where ended_at is not null
  and summary_generated_at is null;
