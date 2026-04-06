import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { I18nProvider } from './i18n/I18nContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Groups from './pages/Groups';
import Bracket from './pages/Bracket';
import MatchDetail from './pages/MatchDetail';
import MyPredictions from './pages/MyPredictions';
import InitialPredictions from './pages/InitialPredictions';
import PlayerStats from './pages/PlayerStats';
import NotFound from './pages/NotFound';

import AdminPanel from './pages/admin/AdminPanel';
import AdminUsers from './pages/admin/AdminUsers';
import AdminResults from './pages/admin/AdminResults';
import AdminKnockout from './pages/admin/AdminKnockout';
import AdminSeedData from './pages/admin/AdminSeedData';
import AdminMissingPredictions from './pages/admin/AdminMissingPredictions';
import AdminTournaments from './pages/admin/AdminTournaments';

export default function App() {
  return (
    <I18nProvider>
      <TournamentProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              {/* Public */}
              <Route index element={<Home />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/bracket" element={<Bracket />} />
              <Route path="/matches/:matchId" element={<MatchDetail />} />
              <Route path="/players/:userId" element={<PlayerStats />} />

              {/* Participant-only */}
              <Route path="/predictions" element={
                <ProtectedRoute requiredRole="participant">
                  <MyPredictions />
                </ProtectedRoute>
              } />
              <Route path="/predictions/initial" element={
                <ProtectedRoute requiredRole="participant">
                  <InitialPredictions />
                </ProtectedRoute>
              } />

              {/* Admin-only */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="results" replace />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="results" element={<AdminResults />} />
                <Route path="knockout" element={<AdminKnockout />} />
                <Route path="seed" element={<AdminSeedData />} />
                <Route path="missing" element={<AdminMissingPredictions />} />
                <Route path="tournaments" element={<AdminTournaments />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
      </TournamentProvider>
    </I18nProvider>
  );
}
