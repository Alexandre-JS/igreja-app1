import { supabase } from '../services/supabase';

// O role oficial vem da tabela `users` (protegida por RLS no servidor).
// user_metadata é editável pelo próprio utilizador e serve apenas como
// fallback para contas ainda não migradas para a tabela `users`.
// Ver supabase/rls_policies.sql para a aplicação da fonte de verdade no servidor.
export const getUserRole = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'user';

    const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    return data?.role || user.user_metadata?.role || 'user';
};

// Apenas admin e super_admin podem criar/editar/eliminar membros
export const canManageMembers = async (): Promise<boolean> => {
    try {
        const role = await getUserRole();
        return ['super_admin', 'admin'].includes(role);
    } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
    }
};

// Qualquer utilizador autenticado pode visualizar membros
export const canViewMembers = async (): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    } catch (error) {
        return false;
    }
};

// Apenas super_admin pode gerir utilizadores
export const canManageUsers = async (): Promise<boolean> => {
    try {
        const role = await getUserRole();
        return role === 'super_admin';
    } catch (error) {
        console.error('Error checking user management permissions:', error);
        return false;
    }
};