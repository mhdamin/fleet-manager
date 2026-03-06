import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Car,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';

import AuditTrail from './components/AuditTrail';
import ChecklistManager from './components/Checklist/ChecklistManager';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import VehicleManagement from './components/VehicleManagement';
import { Button, FormField, IconButton, ModalShell, TextInput, cx } from './components/AppUI';
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthSession,
  getStoredAuthUser,
  isAuthenticated,
  login,
  saveAuthSession,
} from './services/api';
import { ViewState } from './types';

interface AuthUser {
  username: string;
  roles: string[];
}

const navSections: Array<{
  label: string;
  items: Array<{ view: ViewState; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }>;
}> = [
  {
    label: 'Main Menu',
    items: [
      { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { view: 'vehicles', label: 'Vehicle Management', icon: Car },
      { view: 'checklist', label: 'Checklist Management', icon: ClipboardList },
    ],
  },
  {
    label: 'Administration',
    items: [
      { view: 'audit', label: 'Audit Trail', icon: FileText },
      { view: 'reports', label: 'Reports & Print', icon: Settings },
      { view: 'users', label: 'User Management', icon: Users },
    ],
  },
];

const viewLabels: Record<ViewState, string> = {
  dashboard: 'Dashboard',
  vehicles: 'Vehicle Management',
  checklist: 'Checklist Management',
  audit: 'Audit Trail',
  reports: 'Reports & Print',
  users: 'User Management',
};

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'FG';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [authUser, setAuthUser] = useState<AuthUser | null>(isAuthenticated() ? getStoredAuthUser() : null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const authenticated = Boolean(authUser && isAuthenticated());

  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthSession();
      setAuthUser(null);
      setCurrentView('dashboard');
      setLoginError('Your session has expired. Please log in again.');
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!isAccountMenuOpen) {
        return;
      }

      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (isAccountModalOpen) {
        setIsAccountModalOpen(false);
      }
      if (isAccountMenuOpen) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [isAccountMenuOpen, isAccountModalOpen]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'vehicles':
        return <VehicleManagement />;
      case 'checklist':
        return <ChecklistManager />;
      case 'audit':
        return <AuditTrail />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setLoginError('Username and password are required.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const auth = await login(username.trim(), password);
      saveAuthSession(auth);
      setAuthUser({ username: auth.username, roles: auth.roles || [] });
      setPassword('');
      setCurrentView('dashboard');
    } catch {
      clearAuthSession();
      setAuthUser(null);
      setLoginError('Invalid username or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthUser(null);
    setUsername('');
    setPassword('');
    setCurrentView('dashboard');
    setLoginError(null);
    setIsAccountMenuOpen(false);
    setIsAccountModalOpen(false);
  };

  if (!authenticated) {
    return (
      <div className="app-login">
        <form onSubmit={handleLoginSubmit} className="app-login__panel">
          <div className="app-login__eyebrow">Fleet Operations</div>
          <h1 className="app-login__title">FleetGuard Login</h1>
          <p className="app-login__subtitle">Sign in to continue to the fleet manager console.</p>

          <div className="app-grid">
            <FormField label="Username" htmlFor="username">
              <TextInput
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
              />
            </FormField>
            <FormField label="Password" htmlFor="password">
              <TextInput
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </FormField>
          </div>

          {loginError ? <p className="app-warning-text" style={{ marginTop: 16 }}>{loginError}</p> : null}

          <Button type="submit" disabled={isLoggingIn} className="w-full" style={{ width: '100%', marginTop: 24 }}>
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    );
  }

  const rolesLabel = authUser?.roles?.join(', ') || 'No Roles';

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <div className="app-user-chip">
            <Car size={22} />
            <div>
              <div style={{ fontWeight: 700 }}>FleetGuard</div>
              <div className="app-kicker">Manager Console</div>
            </div>
          </div>
        </div>

        <nav className="app-sidebar__nav">
          {navSections.map((section) => (
            <div key={section.label} className="app-sidebar__group">
              <p className="app-sidebar__label">{section.label}</p>
              <div className="app-grid" style={{ gap: 4 }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      onClick={() => setCurrentView(item.view)}
                      className={cx('app-nav-item', currentView === item.view && 'app-nav-item--active')}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <div className="app-split">
            <div className="app-user-chip" style={{ minWidth: 0 }}>
              <div className="app-avatar">{getInitials(authUser?.username || 'Fleet Guard')}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser?.username}</div>
                <div className="app-kicker" style={{ textTransform: 'none' }}>{authUser?.roles?.[0] || 'User'}</div>
              </div>
            </div>
            <IconButton type="button" onClick={handleLogout} aria-label="Logout" title="Logout">
              <LogOut size={16} />
            </IconButton>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="app-user-chip">
            <div className="app-avatar">
              <Car size={16} />
            </div>
            <div className="app-topbar__crumb">
              Rental Fleet Manager / <strong>{viewLabels[currentView]}</strong>
            </div>
            <div style={{ fontWeight: 700 }}>FleetGuard</div>
          </div>

          <div className="app-topbar__actions">
            <div className="app-search">
              <Search size={16} />
              <TextInput placeholder="Search..." style={{ width: 240 }} />
            </div>
            <IconButton type="button" aria-label="Notifications">
              <Bell size={18} />
            </IconButton>
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                className="app-nav-item"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu"
                style={{ width: 'auto', padding: '6px 10px' }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>{authUser?.username || 'User'}</span>
                <div className="app-avatar">
                  <User size={16} />
                </div>
                <ChevronDown size={14} style={{ transform: isAccountMenuOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }} />
              </button>
              {isAccountMenuOpen ? (
                <div
                  id="account-menu"
                  className="app-card"
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 240, padding: 8, zIndex: 20 }}
                >
                  <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{authUser?.username || 'User'}</div>
                    <div className="app-muted" style={{ fontSize: 12, marginTop: 4 }}>{rolesLabel}</div>
                  </div>
                  <div className="app-grid" style={{ gap: 4, paddingTop: 8 }}>
                    <button
                      type="button"
                      className="app-nav-item"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setIsAccountModalOpen(true);
                      }}
                    >
                      My Account
                    </button>
                    <button type="button" className="app-nav-item" onClick={handleLogout}>
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="app-page">
          <div className="app-page-inner">{renderContent()}</div>
        </div>
      </main>

      {isAccountModalOpen ? (
        <ModalShell
          title="My Account"
          onClose={() => setIsAccountModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsAccountModalOpen(false)}>
                Close
              </Button>
              <Button variant="danger" type="button" onClick={handleLogout}>
                Logout
              </Button>
            </>
          }
        >
          <div className="app-grid" style={{ gap: 16 }}>
            <div>
              <div className="app-kicker">Username</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{authUser?.username || 'User'}</div>
            </div>
            <div>
              <div className="app-kicker">Roles</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{rolesLabel}</div>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default App;
