import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
  speedometerOutline,
  peopleOutline,
  personAddOutline,
  shieldCheckmarkOutline,
  informationCircleOutline,
  logOutOutline,
  menuOutline,
  closeOutline,
} from 'ionicons/icons';
import { supabase } from '../services/supabase';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
  hasPermission?: boolean;
  hasUserManagement?: boolean;
}

const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="about-overlay" onClick={onClose}>
    <div className="about-modal" onClick={(e) => e.stopPropagation()}>
      <button className="about-close" onClick={onClose}>
        <IonIcon icon={closeOutline} />
      </button>
      <div className="about-logo">E</div>
      <h2 className="about-title">Ekklesia</h2>
      <p className="about-subtitle">Sistema de Gestão de Membros</p>
      <div className="about-divider" />
      <ul className="about-info">
        <li><span>Organização</span><span>ICUM / SNF</span></li>
        <li><span>Versão</span><span>1.0.0</span></li>
        <li><span>Plataforma</span><span>Web / Android</span></li>
        <li><span>Base de dados</span><span>Supabase (PostgreSQL)</span></li>
        <li><span>Desenvolvido por</span><span>Alexandre Sitole</span></li>
        <li><span>Contacto</span><span>alexandre@equipmoz.org</span></li>
      </ul>
      <div className="about-divider" />
      <p className="about-copy">&copy; 2024 Ekklesia — Todos os direitos reservados</p>
    </div>
  </div>
);

const MainLayout: React.FC<MainLayoutProps> = ({ children, hasPermission = false, hasUserManagement = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const history = useHistory();
  const location = useLocation();

  const navigateTo = (path: string) => {
    history.push(path);
    if (window.innerWidth <= 768) setMenuOpen(false);
  };

  const currentPath = location.pathname;

  return (
    <div className="app-container">
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      <div className={`sidemenu ${menuOpen ? 'open' : ''}`}>
        {/* Logo area */}
        <div className="sidemenu-logo">
          <div className="sidemenu-logo-icon">E</div>
          <div className="sidemenu-logo-text">
            <span className="sidemenu-app-name">Ekklesia</span>
            <span className="sidemenu-org">ICUM / SNF</span>
          </div>
          <button className="close-menu-btn" onClick={() => setMenuOpen(false)}>
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="sidemenu-nav">
          <div
            className={`menu-item ${currentPath.includes('/home') ? 'active' : ''}`}
            onClick={() => navigateTo('/app/home')}
          >
            <IonIcon icon={speedometerOutline} className="menu-icon" />
            <span className="menu-text">Dashboard</span>
          </div>

          <div
            className={`menu-item ${currentPath.includes('/members') ? 'active' : ''}`}
            onClick={() => navigateTo('/app/members')}
          >
            <IonIcon icon={peopleOutline} className="menu-icon" />
            <span className="menu-text">Membros</span>
          </div>

          {hasPermission && (
            <div
              className={`menu-item ${currentPath.includes('/add') ? 'active' : ''}`}
              onClick={() => navigateTo('/app/add')}
            >
              <IonIcon icon={personAddOutline} className="menu-icon" />
              <span className="menu-text">Adicionar Membro</span>
            </div>
          )}

          {hasUserManagement && (
            <div
              className={`menu-item ${currentPath.includes('/users') ? 'active' : ''}`}
              onClick={() => navigateTo('/app/users')}
            >
              <IonIcon icon={shieldCheckmarkOutline} className="menu-icon" />
              <span className="menu-text">Gerenciar Usuários</span>
            </div>
          )}
        </nav>

        {/* Fixed bottom section */}
        <div className="sidemenu-bottom">
          <div className="menu-separator" />
          <div className="menu-item" onClick={() => { setShowAbout(true); if (window.innerWidth <= 768) setMenuOpen(false); }}>
            <IonIcon icon={informationCircleOutline} className="menu-icon" />
            <span className="menu-text">Sobre o Sistema</span>
          </div>
          <div
            className="menu-item menu-item-logout"
            onClick={async () => {
              await supabase.auth.signOut();
              history.push('/login');
            }}
          >
            <IonIcon icon={logOutOutline} className="menu-icon" />
            <span className="menu-text">Sair</span>
          </div>
        </div>
      </div>

      <div className={`main-content ${menuOpen ? 'menu-open' : ''}`}>
        <button className="menu-toggle" onClick={() => setMenuOpen(true)}>
          <IonIcon icon={menuOutline} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
