import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, FolderOpen, PieChart, Settings, User, Menu, X, Command } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const SidebarItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-full transition-colors text-sm font-medium
        ${isActive 
          ? 'bg-blue-100 text-blue-800' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, usage } = useApp();
  const location = useLocation();

  const usagePercent = Math.min((usage.monthly / usage.budget) * 100, 100);

  return (
    <div className="flex h-screen bg-white overflow-hidden text-gray-800 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-gray-50/50 p-4">
        <div className="flex items-center gap-2 px-4 mb-8 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Command size={18} />
          </div>
          <span className="text-xl font-bold google-sans text-gray-800">Lumina</span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem to="/" icon={MessageSquare} label="Chat Assistant" />
          <SidebarItem to="/knowledge" icon={FolderOpen} label="Knowledge Base" />
          <SidebarItem to="/usage" icon={PieChart} label="Usage & Stats" />
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200">
           <div className="px-4 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Monthly Budget</span>
                <span>{Math.round(usagePercent)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
           </div>

           <NavLink to="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors">
             <img src={user.avatarUrl} alt="User" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
               <p className="text-xs text-gray-500 truncate">{user.email}</p>
             </div>
           </NavLink>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white z-20">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Command size={18} />
            </div>
            <span className="font-bold text-lg google-sans">Lumina</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="absolute inset-0 z-10 bg-white p-4 pt-20 md:hidden flex flex-col">
            <nav className="space-y-2">
              <SidebarItem to="/" icon={MessageSquare} label="Chat Assistant" onClick={() => setMobileMenuOpen(false)} />
              <SidebarItem to="/knowledge" icon={FolderOpen} label="Knowledge Base" onClick={() => setMobileMenuOpen(false)} />
              <SidebarItem to="/usage" icon={PieChart} label="Usage & Stats" onClick={() => setMobileMenuOpen(false)} />
              <SidebarItem to="/settings" icon={Settings} label="Settings" onClick={() => setMobileMenuOpen(false)} />
              <SidebarItem to="/profile" icon={User} label="Profile" onClick={() => setMobileMenuOpen(false)} />
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative bg-white">
          {children}
        </main>
      </div>
    </div>
  );
};