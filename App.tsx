import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Car, ClipboardList, FileText,
  Settings, Users, Bell, Search, User, LogOut, Sun, Moon, ChevronDown
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import VehicleManagement from './components/VehicleManagement';
import ChecklistManager from './components/Checklist/ChecklistManager';
import AuditTrail from './components/AuditTrail';
import UserManagement from './components/UserManagement';
import Reports from './components/Reports';
import { ViewState } from './types';
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthSession,
  getStoredAuthUser,
  isAuthenticated,
  login,
  saveAuthSession,
} from './services/api';

interface AuthUser {
  username: string;
  roles: string[];
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [authUser, setAuthUser] = useState<AuthUser | null>(
    isAuthenticated() ? getStoredAuthUser() : null
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
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
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      case 'dashboard': return <Dashboard />;
      case 'vehicles': return <VehicleManagement />;
      case 'checklist': return <ChecklistManager />;
      case 'audit': return <AuditTrail />;
      case 'reports': return <Reports />;
      case 'users': return <UserManagement />;
      default: return <Dashboard />;
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
      setAuthUser({
        username: auth.username,
        roles: auth.roles || [],
      });
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
      <div className="min-h-screen flex bg-neutral-100 dark:bg-neutral-950">
        <div className="hidden lg:flex flex-1 items-center justify-center bg-neutral-950 dark:bg-neutral-900 px-8">
          <div className="text-center">
            <Car className="h-14 w-14 mx-auto mb-6 text-white/95" strokeWidth={2} />
            <h1 className="text-5xl font-semibold text-white tracking-tight">FleetGuard</h1>
            <p className="mt-4 text-lg text-neutral-400">"The Open Source Fleet Management Platform."</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-neutral-100 dark:bg-neutral-950">
          <form
            onSubmit={handleLoginSubmit}
            className="w-full max-w-lg"
          >
            <h2 className="text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Sign in</h2>
            <p className="mt-3 text-2xl text-neutral-500 dark:text-neutral-400">Enter your credentials to sign in</p>

            <div className="mt-12 space-y-6">
              <div>
                <label htmlFor="username" className="block text-2xl font-medium text-neutral-800 dark:text-neutral-200 mb-3">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full h-16 px-5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400 focus:border-transparent transition-colors"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-2xl font-medium text-neutral-800 dark:text-neutral-200 mb-3">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full h-16 px-5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400 focus:border-transparent transition-colors"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {loginError && (
              <p className="text-base text-red-600 dark:text-red-400 mt-5">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-8 h-16 rounded-xl bg-neutral-950 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-300 disabled:opacity-60 text-white dark:text-neutral-950 text-2xl font-medium transition-colors"
            >
              {isLoggingIn ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const rolesLabel = authUser?.roles?.join(', ') || 'No Roles';

  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-900 font-sans overflow-hidden dark:bg-neutral-950 dark:text-neutral-100">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-100 border-r border-neutral-300 flex flex-col shadow-sm z-20 hidden md:flex dark:bg-neutral-900 dark:border-neutral-800">
        <div className="p-6 border-b border-neutral-300 dark:border-neutral-800">
          <h1 className="text-xl font-bold text-neutral-900 flex items-center dark:text-white">
            <Car className="mr-2 text-neutral-900 dark:text-neutral-100" />
            FleetGuard
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-500">Main Menu</p>
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem
            icon={<Car size={20} />}
            label="Vehicle Management"
            active={currentView === 'vehicles'}
            onClick={() => setCurrentView('vehicles')}
          />
          <NavItem
            icon={<ClipboardList size={20} />}
            label="Checklist Management"
            active={currentView === 'checklist'}
            onClick={() => setCurrentView('checklist')}
          />

          <div className="my-4 border-t border-neutral-300 dark:border-neutral-800"></div>

          <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-500">Administration</p>
          <NavItem
            icon={<FileText size={20} />}
            label="Audit Trail"
            active={currentView === 'audit'}
            onClick={() => setCurrentView('audit')}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="Reports & Print"
            active={currentView === 'reports'}
            onClick={() => setCurrentView('reports')}
          />
          <NavItem
            icon={<Users size={20} />}
            label="User Management"
            active={currentView === 'users'}
            onClick={() => setCurrentView('users')}
          />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-neutral-100 border-b border-neutral-300 flex items-center justify-between px-6 shadow-sm z-10 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="flex items-center text-neutral-600 md:hidden dark:text-neutral-300">
            <Car className="mr-2 text-neutral-900 dark:text-neutral-100" />
            <span className="font-bold text-neutral-900 dark:text-white">FleetGuard</span>
          </div>

          {/* Breadcrumb / Title Context (Optional, simplified here) */}
          <div className="hidden md:block text-neutral-500 text-sm dark:text-neutral-400">
            Rental Fleet Manager / <span className="text-neutral-900 font-medium capitalize dark:text-neutral-100">{currentView.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 text-neutral-400 dark:text-neutral-500" size={16} />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500 w-64 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-400 dark:focus:border-neutral-400" />
            </div>
            <button className="relative p-2 text-neutral-500 hover:bg-neutral-200 rounded-lg dark:text-neutral-300 dark:hover:bg-neutral-800" aria-label="Notifications" title="Notifications">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-neutral-100 dark:border-neutral-900"></span>
            </button>
            <button
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
              className="p-2 text-neutral-500 hover:bg-neutral-200 rounded-lg dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="h-8 w-[1px] bg-neutral-300 mx-1 dark:bg-neutral-800"></div>
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                className="flex items-center gap-2 text-neutral-700 font-medium text-sm hover:bg-neutral-200 rounded-lg px-2 py-1.5 transition-colors dark:text-neutral-200 dark:hover:bg-neutral-800"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu"
              >
                <span className="hidden md:inline">{authUser?.username || 'User'}</span>
                <div className="bg-neutral-200 p-1 rounded-full w-8 h-8 flex items-center justify-center dark:bg-neutral-800">
                  <User size={20} />
                </div>
                <ChevronDown size={16} className={`transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAccountMenuOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 mt-2 w-64 bg-neutral-100 border border-neutral-300 rounded-xl shadow-lg z-30 overflow-hidden dark:bg-neutral-900 dark:border-neutral-700"
                >
                  <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800">
                    <p className="text-sm font-semibold text-neutral-900 truncate dark:text-neutral-100">{authUser?.username || 'User'}</p>
                    <p className="text-xs text-neutral-500 truncate dark:text-neutral-400">{rolesLabel}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setIsAccountModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-200 transition-colors dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      My Account
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative dark:bg-neutral-950">
          {renderContent()}
        </div>
      </main>

      {isAccountModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={() => setIsAccountModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="My Account"
        >
          <div
            className="w-full max-w-md bg-neutral-100 rounded-xl shadow-2xl border border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-neutral-300 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">My Account</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Signed in account details</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Username</p>
                <p className="text-sm font-medium text-neutral-900 mt-1 dark:text-neutral-100">{authUser?.username || 'User'}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Roles</p>
                <p className="text-sm font-medium text-neutral-900 mt-1 break-words dark:text-neutral-100">{rolesLabel}</p>
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/30 dark:text-green-300">
                  Signed In
                </span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-300 flex items-center justify-end gap-3 dark:border-neutral-800">
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-200 transition-colors dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Close
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for Nav Items
const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1
      ${active
        ? 'bg-neutral-950 text-neutral-100 shadow-sm dark:bg-neutral-100 dark:text-neutral-900'
        : 'text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'}
    `}
  >
    <span className={`mr-3 ${active ? 'text-neutral-100 dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-500'}`}>{icon}</span>
    {label}
  </button>
);

export default App;
