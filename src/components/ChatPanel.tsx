import { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import type { Message } from '@/types';

interface ChatPanelProps {
  messages: Message[];
  loading: boolean;
  onSend: (content: string) => void;
  myName: string;
  sendError?: string;
}

export function ChatPanel({ messages, loading, onSend, myName, sendError }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f17] border-l border-white/10">
      <div className="px-4 py-3.5 border-b border-white/10 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-amber-400" />
        <span className="font-semibold text-sm text-white">Live chat</span>
        <span className="ml-auto text-xs text-white/40">{messages.length} msgs</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {loading && (
          <p className="text-center text-white/30 text-sm py-8">Loading chat…</p>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No messages yet</p>
            <p className="text-white/20 text-xs mt-1">Say hi to your friends!</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.author_name === myName;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] ${mine ? 'order-2' : ''}`}>
                {!mine && (
                  <span className="text-xs font-medium text-amber-400/80 mb-1 block">
                    {m.author_name}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm break-words ${
                    mine
                      ? 'bg-gradient-to-br from-rose-500/90 to-amber-500/80 text-white rounded-br-sm'
                      : 'bg-white/[0.06] text-white/90 rounded-bl-sm border border-white/5'
                  }`}
                >
                  {m.content}
                </div>
                <span className={`text-[10px] text-white/30 mt-1 block ${mine ? 'text-right' : ''}`}>
                  {formatTime(m.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {sendError && (
        <p className="px-4 pt-2 text-xs text-rose-400">{sendError}</p>
      )}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 focus-within:border-amber-400/40 transition">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            maxLength={500}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="m-1 w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
