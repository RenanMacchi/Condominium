-- 1. Create the table if it doesn't exist yet
create table if not exists public.app_settings (
    key text primary key,
    value text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.app_settings enable row level security;

-- 3. Drop existing policies just in case to avoid conflicts
drop policy if exists "Configurações são visíveis para todos" on public.app_settings;
drop policy if exists "Apenas administradores podem inserir configurações" on public.app_settings;
drop policy if exists "Apenas administradores podem atualizar configurações" on public.app_settings;
drop policy if exists "Apenas administradores podem deletar configurações" on public.app_settings;

-- 4. Create Policies

-- Policy: Everyone can read the settings (like the logo URL)
create policy "Configurações são visíveis para todos"
    on public.app_settings for select
    using (true);

-- Policy: Only Admins can insert settings
create policy "Apenas administradores podem inserir configurações"
    on public.app_settings for insert
    with check (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
    );

-- Policy: Only Admins can update settings
create policy "Apenas administradores podem atualizar configurações"
    on public.app_settings for update
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
    );

-- Policy: Only Admins can delete settings
create policy "Apenas administradores podem deletar configurações"
    on public.app_settings for delete
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
    );
