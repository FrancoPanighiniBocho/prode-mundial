import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LoginModal from '../auth/LoginModal';
import AdminLoginModal from '../auth/AdminLoginModal';

export default function AppShell() {
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">
            <span className="title-accent">PRODE</span>
            <span className="title-separator"> </span>
            <span className="title-main">MUNDIAL 2026</span>
          </h1>
        </div>
      </header>

      <Navbar
        onLoginClick={() => setShowLogin(true)}
        onAdminClick={() => setShowAdmin(true)}
      />

      <main className="app-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>Prode Mundial 2026</p>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showAdmin && <AdminLoginModal onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
