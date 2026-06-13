import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, arrowBackOutline, checkmarkOutline } from 'ionicons/icons';
import { supabase } from '../services/supabase';
import { showFeedback } from '../services/feedback';
import { getErrorMessage } from '../utils/errorHandler';
import { paroquiasPorRegiao } from '../types/member';
import './PublicRegister.css';

type Regiao = keyof typeof paroquiasPorRegiao;

type FormData = {
  nomeCompleto: string;
  dataNascimento: string;
  genero: string;
  telefone: string;
  regiao: Regiao | '';
  paroquia: string;
  funcao: string;
};

const GENEROS = ['Masculino', 'Feminino'];
const FUNCOES = ['Membro Normal', 'Monitor', 'Evangelista', 'Pastor'];
const TOTAL_PERGUNTAS = 7;

const PublicRegister: React.FC = () => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [form, setForm] = useState<FormData>({
    nomeCompleto: '', dataNascimento: '', genero: '',
    telefone: '', regiao: '', paroquia: '', funcao: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const paroquias = form.regiao ? paroquiasPorRegiao[form.regiao] : [];

  const goNext = () => { setDirection('forward'); setStep(s => s + 1); };
  const goBack = () => { setDirection('back');    setStep(s => s - 1); };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return form.nomeCompleto.trim().length >= 3;
      case 2: return !!form.dataNascimento;
      case 3: return !!form.genero;
      case 4: return true;
      case 5: return !!form.regiao;
      case 6: return !!form.paroquia;
      case 7: return !!form.funcao;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Verificar se já existe um membro com o mesmo nome e data de nascimento,
      // para evitar registos duplicados da mesma pessoa.
      const { data: jaExiste, error: checkError } = await supabase.rpc('check_member_exists', {
        p_nome_completo: form.nomeCompleto.trim(),
        p_data_nascimento: form.dataNascimento,
      });

      if (checkError) {
        console.error('Erro ao verificar duplicados:', checkError);
      } else if (jaExiste) {
        showFeedback(
          'Já existe um registo com este nome e data de nascimento. Se já se registou antes, não precisa de submeter novamente. Se isto for um engano, contacte um administrador.',
          'warning',
          6000
        );
        return;
      }

      const { error } = await supabase.from('members').insert([{
        nome_completo: form.nomeCompleto.trim(),
        data_nascimento: form.dataNascimento,
        genero: form.genero,
        telefone: form.telefone.trim() || null,
        regiao: form.regiao,
        paroquia: form.paroquia,
        funcao: form.funcao,
        created_at: new Date().toISOString(),
      }]);

      if (error) {
        console.error('Supabase insert error:', error);
        showFeedback(getErrorMessage(error), 'error');
        return;
      }
      goNext();
    } catch {
      showFeedback('Ocorreu um erro inesperado. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAndAdvance = (field: keyof FormData, value: string) => {
    setForm(f => ({
      ...f,
      [field]: value,
      ...(field === 'regiao' ? { paroquia: '' } : {}),
    }));
    setTimeout(goNext, 180);
  };

  const animClass = direction === 'back' ? 'back-in' : '';
  const isChoiceStep = [3, 5, 6, 7].includes(step);
  const isConfirmStep = step === 8;
  const isSuccessStep = step === 9;

  const progress = step === 0 || isSuccessStep
    ? (isSuccessStep ? 100 : 0)
    : (step / (TOTAL_PERGUNTAS + 1)) * 100;

  const renderStep = () => {
    switch (step) {
      /* ── Boas-vindas ── */
      case 0:
        return (
          <div className={`register-step ${animClass}`} key={0}>
            <div className="welcome-icon-box">⛪</div>
            <h1 className="welcome-title">Bem-vindo à família ICUM / SNF</h1>
            <p className="welcome-text">
              Este formulário serve para registar os seus dados como membro da nossa comunidade.
              É simples e rápido!
            </p>
            <ul className="welcome-steps">
              {[
                'Apenas 7 perguntas curtas',
                'Funciona bem no telemóvel',
                'Os seus dados ficam guardados em segurança',
                'Um administrador confirmará o registo em breve',
              ].map((txt, i) => (
                <li key={i} className="welcome-step-item">
                  <span className="welcome-step-dot">{i + 1}</span>
                  {txt}
                </li>
              ))}
            </ul>
          </div>
        );

      /* ── Pergunta 1: Nome ── */
      case 1:
        return (
          <div className={`register-step ${animClass}`} key={1}>
            <p className="step-number">Pergunta 1 de {TOTAL_PERGUNTAS}</p>
            <h2 className="step-question">Qual é o seu nome completo?</h2>
            <p className="step-hint">
              Escreva o nome tal como aparece no seu documento de identidade (BI ou passaporte).
            </p>
            <input
              className="step-input"
              type="text"
              placeholder="Ex: Maria João da Silva"
              value={form.nomeCompleto}
              onChange={e => setForm(f => ({ ...f, nomeCompleto: e.target.value }))}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && canProceed()) goNext(); }}
            />
          </div>
        );

      /* ── Pergunta 2: Data de nascimento ── */
      case 2:
        return (
          <div className={`register-step ${animClass}`} key={2}>
            <p className="step-number">Pergunta 2 de {TOTAL_PERGUNTAS}</p>
            <h2 className="step-question">Quando nasceu?</h2>
            <p className="step-hint">
              A sua data de nascimento ajuda-nos a manter os registos correctos e a celebrar
              os aniversários da comunidade.
            </p>
            <input
              className="step-input"
              type="date"
              value={form.dataNascimento}
              onChange={e => setForm(f => ({ ...f, dataNascimento: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        );

      /* ── Pergunta 3: Género ── */
      case 3:
        return (
          <div className={`register-step ${animClass}`} key={3}>
            <p className="step-number">Pergunta 3 de {TOTAL_PERGUNTAS}</p>
            <h2 className="step-question">Qual é o seu género?</h2>
            <p className="step-hint">Toque numa opção para continuar automaticamente.</p>
            <div className="choice-grid two-col">
              {GENEROS.map((g, i) => (
                <button
                  key={g}
                  className={`choice-btn ${form.genero === g ? 'selected' : ''}`}
                  onClick={() => selectAndAdvance('genero', g)}
                >
                  <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                  {g}
                </button>
              ))}
            </div>
          </div>
        );

      /* ── Pergunta 4: Telefone (opcional) ── */
      case 4:
        return (
          <div className={`register-step ${animClass}`} key={4}>
            <p className="step-number">Pergunta 4 de {TOTAL_PERGUNTAS}</p>
            <h2 className="step-question">
              Qual é o seu número de telefone?
              <span className="optional-badge">(opcional)</span>
            </h2>
            <p className="step-hint">
              O número de telefone permite que o pastor ou administrador da sua região
              entre em contacto consigo para confirmar o registo ou enviar informações da comunidade.
              Pode deixar em branco se preferir.
            </p>
            <input
              className="step-input"
              type="tel"
              placeholder="Ex: +258 84 123 4567"
              value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') goNext(); }}
            />
          </div>
        );

      /* ── Pergunta 5: Região ── */
      case 5:
        return (
          <div className={`register-step ${animClass}`} key={5}>
            <p className="step-number">Pergunta 5 de {TOTAL_PERGUNTAS}</p>
            <h2 className="step-question">Em que região se encontra?</h2>
            <p className="step-hint">
              Selecione a região onde a sua paróquia está localizada.
              A ICUM/SNF está presente em cinco regiões de Moçambique.
            </p>
            <div className="choice-grid">
              {Object.keys(paroquiasPorRegiao).map((r, i) => (
                <button
                  key={r}
                  className={`choice-btn ${form.regiao === r ? 'selected' : ''}`}
                  onClick={() => selectAndAdvance('regiao', r)}
                >
                  <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                  {r}
                </button>
              ))}
            </div>
          </div>
        );

      /* ── Pergunta 6: Paróquia ── */
      case 6:
        return (
          <div className={`register-step ${animClass}`} key={6}>
            <p className="step-number">Pergunta 6 de {TOTAL_PERGUNTAS}</p>
            <h2 className="step-question">Qual é a sua paróquia?</h2>
            <p className="step-hint">
              Paróquias da região <strong style={{ color: '#fff' }}>{form.regiao}</strong>.
              Toque no nome da sua paróquia para continuar.
            </p>
            <div className="choice-grid choice-scroll">
              {paroquias.map((p, i) => (
                <button
                  key={p}
                  className={`choice-btn ${form.paroquia === p ? 'selected' : ''}`}
                  onClick={() => selectAndAdvance('paroquia', p)}
                >
                  <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                  {p}
                </button>
              ))}
            </div>
          </div>
        );

      /* ── Pergunta 7: Função ── */
      case 7:
        return (
          <div className={`register-step ${animClass}`} key={7}>
            <p className="step-number">Pergunta 7 de {TOTAL_PERGUNTAS}</p>
            <h2 className="step-question">Qual é a sua função na igreja?</h2>
            <p className="step-hint">
              Selecione a opção que melhor descreve o seu papel dentro da comunidade.
            </p>
            <div className="choice-grid">
              {FUNCOES.map((f, i) => (
                <button
                  key={f}
                  className={`choice-btn ${form.funcao === f ? 'selected' : ''}`}
                  onClick={() => selectAndAdvance('funcao', f)}
                >
                  <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                  {f}
                </button>
              ))}
            </div>
          </div>
        );

      /* ── Confirmação ── */
      case 8:
        return (
          <div className={`register-step ${animClass}`} key={8}>
            <p className="step-number">Quase pronto!</p>
            <h2 className="step-question">Os seus dados estão correctos?</h2>
            <p className="step-hint">
              Verifique a informação abaixo antes de submeter. Pode voltar atrás para corrigir qualquer campo.
            </p>
            <ul className="confirm-list">
              {([
                { label: 'Nome Completo',        value: form.nomeCompleto },
                { label: 'Data de Nascimento',   value: form.dataNascimento },
                { label: 'Género',               value: form.genero },
                form.telefone ? { label: 'Telefone', value: form.telefone } : null,
                { label: 'Região',               value: form.regiao },
                { label: 'Paróquia',             value: form.paroquia },
                { label: 'Função na Igreja',     value: form.funcao },
              ] as const).filter(Boolean).map((item: any) => (
                <li key={item.label} className="confirm-item">
                  <span className="confirm-label">{item.label}</span>
                  <span className="confirm-value">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      /* ── Sucesso ── */
      case 9:
        return (
          <div className={`register-step ${animClass}`} key={9}>
            <div className="success-check">
              <IonIcon icon={checkmarkOutline} />
            </div>
            <h2 className="success-title">Cadastro enviado!</h2>
            <p className="success-text">
              Os seus dados foram submetidos com sucesso.
              Um administrador irá rever e confirmar o seu registo em breve.
            </p>
            <p className="success-text">
              Obrigado por fazer parte da família ICUM / SNF! 🙏
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="register-page">
      <div className="register-progress">
        <div className="register-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="register-header">
        <span className="register-logo">⛪ Ekklesia</span>
        <Link to="/login" className="register-header-link">Já tem conta?</Link>
      </div>

      <div className="register-content">
        {renderStep()}
      </div>

      {/* Navegação */}
      {!isSuccessStep && (
        <div className="register-nav">
          {step > 0 ? (
            <button className="nav-back-btn" onClick={goBack} disabled={isLoading}>
              <IonIcon icon={arrowBackOutline} />
              Anterior
            </button>
          ) : <div />}

          {!isChoiceStep && (
            <button
              className="nav-next-btn"
              onClick={isConfirmStep ? handleSubmit : goNext}
              disabled={!canProceed() || isLoading}
            >
              {isLoading
                ? 'Enviando...'
                : isConfirmStep
                  ? <><IonIcon icon={checkmarkOutline} /> Submeter</>
                  : <>Continuar <IonIcon icon={arrowForwardOutline} /></>
              }
            </button>
          )}
          {isChoiceStep && <div />}
        </div>
      )}

      {isSuccessStep && (
        <div className="register-nav" style={{ justifyContent: 'center' }}>
          <button
            className="nav-next-btn"
            onClick={() => {
              setStep(0);
              setDirection('forward');
              setForm({ nomeCompleto: '', dataNascimento: '', genero: '', telefone: '', regiao: '', paroquia: '', funcao: '' });
            }}
          >
            Registar outro membro
            <IonIcon icon={arrowForwardOutline} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicRegister;
