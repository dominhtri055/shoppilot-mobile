create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'given_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = timezone('utc', now());
  return new;
end;
$$;

update public.profiles as profile
set full_name = coalesce(
      nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
      nullif(auth_user.raw_user_meta_data ->> 'name', ''),
      nullif(auth_user.raw_user_meta_data ->> 'given_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1),
      profile.full_name
    ),
    email = coalesce(auth_user.email, profile.email),
    updated_at = timezone('utc', now())
from auth.users as auth_user
where auth_user.id = profile.id
  and (profile.full_name is null or profile.full_name = '');
