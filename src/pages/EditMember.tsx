import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import MemberForm from '../components/MemberForm';
import { supabase } from '../services/supabase';
import { Member } from '../types/member';
import { showFeedback, confirmAction } from '../services/feedback';
import { getErrorMessage, SupabaseError } from '../utils/errorHandler';
import './EditMember.css';

// Spinner minimalista
const Spinner = () => <div className="spinner"></div>;

const EditMember: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [member, setMember] = useState<Member | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchMember();
        } else {
            showFeedback('ID do membro não fornecido', 'error');
            history.push('/app/members');
        }
    }, [id, history]);

    const fetchMember = async () => {
        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching member:', error);
                showFeedback('Erro ao carregar dados do membro', 'error');
                history.push('/app/members');
                return;
            }

            if (!data) {
                console.error('No data returned for member ID:', id);
                showFeedback('Membro não encontrado', 'error');
                history.push('/app/members');
                return;
            }

            setMember(data);
        } catch (error) {
            console.error('Exception while fetching member:', error);
            showFeedback('Erro ao acessar o servidor', 'error');
            history.push('/app/members');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (memberData: Partial<Member>) => {
        console.log('[EditMember] handleSubmit recebido memberData:', memberData);

        const confirmed = await confirmAction(
            'Confirmar alterações',
            'Deseja guardar as alterações deste membro?',
            'Guardar',
            'Cancelar'
        );
        console.log('[EditMember] Confirmação do utilizador:', confirmed);
        if (!confirmed) return;

        try {
            setIsSaving(true);

            const updatePayload = {
                ...memberData,
                updated_at: new Date().toISOString()
            };
            console.log('[EditMember] Enviando update para Supabase:', updatePayload);

            const { error, data } = await supabase
                .from('members')
                .update(updatePayload)
                .eq('id', id)
                .select();

            console.log('[EditMember] Resultado do update:', { data, error });

            if (error) {
                showFeedback(getErrorMessage(error as SupabaseError), 'error');
                return;
            }

            showFeedback('Membro atualizado com sucesso!', 'success');
            setMember(prev => prev ? { ...prev, ...memberData } : null);

            setTimeout(() => {
                history.push('/app/members');
            }, 1500);
        } catch (error) {
            console.error('Erro ao atualizar membro:', error);
            showFeedback(getErrorMessage(error as SupabaseError), 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        history.goBack();
    };

    const handleDelete = async () => {
        if (!member) return;

        try {
            const willDelete = await confirmAction(
                'Confirmar exclusão',
                `Deseja realmente excluir o membro "${member.nome_completo}"? Esta ação não pode ser desfeita.`,
                'Excluir',
                'Cancelar'
            );

            if (!willDelete) return;

            setIsLoading(true);
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', id);

            if (error) {
                showFeedback(getErrorMessage(error as SupabaseError), 'error');
                return;
            }

            showFeedback('Membro excluído com sucesso', 'success');
            history.push('/app/members');
        } catch (error) {
            console.error('Erro ao excluir membro:', error);
            showFeedback(getErrorMessage(error as SupabaseError), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || isSaving) {
        return (
            <div className="edit-member-page scrollable-content">
                <div className="loading-overlay">
                    <Spinner />
                    <p>{isSaving ? "Salvando alterações..." : "Carregando dados..."}</p>
                </div>
            </div>
        );
    }

    // If no member is found, show an error
    if (!member) {
        return (
            <div className="edit-member-page scrollable-content">
                <div className="error-container">
                    <h2>Membro não encontrado</h2>
                    <p>O membro que você está tentando editar não foi encontrado.</p>
                    <button 
                        className="primary-button" 
                        onClick={() => history.push('/app/members')}
                    >
                        Voltar à Lista de Membros
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-member-page scrollable-content">
            <header className="page-header">
                <h1>Ekklesia - Editar Membro</h1>
                <div className="header-actions">
                    <button 
                        onClick={handleDelete} 
                        className="delete-btn"
                    >
                        Excluir
                    </button>
                </div>
            </header>

            <main className="form-main">
                <div className="form-header">
                    <h2>{member.nome_completo}</h2>
                    <p>Atualize as informações do membro</p>
                </div>
                
                <MemberForm 
                    onSubmit={handleSubmit} 
                    onCancel={handleCancel}
                    initialData={member}
                />
            </main>
        </div>
    );
};

export default EditMember;