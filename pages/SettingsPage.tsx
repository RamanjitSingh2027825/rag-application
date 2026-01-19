import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Smartphone, Bell, Shield, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUserProfile } = useApp();

  return (
    <div className="p-6 h-full overflow-y-auto max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 google-sans mb-8">Settings</h1>

        {/* Profile Section */}
        <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Profile</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-6">
                <img src={user.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md" />
                <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                            <input 
                                type="text" 
                                value={user.name} 
                                onChange={(e) => updateUserProfile({ name: e.target.value })}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                value={user.email} 
                                onChange={(e) => updateUserProfile({ email: e.target.value })}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Appearance */}
        <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Appearance</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <Sun className="text-gray-400" size={20} />
                        <div>
                            <p className="font-medium text-gray-900">Theme</p>
                            <p className="text-xs text-gray-500">Customize how the application looks</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['light', 'dark', 'system'].map((theme) => (
                            <button
                                key={theme}
                                onClick={() => updateUserProfile({ theme: theme as any })}
                                className={`
                                    px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all
                                    ${user.theme === theme ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* API Configuration */}
         <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">API Configuration</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Key className="text-yellow-500" size={20} />
                    <div>
                         <p className="font-medium text-gray-900">Google Gemini API Key</p>
                         <p className="text-xs text-gray-500">Your key is managed via environment variables for security.</p>
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                    <code className="text-sm text-gray-600 font-mono">
                        **************************{process.env.API_KEY ? process.env.API_KEY.slice(-4) : 'xxxx'}
                    </code>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Active</span>
                </div>
            </div>
        </section>

    </div>
  );
};