'use client';

import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

// Mock initial data before a project is uploaded
const defaultInitialData: FileNode[] = [
  {
    name: "Welcome", type: "folder", children: [
      { name: "Instructions.md", type: "file", content: "Upload a zip file to see your project here." }
    ]
  }
];

const TreeNode = ({ node, level, onSelect }: { node: FileNode, level: number, onSelect: (node: FileNode) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingLeft = `${level * 16 + 8}px`;

  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div 
        className="flex items-center py-1.5 px-2 hover:bg-white/5 cursor-pointer text-sm text-gray-300 transition-colors"
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        <span className="mr-1.5 opacity-70">
          {isFolder ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-3.5 inline-block" />
          )}
        </span>
        <span className="mr-2 opacity-80 decoration-brand-500">
          {isFolder ? <Folder size={14} className="text-blue-400" /> : <File size={14} className="text-gray-400" />}
        </span>
        <span className="truncate select-none">{node.name}</span>
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} level={level + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileTree({ treeData = defaultInitialData, onSelectFile }: { treeData?: FileNode[], onSelectFile: (content: string, filename: string) => void }) {

  const handleSelect = (node: FileNode) => {
    if (node.type === 'file') {
      onSelectFile(node.content || '', node.name);
    }
  };

  return (
    <div className="h-full flex flex-col pt-4">
      <div className="px-4 pb-3 flex items-center justify-between border-b border-white/5 mb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Explorer</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {treeData.map((node, i) => (
          <TreeNode key={i} node={node} level={0} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
