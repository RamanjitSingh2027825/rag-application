import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const FileUpload: React.FC<{ compact?: boolean, onComplete?: () => void }> = ({ compact = false, onComplete }) => {
  const { addDocument } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const fileArray = Array.from(files);
    
    // Simulate slight delay for UX
    for (const file of fileArray) {
      await addDocument(file);
    }
    
    setUploading(false);
    if (onComplete) onComplete();
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
        ${compact ? 'p-4 flex items-center justify-center gap-2' : 'p-8 flex flex-col items-center justify-center text-center'}
      `}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py"
      />

      {uploading ? (
        <div className="flex flex-col items-center animate-pulse">
           <Loader2 className="animate-spin text-blue-600 mb-2" size={compact ? 20 : 32} />
           <span className="text-sm text-gray-500">Processing files...</span>
        </div>
      ) : (
        <>
          <UploadCloud className={`${compact ? 'w-5 h-5' : 'w-10 h-10 mb-3'} text-blue-500`} />
          <div className="text-gray-600">
            {compact ? (
              <span className="text-sm font-medium">Add files</span>
            ) : (
              <>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">TXT, MD, JSON, CSV, CODE</p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};