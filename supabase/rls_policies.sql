-- =====================================================================
-- Políticas de Row Level Security (RLS) recomendadas para o Ekklesia
-- =====================================================================
--
-- COMO USAR:
-- 1. Abra o painel do Supabase do projeto -> SQL Editor
-- 2. Revise este script (ajuste nomes de tabelas/colunas se forem
--    diferentes do que está aqui)
-- 3. Execute o script
--
-- IMPORTANTE — pré-requisitos antes de executar:
-- - Confirme que a tabela `users` tem uma linha (id = auth.uid(), role)
--   para CADA conta de administrador que hoje funciona via
--   user_metadata.role. Sem isso, essas contas perdem acesso de
--   admin assim que estas políticas entrarem em vigor.
-- - Depois de aplicar este script, ative o RLS de fato no painel
--   (Database -> Tables -> members/users -> "Enable RLS"), caso o
--   `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` abaixo não seja
--   suficiente para a sua versão.
--
-- PORQUÊ ISTO É NECESSÁRIO:
-- O código atual decide quem pode criar/editar/apagar membros e
-- gerir utilizadores com base em `user.user_metadata.role`
-- (src/utils/permissions.ts). Esse campo é editável pelo próprio
-- utilizador autenticado via `supabase.auth.updateUser({ data: {...} })`
-- usando apenas a chave anónima — ou seja, qualquer pessoa pode se
-- auto-promover a "super_admin". As políticas abaixo movem a decisão
-- de permissão para o servidor (Postgres), usando a tabela `users`
-- como fonte de verdade, que só pode ser escrita por super_admins.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Função auxiliar: obtém o "role" do utilizador autenticado a partir
--    da tabela `users` (SECURITY DEFINER evita recursão de RLS quando
--    a própria tabela `users` também tem políticas).
-- ---------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid();
$$;


-- ---------------------------------------------------------------------
-- 2. Tabela MEMBERS
-- ---------------------------------------------------------------------
alter table public.members enable row level security;

-- Qualquer utilizador autenticado pode ver a lista de membros
create policy "members_select_authenticated"
on public.members
for select
to authenticated
using (true);

-- Apenas admin/super_admin podem inserir membros (uso interno, ex: AddMember)
create policy "members_insert_admin"
on public.members
for insert
to authenticated
with check (public.current_user_role() in ('admin', 'super_admin'));

-- Apenas admin/super_admin podem editar membros
create policy "members_update_admin"
on public.members
for update
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'))
with check (public.current_user_role() in ('admin', 'super_admin'));

-- Apenas admin/super_admin podem apagar membros
create policy "members_delete_admin"
on public.members
for delete
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'));

-- Auto-registo público (PublicRegister.tsx): permite que QUALQUER
-- visitante (anon) insira o seu próprio registo de membro, mas nunca
-- leia, edite ou apague dados de outros membros.
create policy "members_insert_public_register"
on public.members
for insert
to anon
with check (true);


-- ---------------------------------------------------------------------
-- 3. Tabela USERS (gestão de utilizadores/roles)
-- ---------------------------------------------------------------------
alter table public.users enable row level security;

-- Um utilizador pode ver a própria linha (para a app saber o seu role)
create policy "users_select_self"
on public.users
for select
to authenticated
using (id = auth.uid());

-- Apenas super_admin pode ver a lista completa de utilizadores
create policy "users_select_super_admin"
on public.users
for select
to authenticated
using (public.current_user_role() = 'super_admin');

-- Apenas super_admin pode criar/alterar/remover utilizadores e roles
create policy "users_insert_super_admin"
on public.users
for insert
to authenticated
with check (public.current_user_role() = 'super_admin');

create policy "users_update_super_admin"
on public.users
for update
to authenticated
using (public.current_user_role() = 'super_admin')
with check (public.current_user_role() = 'super_admin');

create policy "users_delete_super_admin"
on public.users
for delete
to authenticated
using (public.current_user_role() = 'super_admin');


-- ---------------------------------------------------------------------
-- 4. Bootstrap do primeiro super_admin
-- ---------------------------------------------------------------------
-- As políticas acima exigem que já exista um super_admin para gerir
-- a tabela `users`. Para criar o primeiro registo, execute (uma única
-- vez, com a chave service_role no SQL Editor do Supabase, que ignora
-- RLS) algo como:
--
--   insert into public.users (id, email, role, created_at)
--   values ('<uuid-do-utilizador>', 'email@dominio.com', 'super_admin', now())
--   on conflict (id) do update set role = 'super_admin';
--
-- O <uuid-do-utilizador> é o `id` do utilizador em auth.users
-- (Authentication -> Users no painel do Supabase).
