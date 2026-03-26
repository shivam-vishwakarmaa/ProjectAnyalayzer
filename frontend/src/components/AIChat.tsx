'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Code2, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! Upload a project and ask me questions about it, or ask me for modifications.' }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'analyze' | 'propose'>('analyze');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    // Initialize an empty AI message to stream into
    setMessages(prev => [...prev, { role: 'ai', content: '' }]);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + chunk
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: "Sorry, I encountered an error communicating with the backend. Please ensure the FastAPI server and Ollama are running."
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#12141a]">
      {/* Header and Toggle */}
      <div className="px-5 py-4 border-b border-white/5 flex flex-col gap-4 shrink-0">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
          <Bot size={18} />
          Mission Control AI
        </h2>
        
        <div className="flex bg-black/40 rounded-lg p-1 relative border border-white/5 shadow-inner">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#1e2330] rounded-md transition-all duration-300 ease-out shadow flex items-center justify-center`}
            style={{ left: mode === 'analyze' ? '4px' : 'calc(50%)' }}
          />
          <button 
            onClick={() => setMode('analyze')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors ${mode === 'analyze' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Code2 size={14} /> Analyze Code
          </button>
          <button 
             onClick={() => setMode('propose')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors ${mode === 'propose' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Sparkles size={14} /> Propose Mods
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-[#1e2330] border border-white/10'}`}>
                {msg.role === 'user' ? <span className="text-xs font-bold">You</span> : <Bot size={16} className="text-indigo-400" />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#181a21] border border-white/5 text-gray-300 rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 shrink-0 bg-gradient-to-t from-[#0d0f14] to-transparent">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={mode === 'analyze' ? "Ask about the codebase..." : "Describe modifications..."}
            className="w-full bg-[#1e2330] border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm outline-none transition-all focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 shadow-inner group-hover:border-white/20 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
