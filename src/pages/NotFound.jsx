import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div style={{ textAlign: 'center', padding: '64px 16px' }}>
      <h2 className="page-title" style={{ borderBottom: 'none' }}>{t('common.notFound')}</h2>
      <Link to="/" className="btn btn-primary">{t('nav.home')}</Link>
    </div>
  );
}
