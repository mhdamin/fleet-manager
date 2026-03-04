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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
        <form
          onSubmit={handleLoginSubmit}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">FleetGuard Login</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sign in to continue.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          {loginError && <p className="text-sm text-red-600 mt-4">{loginError}</p>}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  const rolesLabel = authUser?.roles?.join(', ') || 'No Roles';

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden dark:bg-gray-950 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20 hidden md:flex dark:bg-gray-900 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 flex items-center dark:text-white">
            <Car className="mr-2 text-blue-600 dark:text-blue-400" />
            FleetGuard
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">Main Menu</p>
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

          <div className="my-4 border-t border-gray-100 dark:border-gray-800"></div>

          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">Administration</p>
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center text-gray-500 md:hidden dark:text-gray-300">
            <Car className="mr-2 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-gray-900 dark:text-white">FleetGuard</span>
          </div>

          {/* Breadcrumb / Title Context (Optional, simplified here) */}
          <div className="hidden md:block text-gray-500 text-sm dark:text-gray-400">
            Rental Fleet Manager / <span className="text-gray-900 font-medium capitalize dark:text-gray-100">{currentView.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 text-gray-400 dark:text-gray-500" size={16} />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64 transition-all dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500" />
            </div>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Notifications" title="Notifications">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
            </button>
            <button
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="h-8 w-[1px] bg-gray-200 mx-1 dark:bg-gray-800"></div>
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                className="flex items-center gap-2 text-gray-700 font-medium text-sm hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors dark:text-gray-200 dark:hover:bg-gray-800"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu"
              >
                <span className="hidden md:inline">{authUser?.username || 'User'}</span>
                <div className="bg-gray-100 p-1 rounded-full w-8 h-8 flex items-center justify-center dark:bg-gray-800">
                  <User size={20} />
                </div>
                <ChevronDown size={16} className={`transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAccountMenuOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden dark:bg-gray-900 dark:border-gray-700"
                >
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{authUser?.username || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400">{rolesLabel}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setIsAccountModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-800"
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
        <div className="flex-1 overflow-auto p-4 md:p-8 relative dark:bg-gray-950">
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
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Account</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Signed in account details</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">Username</p>
                <p className="text-sm font-medium text-gray-900 mt-1 dark:text-gray-100">{authUser?.username || 'User'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider dark:text-gray-400">Roles</p>
                <p className="text-sm font-medium text-gray-900 mt-1 break-words dark:text-gray-100">{rolesLabel}</p>
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/30 dark:text-green-300">
                  Signed In
                </span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 dark:border-gray-800">
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
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
        ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'}
    `}
  >
    <span className={`mr-3 ${active ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>{icon}</span>
    {label}
  </button>
);

export default App;
