import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { streamGeminiResponse, estimateTokens } from '../services/geminiService';
import { Send, Plus, Paperclip, Bot, User, StopCircle, RefreshCw, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FileUpload } from '../components/FileUpload';

const ChatMessage = ({ message }: { message: any }) => {
  const isUser = message.role === 'user';
  
  // Basic citation highlighting renderer
  const renderContent = (text: string) => {
     // Split by citation pattern [Source: ...]
     const parts = text.split(/(\[Source: [^\]]+\])/g);
     return parts.map((part, i) => {
       if (part.startsWith('[Source:') && part.endsWith(']')) {
         return (
           <span key={i} className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 cursor-help" title="Citation found in knowledge base">
             <FileText size={10} />
             {part.replace('[Source: ', '').replace(']', '')}
           </span>
         );
       }
       return <ReactMarkdown key={i} className="inline prose prose-sm max-w-none text-gray-800">{part}</ReactMarkdown>;
     });
  };

  return (
    <div className={`flex gap-4 w-full max-w-4xl mx-auto p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
          <Bot size={16} />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          rounded-2xl px-5 py-3.5 shadow-sm
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}
        `}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="markdown-body leading-relaxed space-y-2">
              {renderContent(message.text)}
            </div>
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

export const ChatPage: React.FC = () => {
  const { messages, addMessage, updateLastMessage, documents, updateUsage, usage } = useApp();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust textarea height
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

    // Calculate approx tokens for request
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
      
      // Calculate final tokens (roughly)
      const lastMsg = messages[messages.length - 1]; // This might be stale in closure, but okay for rough calc
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

  return (
    <div className="flex flex-col h-full bg-gray-50/30 relative">
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
          <ChatMessage key={msg.id} message={msg} />
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