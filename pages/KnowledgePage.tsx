import React from 'react';
import { useApp } from '../contexts/AppContext';
import { FileUpload } from '../components/FileUpload';
import { FileText, Trash2, Check, Clock, AlertTriangle, Search } from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const { documents, deleteDocument } = useApp();
  const [search, setSearch] = React.useState('');

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 google-sans mb-1">Knowledge Base</h1>
        <p className="text-gray-500 text-sm">Manage documents available to the AI for Retrieval Augmented Generation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
        {/* Left Column: Upload */}
        <div className="lg:col-span-1 bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Upsert Documents</h2>
          <p className="text-sm text-gray-600 mb-6">
            Upload text-based files here. These files will be indexed and used by the Chatbot to provide cited answers.
          </p>
          <FileUpload />
          
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                <div className="text-xs text-gray-500">Total Files</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'ready').length}
                </div>
                <div className="text-xs text-gray-500">Active & Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: File List */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FolderOpen size={48} className="mb-4 opacity-20" />
                <p>No documents found.</p>
              </div>
            ) : (
              filteredDocs.map(doc => (
                <div key={doc.id} className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border">
                      {doc.status === 'ready' && (
                        <><Check size={12} className="text-green-500" /><span className="text-green-700 bg-green-50 border-green-200">Ready</span></>
                      )}
                      {doc.status === 'processing' && (
                        <><Clock size={12} className="text-amber-500" /><span className="text-amber-700 bg-amber-50 border-amber-200">Processing</span></>
                      )}
                      {doc.status === 'error' && (
                        <><AlertTriangle size={12} className="text-red-500" /><span className="text-red-700 bg-red-50 border-red-200">Error</span></>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
import { FolderOpen } from 'lucide-react';