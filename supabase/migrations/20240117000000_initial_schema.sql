-- Enable necessary extensions
create extension if not exists "vector" with schema "public";

-- Users table (extends Supabase auth.users)
create type user_role as enum ('customer', 'worker', 'admin');

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role not null default 'customer',
  full_name text,
  avatar_url text,
  organization_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tickets table
create type ticket_status as enum ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'medium',
  customer_id uuid references public.profiles(id) not null,
  assigned_to uuid references public.profiles(id),
  category text,
  tags text[],
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments/responses on tickets
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  is_internal boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Knowledge base articles
create table public.knowledge_base_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) not null,
  category text,
  tags text[],
  is_published boolean default false,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  content text,
  type text not null,
  is_read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audit logs
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.comments enable row level security;
alter table public.knowledge_base_articles enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Create policies
-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Tickets policies
create policy "Customers can view own tickets"
  on public.tickets for select
  using (auth.uid() = customer_id);

create policy "Workers and admins can view all tickets"
  on public.tickets for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('worker', 'admin')
    )
  );

create policy "Customers can create tickets"
  on public.tickets for insert
  with check (auth.uid() = customer_id);

create policy "Workers and admins can update tickets"
  on public.tickets for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('worker', 'admin')
    )
  );

-- Comments policies
create policy "Comments are viewable by ticket participants"
  on public.comments for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (
        t.customer_id = auth.uid()
        or t.assigned_to = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid()
          and role = 'admin'
        )
      )
    )
  );

create policy "Users can create comments on accessible tickets"
  on public.comments for insert
  with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (
        t.customer_id = auth.uid()
        or t.assigned_to = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid()
          and role in ('worker', 'admin')
        )
      )
    )
  );

-- Knowledge base policies
create policy "Published articles are viewable by workers"
  on public.knowledge_base_articles for select
  using (
    is_published = true
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('worker', 'admin')
    )
  );

create policy "Admins can manage knowledge base articles"
  on public.knowledge_base_articles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Notifications policies
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Audit logs policies
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Functions
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    'customer',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index tickets_customer_id_idx on public.tickets(customer_id);
create index tickets_assigned_to_idx on public.tickets(assigned_to);
create index comments_ticket_id_idx on public.comments(ticket_id);
create index notifications_user_id_idx on public.notifications(user_id);
create index audit_logs_entity_id_idx on public.audit_logs(entity_id);