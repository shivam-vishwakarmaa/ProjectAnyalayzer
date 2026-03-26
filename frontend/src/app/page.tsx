'use client';

import React, { useState } from 'react';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import AIChat from '@/components/AIChat';
import { Upload, X } from 'lucide-react';
import axios from 'axios';

export default function Home() {
  const [activeFile, setActiveFile] = useState<{name: string, content: string}>({ name: 'README.md', content: '# Project Analyzer\nWelcome to the Mission Control AI analyzer.' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading to backend...");
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/api/upload-project', formData);
      setUploadStatus(`Success! Ingested ${res.data.file_count} chunks.`);
    } catch (error) {
      console.error(error);
      setUploadStatus("Failed to upload project. Is FastAPI running?");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  return (
    <main className="flex h-screen w-full bg-[#09090b] text-white overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-1/4 max-w-[320px] min-w-[250px] glass-panel border-y-0 border-l-0 relative z-10 flex flex-col">
        {/* Upload Header */}
        <div className="p-4 border-b border-white/5">
          <h1 className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            MISSION CONTROL
          </h1>
          <label className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all border ${isUploading ? 'bg-white/5 border-white/10 text-gray-400 cursor-wait' : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 text-indigo-300 hover:text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]'}`}>
            <Upload size={16} />
            {isUploading ? "Processing..." : "Upload Project (.zip)"}
            <input type="file" accept=".zip" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
        <FileTree 
          onSelectFile={(content, name) => setActiveFile({ content, name })}
        />
      </div>

      {/* Main Editor Panel */}
      <div className="flex-1 relative z-0 shadow-2xl shadow-black/50">
        {uploadStatus && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1e2330] border border-white/10 text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <span className={uploadStatus.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}>{uploadStatus}</span>
            <button onClick={() => setUploadStatus(null)} className="text-gray-400 hover:text-white"><X size={14}/></button>
          </div>
        )}
        <CodeEditor 
          filename={activeFile.name} 
          content={activeFile.content} 
          isDiffMode={false} 
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-[400px] min-w-[300px] glass-panel border-y-0 border-r-0 relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
        <AIChat />
      </div>
    </main>
  );
}
