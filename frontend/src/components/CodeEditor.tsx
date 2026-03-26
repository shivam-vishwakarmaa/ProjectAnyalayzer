'use client';

import React from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';

interface CodeEditorProps {
  content: string;
  filename: string;
  isDiffMode: boolean;
  modifiedContent?: string;
}

export default function CodeEditor({ content, filename, isDiffMode, modifiedContent }: CodeEditorProps) {
  const language = filename.endsWith('.py') ? 'python' : 
                   filename.endsWith('.js') || filename.endsWith('.jsx') ? 'javascript' :
                   filename.endsWith('.ts') || filename.endsWith('.tsx') ? 'typescript' :
                   filename.endsWith('.json') ? 'json' :
                   filename.endsWith('.md') ? 'markdown' : 
                   filename.endsWith('.css') ? 'css' : 'plaintext';

  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col relative">
      <div className="flex items-center px-4 h-10 border-b border-white/5 bg-[#18181b]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 font-mono">{filename}</span>
          {isDiffMode && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">DIFF MODE</span>}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {isDiffMode ? (
          <DiffEditor
            height="100%"
            language={language}
            original={content}
            modified={modifiedContent || content}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              renderSideBySide: false,
              readOnly: true
            }}
          />
        ) : (
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={content}
            options={{
              minimap: { enabled: true, renderCharacters: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              wordWrap: 'on',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
            }}
          />
        )}
      </div>
    </div>
  );
}
