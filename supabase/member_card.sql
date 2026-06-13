-- =====================================================================
-- Cartão de membro: foto, storage bucket e verificação pública
-- =====================================================================
--
-- Este script prepara a base de dados para a funcionalidade de
-- "Cartão de Membro":
-- 1. Adiciona a coluna `foto_url` à tabela `members`.
-- 2. Cria o bucket de Storage `member-photos` (leitura pública,
--    escrita só para admin/super_admin).
-- 3. Cria a função `get_member_public_card`, usada pela página
--    pública /verificar/:id (lida pelo QR code do cartão) para
--    devolver apenas os dados públicos do membro.
--
-- PRÉ-REQUISITO: a função public.current_user_role() definida em
-- rls_policies.sql. Se ainda não executaste esse ficheiro, execute-o
-- antes deste.
--
-- COMO USAR: execute no SQL Editor do Supabase.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Coluna foto_url
-- ---------------------------------------------------------------------
alter table public.members
  add column if not exists foto_url text;


-- ---------------------------------------------------------------------
-- 2. Bucket de Storage para fotos dos membros
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

-- Leitura pública das fotos (necessário para o cartão/QR funcionarem
-- sem login)
create policy "member_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'member-photos');

-- Apenas admin/super_admin podem enviar/alterar/remover fotos
create policy "member_photos_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'member-photos'
  and public.current_user_role() in ('admin', 'super_admin')
);

create policy "member_photos_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'member-photos'
  and public.current_user_role() in ('admin', 'super_admin')
);

create policy "member_photos_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'member-photos'
  and public.current_user_role() in ('admin', 'super_admin')
);


-- ---------------------------------------------------------------------
-- 3. Função RPC para a página pública de verificação (/verificar/:id)
-- ---------------------------------------------------------------------
-- Devolve apenas os campos que podem ser mostrados publicamente quando
-- alguém escaneia o QR code do cartão. Não expõe data de nascimento,
-- telefone, endereço, etc.
create or replace function public.get_member_public_card(p_id uuid)
returns table (
  nome_completo text,
  funcao text,
  regiao text,
  paroquia text,
  estado text,
  foto_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select nome_completo, funcao, regiao, paroquia, estado, foto_url
  from public.members
  where id = p_id;
$$;

grant execute on function public.get_member_public_card(uuid) to anon, authenticated;
