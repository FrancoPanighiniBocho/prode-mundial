import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n';

export default function AdminPanel() {
  const { t } = useI18n();

  const links = [
    { to: '/admin/results', label: t('admin.results') },
    { to: '/admin/users', label: t('admin.users') },
    { to: '/admin/knockout', label: t('admin.knockout') },
    { to: '/admin/seed', label: t('admin.seed') },
    { to: '/admin/missing', label: t('admin.missing') },
    { to: '/admin/tournaments', label: t('admin.tournaments') },
  ];

  return (
    <div className="page-admin">
      <h2 className="page-title">{t('admin.title')}</h2>
      <div className="admin-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
