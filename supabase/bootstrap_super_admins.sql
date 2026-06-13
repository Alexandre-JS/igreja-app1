-- =====================================================================
-- Bootstrap dos super_admins do Ekklesia
-- =====================================================================
--
-- Define como super_admin os utilizadores com os e-mails abaixo,
-- tanto na tabela public.users (fonte de verdade usada pelas políticas
-- RLS em rls_policies.sql) como em user_metadata (fallback usado por
-- src/utils/permissions.ts).
--
-- COMO USAR:
-- - Execute no SQL Editor do Supabase (roda como `postgres`, que
--   ignora RLS e tem acesso a auth.users).
-- - Os utilizadores TÊM de já existir em auth.users (ou seja, já
--   devem ter feito login/registo pelo menos uma vez na app).
-- - Pode ser executado novamente sem problema (idempotente).
-- =====================================================================

-- 1. Garantir que a tabela public.users existe e tem a estrutura esperada
--    (id = auth.users.id, email, role, created_at). Se a tabela já
--    existir com outra estrutura, ajuste antes de continuar.

-- 2. Upsert em public.users para cada e-mail de super_admin
insert into public.users (id, email, role, created_at)
select id, email, 'super_admin', now()
from auth.users
where email in ('mequebumba@gmail.com', 'alexandresitole@gmail.com')
on conflict (id) do update set role = 'super_admin';

-- 3. Sincronizar user_metadata (fallback no código atual)
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
where email in ('mequebumba@gmail.com', 'alexandresitole@gmail.com');

-- 4. Verificação
select id, email, role, created_at
from public.users
where email in ('mequebumba@gmail.com', 'alexandresitole@gmail.com');
