import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Car, ClipboardList, FileText, 
  Settings, Users, Bell, Search, User, LogOut 
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
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <form
          onSubmit={handleLoginSubmit}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">FleetGuard Login</h1>
            <p className="text-sm text-gray-600 mt-1">Sign in to continue.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20 hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Car className="mr-2 text-blue-600" />
            FleetGuard
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
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
          
          <div className="my-4 border-t border-gray-100"></div>
          
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
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

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">JS</div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-gray-900 truncate">{authUser?.username}</p>
               <p className="text-xs text-gray-500 truncate">{authUser?.roles?.[0] || 'User'}</p>
             </div>
             <button
               type="button"
               onClick={handleLogout}
               className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
               aria-label="Logout"
               title="Logout"
             >
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
           <div className="flex items-center text-gray-500 md:hidden">
              <Car className="mr-2 text-blue-600" />
              <span className="font-bold text-gray-900">FleetGuard</span>
           </div>

           {/* Breadcrumb / Title Context (Optional, simplified here) */}
           <div className="hidden md:block text-gray-500 text-sm">
              Rental Fleet Manager / <span className="text-gray-900 font-medium capitalize">{currentView.replace('-', ' ')}</span>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                 <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                 <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64 transition-all" />
              </div>
              <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                 <Bell size={20} />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>
              <div className="flex items-center gap-2 text-gray-700 font-medium text-sm cursor-pointer hover:text-blue-600">
                 <span className="hidden md:inline">Admin User</span>
                 <User size={20} className="bg-gray-100 p-1 rounded-full w-8 h-8" />
              </div>
           </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

// Helper for Nav Items
const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1
      ${active 
        ? 'bg-blue-50 text-blue-700 shadow-sm' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
    `}
  >
    <span className={`mr-3 ${active ? 'text-blue-600' : 'text-gray-400'}`}>{icon}</span>
    {label}
  </button>
);

export default App;
