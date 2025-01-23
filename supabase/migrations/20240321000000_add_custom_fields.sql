-- Create custom_field_definitions table
create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  field_type text not null check (field_type in ('text', 'number', 'date', 'boolean', 'select')),
  options jsonb null, -- For select type fields
  required boolean default false,
  description text null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name)
);

-- Add custom_fields to tickets table
alter table tickets 
add column custom_fields jsonb default '{}'::jsonb not null;

-- Add trigger to update updated_at
create trigger set_custom_field_definitions_updated_at
  before update on custom_field_definitions
  for each row
  execute function public.set_updated_at(); 