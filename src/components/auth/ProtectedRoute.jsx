import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n/useI18n';
import LoginModal from './LoginModal';

export default function ProtectedRoute({ requiredRole, children }) {
  const { role, isAdmin } = useAuth();
  const { t } = useI18n();
  const [showLogin, setShowLogin] = useState(false);

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'participant' && role === 'spectator') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 12 }}>
          {t('auth.loginRequired')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          {t('auth.loginRequiredMsg')}
        </p>
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
          {t('nav.login')}
        </button>
        {showLogin ? <LoginModal onClose={() => setShowLogin(false)} /> : null}
      </div>
    );
  }

  return children;
}
