create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.homepage (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique default 'main',
  content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text not null,
  layout_variant text not null default 'image',
  cover_image_path text,
  cover_image_url text,
  cover_image_alt text,
  detail_image_path text,
  detail_image_url text,
  detail_image_alt text,
  detail_paragraphs jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  platform text not null unique,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  source text not null,
  page_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_homepage_updated_at on public.homepage;
create trigger trg_homepage_updated_at
before update on public.homepage
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_social_links_updated_at on public.social_links;
create trigger trg_social_links_updated_at
before update on public.social_links
for each row execute function public.set_updated_at();

alter table public.homepage enable row level security;
alter table public.projects enable row level security;
alter table public.social_links enable row level security;
alter table public.lead_submissions enable row level security;

drop policy if exists "Public can read homepage" on public.homepage;
create policy "Public can read homepage"
  on public.homepage
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
  on public.projects
  for select
  to anon, authenticated
  using (published);

drop policy if exists "Public can read social links" on public.social_links;
create policy "Public can read social links"
  on public.social_links
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Anyone can submit leads" on public.lead_submissions;
create policy "Anyone can submit leads"
  on public.lead_submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can read leads" on public.lead_submissions;
create policy "Anyone can read leads"
  on public.lead_submissions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can delete leads" on public.lead_submissions;
create policy "Anyone can delete leads"
  on public.lead_submissions
  for delete
  to anon, authenticated
  using (true);

insert into public.homepage (slug, content, is_active)
values ('main', '{}'::jsonb, true)
on conflict (slug) do update
set content = excluded.content,
    is_active = excluded.is_active,
    updated_at = timezone('utc', now());
