import React, { useState } from 'react';
import { useHistory } from 'react-router';
import MemberForm from '../components/MemberForm';
import { supabase } from '../services/supabase';
import { Member } from '../types/member';
import { showFeedback, confirmAction } from '../services/feedback';
import { getErrorMessage, SupabaseError } from '../utils/errorHandler';
import './AddMember.css';

// Spinner minimalista
const Spinner = () => <div className="spinner"></div>;

const AddMember = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (memberData: Partial<Member>) => {
    if (!memberData.data_nascimento) {
      showFeedback('Por favor, preencha a Data de Nascimento', 'warning');
      return;
    }

    const confirmed = await confirmAction(
      'Confirmar cadastro',
      'Deseja guardar este novo membro?',
      'Guardar',
      'Cancelar'
    );
    if (!confirmed) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('members')
        .insert([{
          ...memberData,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        showFeedback(getErrorMessage(error as SupabaseError), 'error');
        return;
      }

      showFeedback('Membro cadastrado com sucesso!', 'success');
      history.push('/app/members');
    } catch (err) {
      console.error('Erro ao cadastrar membro:', err);
      showFeedback(getErrorMessage(err as SupabaseError), 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    history.goBack();
  };

  return (
    <div className="add-member-page scrollable-content">
      {isLoading && (
        <div className="loading-overlay">
          <Spinner />
          <p>Cadastrando...</p>
        </div>
      )}
      
      <header className="page-header">
        <h1>Ekklesia - Novo Membro</h1>
      </header>

      <main className="form-main">
        <div className="form-header">
          <h2>Cadastro de Membro</h2>
          <p>Preencha os dados do novo membro</p>
        </div>
        
        <MemberForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
};

export default AddMember;