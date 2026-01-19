import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, FolderOpen, PieChart, Settings, User, Menu, X, Command, Plus, MoreHorizontal, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const SidebarLink = ({ to, icon: Icon, label, onClick, active }: { to: string, icon: any, label: string, onClick?: () => void, active?: boolean }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium mb-1
        ${isActive || active
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const { 
    user, 
    usage, 
    conversations, 
    activeConversationId, 
    selectChat, 
    createChat,
    deleteChat,
    renameChat
  } = useApp();
  
  const navigate = useNavigate();
  const location = useLocation();

  const usagePercent = Math.min((usage.monthly / usage.budget) * 100, 100);

  const handleNewChat = () => {
    createChat();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleChatSelect = (id: string) => {
    selectChat(id);
    navigate('/');
    setMobileMenuOpen(false);
  };

  const startEditing = (e: React.MouseEvent, chat: any) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = (id: string) => {
    if (editTitle.trim()) {
      renameChat(id, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveTitle(id);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChat(id);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden text-gray-800 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-gray-200 bg-gray-50/50">
        {/* App Header */}
        <div className="p-4 pb-2">
            <div className="flex items-center gap-2 px-2 mb-6 mt-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Command size={18} />
            </div>
            <span className="text-xl font-bold google-sans text-gray-800">Lumina</span>
            </div>

            {/* New Chat Button */}
            <button 
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-700 rounded-full transition-all duration-200 group mb-4"
            >
                <div className="p-1 bg-gray-100 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Plus size={16} />
                </div>
                <span className="font-medium text-sm">New Chat</span>
            </button>
        </div>

        {/* Navigation & Chat History */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {/* Primary Nav */}
            <div className="mb-6">
                 <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace</p>
                 <SidebarLink to="/knowledge" icon={FolderOpen} label="Knowledge Base" />
                 <SidebarLink to="/usage" icon={PieChart} label="Usage & Stats" />
            </div>

            {/* Chat History */}
            <div>
                 <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conversations</p>
                 <div className="space-y-1">
                    {conversations.map(chat => (
                        <div 
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className={`
                                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm
                                ${activeConversationId === chat.id && location.pathname === '/' 
                                    ? 'bg-blue-100 text-blue-800 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                            `}
                        >
                            <MessageCircle size={18} className={`shrink-0 ${activeConversationId === chat.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            
                            {editingChatId === chat.id ? (
                                <input 
                                    autoFocus
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={() => saveTitle(chat.id)}
                                    onKeyDown={(e) => handleKeyDown(e, chat.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 min-w-0 bg-white border border-blue-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            ) : (
                                <span className="truncate flex-1 text-left">{chat.title}</span>
                            )}

                            {/* Hover Actions */}
                            {!editingChatId && (
                                <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white/90 to-transparent pl-4">
                                    <button 
                                        onClick={(e) => startEditing(e, chat)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="Rename"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, chat.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200 bg-gray-50/50 p-4">
           {/* Budget Meter */}
           <div className="mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1.5 uppercase font-bold tracking-wider">
                <span>Budget</span>
                <span>{Math.round(usagePercent)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
           </div>

           <div className="flex items-center gap-1">
                <NavLink to="/profile" className="flex-1 flex items-center gap-2.5 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <img src={user.avatarUrl} alt="User" className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm" />
                    <div className="flex-1 overflow-hidden min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    </div>
                </NavLink>
                <NavLink to="/settings" className="p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors" title="Settings">
                    <Settings size={18} />
                </NavLink>
           </div>
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
          <div className="absolute inset-0 z-30 bg-white p-4 pt-20 md:hidden flex flex-col animate-fade-in">
             <button 
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg mb-6"
            >
                <Plus size={18} />
                <span className="font-medium">New Chat</span>
            </button>
            
            <nav className="space-y-1">
              <SidebarLink to="/knowledge" icon={FolderOpen} label="Knowledge Base" onClick={() => setMobileMenuOpen(false)} />
              <SidebarLink to="/usage" icon={PieChart} label="Usage & Stats" onClick={() => setMobileMenuOpen(false)} />
              <SidebarLink to="/settings" icon={Settings} label="Settings" onClick={() => setMobileMenuOpen(false)} />
            </nav>

            <div className="mt-8">
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Chats</p>
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                    {conversations.map(chat => (
                         <button 
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm text-left
                                ${activeConversationId === chat.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
                            `}
                        >
                            <MessageCircle size={18} className="shrink-0" />
                            <span className="truncate">{chat.title}</span>
                        </button>
                    ))}
                </div>
            </div>
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