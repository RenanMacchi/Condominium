-- 1. Create a secure postgres function that updates the raw auth.users record directly
-- This bypasses the builtin 'supabase.auth.updateUser' which triggers validation emails we don't need or can't send
create or replace function update_user_email(new_email text)
returns json
language plpgsql
security definer -- Security DEFINER runs this function with superuser/admin privileges
set search_path = public
as $$
declare
    v_user_id uuid;
begin
    -- Only allow logged in users to call this
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Não autorizado';
    end if;

    -- Update the core auth user's email directly
    -- We clear the email_change fields to prevent Supabase from waiting for a confirmation link
    update auth.users
    set email = new_email,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        email_change = '',
        email_change_confirm_status = 0,
        email_change_token_new = '',
        updated_at = now()
    where id = v_user_id;

    -- Update the public profile table just to keep it in sync automatically
    update public.profiles
    set recovery_email = new_email
    where id = v_user_id;

    return json_build_object('status', 'success', 'message', 'Email atualizado com sucesso');
end;
$$;
