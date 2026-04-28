import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardProfile } from './DashboardLayout';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

const ChatPage = () => {
  const { profile } = useOutletContext<{ profile: DashboardProfile }>();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        setMessages((data as ChatMessage[]) ?? []);
      });

    const channel = supabase
      .channel('chat_messages_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => [...(prev ?? []), payload.new as ChatMessage]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => (prev ?? []).filter((m) => m.id !== (payload.old as ChatMessage).id));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      user_id: profile.id,
      username: profile.username,
      message: text.slice(0, 1000),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
    } else {
      setInput('');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blox-teal" />
          Global Chat
        </h2>
        <p className="text-sm text-gray-400">Talk live with other beamers. Be cool to each other.</p>
      </div>

      <div className="blox-card flex flex-col h-[60vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No messages yet. Say hi 👋</div>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === profile.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`group max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-blox-teal/20 border border-blox-teal/30' : 'bg-white/5 border border-white/10'}`}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium ${mine ? 'text-blox-teal' : 'text-gray-300'}`}>@{m.username}</span>
                      <span className="text-gray-500">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {mine && (
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition"
                          aria-label="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="mt-0.5 break-words whitespace-pre-wrap">{m.message}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="border-t border-white/5 p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder="Type a message…"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blox-teal"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blox-teal text-white px-4 rounded-lg flex items-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
