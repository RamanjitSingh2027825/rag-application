import React from 'react';
import { useApp } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 google-sans">{value}</h3>
      <p className="text-xs text-gray-400 mt-2">{sub}</p>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

export const UsagePage: React.FC = () => {
  const { usage, setBudget } = useApp();

  const data = [
    { name: 'Daily', tokens: usage.daily },
    { name: 'Monthly', tokens: usage.monthly },
    { name: 'Budget', tokens: usage.budget },
  ];

  const percentage = Math.round((usage.monthly / usage.budget) * 100);
  const isOverBudget = percentage > 100;

  return (
    <div className="p-6 h-full overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 google-sans mb-6">Usage & Billing</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
                title="Daily Tokens" 
                value={usage.daily.toLocaleString()} 
                sub="Reset at 00:00 UTC"
                icon={TrendingUp}
                color="bg-blue-500"
            />
            <StatCard 
                title="Monthly Tokens" 
                value={usage.monthly.toLocaleString()} 
                sub={`${percentage}% of budget`}
                icon={Calendar}
                color="bg-purple-500"
            />
            <StatCard 
                title="Remaining Budget" 
                value={(Math.max(0, usage.budget - usage.monthly)).toLocaleString()} 
                sub="Tokens available"
                icon={Wallet}
                color={isOverBudget ? "bg-red-500" : "bg-green-500"}
            />
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold mb-6">Token Consumption Analysis</h3>
                {/* 
                    Fixed: Added w-full and min-w-0 to ensure Recharts has dimensions to read within the Grid. 
                */}
                <div className="w-full h-64 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} />
                            <Tooltip 
                                cursor={{fill: '#f3f4f6'}} 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="tokens" radius={[0, 4, 4, 0]} barSize={32}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 2 ? '#e2e8f0' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Budget Settings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Budget Settings</h3>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Set a hard limit on token consumption to control costs.
                    </p>
                    
                    {isOverBudget && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>You have exceeded your monthly budget. Generation may be paused.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Token Limit</label>
                        <input 
                            type="number" 
                            value={usage.budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    
                    <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                        Update Limits
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};