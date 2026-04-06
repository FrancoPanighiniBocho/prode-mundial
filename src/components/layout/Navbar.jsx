import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n/useI18n';

export default function Navbar({ onLoginClick, onAdminClick }) {
  const { role, user, isAdmin, logout } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const publicLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/leaderboard', label: t('nav.leaderboard') },
    { to: '/groups', label: t('nav.groups') },
    { to: '/bracket', label: t('nav.bracket') },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {publicLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
              end={link.to === '/'}
            >
              {link.label}
            </NavLink>
          ))}
          {role !== 'spectator' && (
            <NavLink to="/predictions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              {t('nav.predictions')}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link nav-link-admin ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              {t('nav.admin')}
            </NavLink>
          )}
        </div>

        <div className="navbar-auth">
          {role === 'spectator' ? (
            <>
              <button className="btn btn-small btn-primary" onClick={onLoginClick}>{t('nav.login')}</button>
              <button className="btn btn-small btn-secondary" onClick={onAdminClick}>Admin</button>
            </>
          ) : (
            <div className="navbar-user">
              <span className="navbar-username">
                {user?.display_name || user?.username || 'Admin'}
                {isAdmin && <span className="admin-badge">ADMIN</span>}
              </span>
              <button className="btn btn-small btn-secondary" onClick={logout}>{t('nav.logout')}</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
