import React, { useState } from 'react';
import { 
  LayoutDashboard, Car, ClipboardList, FileText, 
  Settings, Users, Bell, Search, ChevronDown, User 
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import VehicleManagement from './components/VehicleManagement';
import ChecklistManager from './components/Checklist/ChecklistManager';
import AuditTrail from './components/AuditTrail';
import UserManagement from './components/UserManagement';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'vehicles': return <VehicleManagement />;
      case 'checklist': return <ChecklistManager />;
      case 'audit': return <AuditTrail />;
      case 'users': return <UserManagement />;
      default: return <Dashboard />;
    }
  };

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
               <p className="text-sm font-medium text-gray-900 truncate">John Smith</p>
               <p className="text-xs text-gray-500 truncate">Fleet Manager</p>
             </div>
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