import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { streamGeminiResponse, estimateTokens, CHARS_PER_PAGE } from '../services/geminiService';
import { Send, Plus, Bot, User, RefreshCw, FileText, X, ChevronRight, Copy, Check, BookOpen } from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileUpload } from '../components/FileUpload';
import { DocumentFile } from '../types';

// --- Citation Modal Component ---
interface CitationModalProps {
  doc: DocumentFile;
  page?: number;
  onClose: () => void;
}

const CitationModal: React.FC<CitationModalProps> = ({ doc, page, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Split content into pages for display
  const pages = [];
  for (let i = 0; i < doc.content.length; i += CHARS_PER_PAGE) {
    pages.push(doc.content.substring(i, i + CHARS_PER_PAGE));
  }

  useEffect(() => {
    // Scroll to the specific page if provided
    if (page && contentRef.current) {
      setTimeout(() => {
          const pageElement = document.getElementById(`doc-page-${page}`);
          if (pageElement) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }, 100); // Small delay to ensure rendering
    }
  }, [page]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{doc.name}</h3>
              <p className="text-xs text-gray-500">
                {pages.length} Pages • {(doc.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6" ref={contentRef}>
          <div className="bg-white shadow-sm border border-gray-200 min-h-full rounded-xl mx-auto max-w-3xl">
            {pages.map((chunk, idx) => {
              const pageNum = idx + 1;
              const isTargetPage = page === pageNum;
              return (
                <div 
                  key={idx} 
                  id={`doc-page-${pageNum}`}
                  className={`
                    relative p-8 border-b border-gray-100 last:border-0 transition-colors duration-500
                    ${isTargetPage ? 'bg-blue-50/50' : ''}
                  `}
                >
                  <div className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-400 text-[10px] font-mono rounded uppercase tracking-wider">
                    Page {pageNum}
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed overflow-x-auto">
                    {chunk}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Custom Code Block Component ---
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (inline) {
        return (
            <code className="bg-gray-100 text-pink-600 rounded px-1.5 py-0.5 text-sm font-mono border border-gray-200" {...props}>
                {children}
            </code>
        );
    }

    return (
        <div className="relative my-4 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-md border border-gray-800 group">
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">{language || 'code'}</span>
                <button 
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
            </div>
            <div className="overflow-x-auto p-4">
                <code className={`${className} text-sm font-mono text-gray-200 block`} {...props}>
                    {children}
                </code>
            </div>
        </div>
    );
};

// --- Chat Message Component ---
const ChatMessage = ({ message, onCitationClick }: { message: any, onCitationClick: (docName: string, page?: number) => void }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };
  
  // 1. Process text to extract sources and replace with [n] style links
  const { processedText, sources } = useMemo(() => {
    if (isUser || !message.text) return { processedText: message.text, sources: [] };

    const regex = /\[Source: (.*?)\]/g;
    const foundSources: any[] = [];
    const sourceMap = new Map<string, number>();

    const newText = message.text.replace(regex, (match: string, content: string) => {
        let index = sourceMap.get(content);
        if (index === undefined) {
            index = foundSources.length + 1;
            sourceMap.set(content, index);
            
            // Parse Details
            let docName = content;
            let pageNum: number | undefined;
            if (content.includes('Page:')) {
                const split = content.split('Page:');
                docName = split[0].trim().replace(/,$/, '');
                const pageStr = split[1].trim().split('-')[0];
                pageNum = parseInt(pageStr);
            }
            foundSources.push({ id: index, content, docName, pageNum });
        }
        return `[[${index}]](citation://${index})`;
    });

    return { processedText: newText, sources: foundSources };
  }, [message.text, isUser]);

  // 2. Define Markdown components with custom link handler for citations
  const markdownComponents: Components = useMemo(() => ({
    code: CodeBlock,
    a: ({ node, href, children, ...props }: any) => {
        if (href?.startsWith('citation://')) {
            const index = parseInt(href.replace('citation://', ''));
            const source = sources.find((s: any) => s.id === index);
            return (
                <sup 
                    onClick={() => source && onCitationClick(source.docName, source.pageNum)}
                    className="cursor-pointer text-blue-600 font-bold hover:underline ml-0.5 select-none text-[10px] bg-blue-50 px-1 py-0.5 rounded-sm border border-blue-100"
                    title={source?.content}
                >
                    {children}
                </sup>
            );
        }
        return <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" href={href} {...props}>{children}</a>;
    },
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
    h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold my-4 text-gray-900" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold my-3 text-gray-900" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold my-2 text-gray-900" {...props} />,
    p: ({ node, ...props }: any) => <p className="my-2 leading-relaxed" {...props} />,
    table: ({ node, ...props }: any) => <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm"><table className="min-w-full divide-y divide-gray-200 bg-white" {...props} /></div>,
    thead: ({ node, ...props }: any) => <thead className="bg-gray-50" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-200 bg-white" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border-t border-gray-100" {...props} />,
  }), [sources, onCitationClick]);

  return (
    <div className={`flex gap-4 w-full max-w-4xl mx-auto p-4 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
          <Bot size={16} />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          relative rounded-2xl px-5 py-3.5 shadow-sm
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none w-full pr-10'}
        `}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <>
                <div className="markdown-body leading-relaxed w-full">
                    <ReactMarkdown 
                        components={markdownComponents}
                        remarkPlugins={[remarkGfm]}
                        urlTransform={(url) => url} // Allow custom protocols like citation://
                        className="text-gray-800"
                    >
                        {processedText}
                    </ReactMarkdown>
                </div>

                {/* References / Bibliography Section */}
                {sources.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-3 text-gray-500">
                             <BookOpen size={14} />
                             <span className="text-xs font-bold uppercase tracking-wider">Sources</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {sources.map((source: any) => (
                                <button
                                    key={source.id}
                                    onClick={() => onCitationClick(source.docName, source.pageNum)}
                                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group/btn w-full"
                                >
                                    <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded shrink-0 mt-0.5">
                                        {source.id}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate group-hover/btn:text-blue-700 transition-colors">
                                            {source.docName}
                                        </p>
                                        {source.pageNum && (
                                            <p className="text-xs text-gray-500">
                                                Page {source.pageNum}
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover/btn:opacity-100 transition-opacity mt-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </>
          )}
          
          {!isUser && message.text && (
            <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Copy response"
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          )}

        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 shadow-sm mt-1">
          <User size={16} />
        </div>
      )}
    </div>
  );
};

// --- Main Chat Page Component ---
export const ChatPage: React.FC = () => {
  const { messages, addMessage, updateLastMessage, documents, updateUsage, usage } = useApp();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  
  // Citation Viewer State
  const [viewingCitation, setViewingCitation] = useState<{ doc: DocumentFile, page?: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    if (usage.monthly >= usage.budget) {
        alert("Monthly budget exceeded!");
        return;
    }

    const userText = input;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    
    addMessage(userText, 'user');
    addMessage('', 'model'); // Optimistic placeholder
    setIsGenerating(true);

    const requestTokens = estimateTokens(userText);
    updateUsage(requestTokens);

    try {
      await streamGeminiResponse(
        messages,
        userText,
        documents,
        (text) => {
          updateLastMessage(text);
          scrollToBottom();
        }
      );
      
      const lastMsg = messages[messages.length - 1]; 
      if(lastMsg) {
          updateUsage(estimateTokens(lastMsg.text || '')); 
      }

    } catch (error) {
      updateLastMessage("I encountered an error processing your request. Please check your API key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCitationClick = (docName: string, page?: number) => {
    // 1. Try exact match
    let doc = documents.find(d => d.name === docName);
    
    // 2. Try match after trimming potential extra spaces
    if (!doc) {
        doc = documents.find(d => d.name.trim() === docName.trim());
    }

    // 3. Try partial match (if LLM shortened the name)
    if (!doc) {
         doc = documents.find(d => d.name.includes(docName) || docName.includes(d.name));
    }

    if (doc) {
      setViewingCitation({ doc, page });
    } else {
      console.warn("Document not found for citation:", `"${docName}"`);
      // Could show a toast here
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/30 relative">
      {/* Citation Modal */}
      {viewingCitation && (
        <CitationModal 
          doc={viewingCitation.doc} 
          page={viewingCitation.page} 
          onClose={() => setViewingCitation(null)} 
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-32 pt-6">
        {messages.length === 1 && (
            <div className="flex flex-col items-center justify-center h-[60vh] opacity-50">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <Bot size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-700 google-sans">How can I help you today?</h3>
                <p className="text-gray-500 mt-2 max-w-md text-center">
                    I can answer questions based on your uploaded documents. 
                    Try uploading a file using the + button.
                </p>
            </div>
        )}
        {messages.map(msg => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            onCitationClick={handleCitationClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-4xl mx-auto">
          {showQuickUpload && (
            <div className="mb-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 animate-slide-up">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Add to Context</h4>
                    <button onClick={() => setShowQuickUpload(false)} className="text-gray-400 hover:text-gray-600"><span className="sr-only">Close</span>&times;</button>
                </div>
                <FileUpload compact onComplete={() => setShowQuickUpload(false)} />
            </div>
          )}

          <div className="relative bg-white rounded-3xl shadow-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
            <div className="flex items-end p-2 gap-2">
                <button 
                    onClick={() => setShowQuickUpload(!showQuickUpload)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Upload document"
                >
                    <Plus size={20} />
                </button>
                
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your documents..."
                    className="flex-1 max-h-48 py-3 bg-transparent border-none focus:ring-0 resize-none overflow-y-auto text-gray-700 placeholder-gray-400"
                    rows={1}
                />

                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isGenerating}
                    className={`
                        p-2.5 rounded-full transition-all mb-0.5
                        ${input.trim() && !isGenerating
                            ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
            </div>
            
            {/* Footer info */}
            <div className="px-4 pb-2 flex justify-between items-center text-[10px] text-gray-400">
                <span>Gemini 3 Flash • {documents.filter(d=>d.status === 'ready').length} files in context</span>
                <span>Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};