-- =====================================================================
-- Prevenção de registos duplicados de membros
-- =====================================================================
--
-- PROBLEMA: pessoas preenchem o formulário público de registo
-- (/register) mais de uma vez, criando registos duplicados do
-- mesmo membro.
--
-- SOLUÇÃO (duas camadas):
-- 1. Índice único no banco: impede definitivamente que existam dois
--    membros com o mesmo nome (ignorando maiúsculas/espaços) e a
--    mesma data de nascimento. Esta é a garantia real.
-- 2. Função RPC `check_member_exists`: permite que o formulário
--    público (utilizador "anon", sem permissão de leitura na tabela
--    members) verifique ANTES de submeter se já existe alguém com
--    esse nome + data de nascimento, mostrando um aviso amigável em
--    vez de um erro de banco de dados.
--
-- COMO USAR: execute no SQL Editor do Supabase, depois de
-- rls_policies.sql.
--
-- ATENÇÃO: se já existirem membros duplicados na tabela, o passo 1
-- vai falhar com erro de "duplicate key". Nesse caso, identifique e
-- remova/funda os duplicados antes de criar o índice (ver query de
-- diagnóstico no final deste ficheiro).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Índice único (nome normalizado + data de nascimento)
-- ---------------------------------------------------------------------
create unique index if not exists members_nome_nascimento_unique
on public.members (lower(trim(nome_completo)), data_nascimento);


-- ---------------------------------------------------------------------
-- 2. Função RPC para o formulário público verificar duplicados
-- ---------------------------------------------------------------------
create or replace function public.check_member_exists(
  p_nome_completo text,
  p_data_nascimento date
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.members
    where lower(trim(nome_completo)) = lower(trim(p_nome_completo))
      and data_nascimento = p_data_nascimento
  );
$$;

-- Permite que visitantes (formulário público) e utilizadores
-- autenticados chamem esta função. Ela só devolve true/false, nunca
-- expõe dados de outros membros.
grant execute on function public.check_member_exists(text, date) to anon, authenticated;


-- ---------------------------------------------------------------------
-- Diagnóstico: encontrar duplicados existentes antes de criar o índice
-- ---------------------------------------------------------------------
-- select lower(trim(nome_completo)) as nome, data_nascimento, count(*), array_agg(id)
-- from public.members
-- group by 1, 2
-- having count(*) > 1;
