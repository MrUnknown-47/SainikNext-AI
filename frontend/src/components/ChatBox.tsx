"use client";

import { useState } from 'react';

export default function ChatBox({ onSend, loading }: { onSend: (msg: string) => void, loading?: boolean }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="w-full relative mt-4">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 opacity-20 blur-md transition duration-500"></div>
      <div className="relative flex items-center gap-4 bg-gray-950 p-2 rounded-2xl border border-gray-800 shadow-2xl">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about translating your military experience..." 
          disabled={loading}
          className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 outline-none text-sm font-medium disabled:opacity-50"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold tracking-wide shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
