import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';
import { supabase } from '../services/supabase';
import { showFeedback } from '../services/feedback';
import { getAuthErrorMessage } from '../utils/errorHandler';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) history.push('/app');
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) history.push('/app');
    });

    return () => subscription.unsubscribe();
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showFeedback('Por favor, preencha todos os campos', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        showFeedback(getAuthErrorMessage(error), 'error');
      } else if (data?.user) {
        showFeedback('Login realizado com sucesso!', 'success');
        history.push('/app');
      }
    } catch {
      showFeedback('Ocorreu um erro inesperado. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-container ${fadeIn ? 'fade-in' : ''}`}>
      {/* Bolhas de fundo decorativas */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-card">
        {/* Cabeçalho */}
        <div className="login-header">
          <img src="/logoigreja.jpg" alt="Logo" className="login-logo-icon" />
          <h1 className="app-name">Ekklesia</h1>
          <p className="app-description">Sistema de Gestão de Membros</p>
          <span className="church-tag">ICUM / SNF</span>
        </div>

        <div className="login-divider" />

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email */}
          <div className="input-wrapper">
            <IonIcon icon={mailOutline} className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          {/* Senha */}
          <div className="input-wrapper">
            <IonIcon icon={lockClosedOutline} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
            </button>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Autenticando...' : 'Aceder ao Sistema'}
          </button>

        </form>

        {/* Rodapé */}
        <div className="login-footer">
          <p className="login-register-link">
            Membro da ICUM/SNF? <Link to="/register">Registe-se aqui</Link>
          </p>
          <p>&copy; 2026 Ekklesia — Gestão Eclesiástica Inteligente</p>
          <p className="version">Versão 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
