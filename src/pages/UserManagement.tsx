import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { showFeedback, confirmAction } from '../services/feedback';
import { getAuthErrorMessage, getErrorMessage, SupabaseError } from '../utils/errorHandler';
import './UserManagement.css';

// Interface para usuário
interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

// Componente de Spinner para loadings
const Spinner = () => <div className="spinner"></div>;

const UserManagement: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        role: 'user'
    });
    const [users, setUsers] = useState<User[]>([]);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [editRole, setEditRole] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            showFeedback('Erro ao carregar usuários', 'error');
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        const email = newUser.email.trim();

        if (!email || !newUser.password.trim()) {
            showFeedback('Email e senha são obrigatórios', 'warning');
            return;
        }

        if (newUser.password.trim().length < 6) {
            showFeedback('A senha deve ter pelo menos 6 caracteres', 'warning');
            return;
        }

        try {
            setIsLoading(true);

            // Criar usuário na autenticação do Supabase
            const { data, error } = await supabase.auth.signUp({
                email,
                password: newUser.password,
                options: {
                    data: { role: newUser.role }
                }
            });

            if (error) {
                showFeedback(getAuthErrorMessage(error), 'error');
                return;
            }

            if (!data.user) {
                showFeedback('Não foi possível criar o usuário. Tente novamente.', 'error');
                return;
            }

            // Adicionar à tabela de usuários
            const { error: insertError } = await supabase.from('users').insert([{
                id: data.user.id,
                email,
                role: newUser.role,
                created_at: new Date()
            }]);

            if (insertError) {
                showFeedback(getErrorMessage(insertError as SupabaseError), 'error');
                return;
            }

            if (!data.session) {
                showFeedback(
                    'Usuário criado! Foi enviado um email de confirmação para ' + email + '. O acesso só funcionará após a confirmação.',
                    'success',
                    6000
                );
            } else {
                showFeedback('Usuário criado com sucesso!', 'success');
            }

            setNewUser({ email: '', password: '', role: 'user' });
            fetchUsers();
        } catch (error) {
            showFeedback(getAuthErrorMessage(error), 'error');
            console.error('Error creating user:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEditRole = async (userId: string) => {
        if (!editRole) {
            showFeedback('Selecione uma função', 'warning');
            return;
        }
        
        try {
            setIsLoading(true);
            
            // Atualizar na tabela de usuários
            const { error } = await supabase
                .from('users')
                .update({ role: editRole })
                .eq('id', userId);

            if (error) throw error;
            
            showFeedback('Função atualizada com sucesso!', 'success');
            setEditMode(null);
            fetchUsers();
        } catch (error) {
            showFeedback(getErrorMessage(error as SupabaseError), 'error');
            console.error('Error updating role:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteUser = async (userId: string, userEmail: string) => {
        const confirmed = await confirmAction(
            'Confirmar exclusão',
            `Tem certeza que deseja excluir o usuário ${userEmail}?`,
            'Excluir',
            'Cancelar'
        );
        
        if (!confirmed) return;
        
        try {
            setIsLoading(true);
            
            // Remover da tabela de usuários
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            
            showFeedback('Usuário removido com sucesso!', 'success');
            fetchUsers();
        } catch (error) {
            showFeedback(getErrorMessage(error as SupabaseError), 'error');
            console.error('Error deleting user:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const startEdit = (userId: string, currentRole: string) => {
        setEditMode(userId);
        setEditRole(currentRole);
    };

    return (
        <div className="user-management-page">
            {isLoading && (
                <div className="loading-overlay">
                    <Spinner />
                    <p>Processando...</p>
                </div>
            )}
            
            <header className="page-header">
                <h1>Gerenciar Usuários</h1>
            </header>

            <main className="user-content">
                <section className="new-user-section">
                    <div className="card">
                        <h2 className="card-title">Novo Usuário</h2>
                        <form onSubmit={handleCreateUser} className="user-form">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Senha</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Função</label>
                                <select
                                    id="role"
                                    value={newUser.role}
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="user">Usuário Padrão</option>
                                </select>
                            </div>

                            <button type="submit" className="create-button">
                                Criar Usuário
                            </button>
                        </form>
                    </div>
                </section>

                <section className="users-list-section">
                    <div className="card">
                        <h2 className="card-title">Usuários do Sistema</h2>
                        
                        {users.length === 0 ? (
                            <p className="no-users">Nenhum usuário encontrado.</p>
                        ) : (
                            <div className="users-table-container">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>Função</th>
                                            <th>Data de Cadastro</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.email}</td>
                                                <td>
                                                    {editMode === user.id ? (
                                                        <select
                                                            value={editRole}
                                                            onChange={e => setEditRole(e.target.value)}
                                                            className="edit-select"
                                                        >
                                                            <option value="admin">Administrador</option>
                                                            <option value="user">Usuário Padrão</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`role-badge ${user.role}`}>
                                                            {user.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="actions">
                                                    {editMode === user.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditRole(user.id)}
                                                                className="save-button"
                                                            >
                                                                Salvar
                                                            </button>
                                                            <button
                                                                onClick={() => setEditMode(null)}
                                                                className="cancel-button"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => startEdit(user.id, user.role)}
                                                                className="edit-button"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id, user.email)}
                                                                className="delete-button"
                                                            >
                                                                Excluir
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default UserManagement;