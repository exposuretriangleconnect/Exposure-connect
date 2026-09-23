import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { MessageThread, Message, Profile } from "../../types";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";

export function MessagesScreen() {
  const { profile } = useAuth();
  const [threads, setThreads] = useState<(MessageThread & { other_user?: Profile })[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadThreads();
  }, [profile]);

  const loadThreads = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("message_threads")
      .select("*")
      .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
      .order("last_message_at", { ascending: false });
    if (data) {
      const threadsWithUsers = await Promise.all(
        (data as MessageThread[]).map(async (t) => {
          const otherId = t.participant_1 === profile.id ? t.participant_2 : t.participant_1;
          const { data: otherUser } = await supabase
            .from("profiles")
            .select("id, name, profile_photo, city")
            .eq("id", otherId)
            .maybeSingle();
          return { ...t, other_user: otherUser as Profile };
        })
      );
      setThreads(threadsWithUsers);
    }
    setLoading(false);
  };

  const loadMessages = async (thread: MessageThread) => {
    setActiveThread(thread);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);

    // Mark as read
    if (profile) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("thread_id", thread.id)
        .neq("sender_id", profile.id)
        .is("read_at", null);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !activeThread || !newMessage.trim()) return;
    const { data } = await supabase
      .from("messages")
      .insert({
        thread_id: activeThread.id,
        sender_id: profile.id,
        content: newMessage,
      })
      .select("*")
      .single();
    if (data) {
      setMessages([...messages, data as Message]);
      setNewMessage("");
      await supabase
        .from("message_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeThread.id);
    }
  };

  if (activeThread) {
    const otherUser = threads.find((t) => t.id === activeThread.id)?.other_user;
    return (
      <div className="flex h-screen flex-col bg-[#f8f6f2]">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 pt-12 pb-3">
          <button onClick={() => setActiveThread(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f6f2]">
            <ArrowLeft size={18} className="text-[#131315]" />
          </button>
          <div className="flex items-center gap-2">
            {otherUser?.profile_photo ? (
              <img src={otherUser.profile_photo} alt={otherUser.name || ""} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f6f2]">
                <MessageSquare size={16} className="text-[#9ca3af]" />
              </div>
            )}
            <span className="text-sm font-semibold text-[#131315]">{otherUser?.name || "User"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === profile?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender_id === profile?.id ? "bg-[#1a1a2e] text-white" : "bg-white text-[#131315]"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-sm text-[#63636b]">No messages yet. Start the conversation!</p>
            )}
          </div>
        </div>

        <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3 pb-5">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-[#f8f6f2] px-4 py-2.5 text-sm text-[#131315] placeholder:text-[#9ca3af] focus:outline-none"
          />
          <button type="submit" disabled={!newMessage.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a2e] disabled:opacity-50">
            <Send size={18} className="text-white" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-xl font-bold text-[#131315]">Messages</h1>
      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-[#63636b]">Loading...</p>}
        {!loading && threads.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center">
            <MessageSquare size={32} className="mx-auto text-[#9ca3af]" />
            <p className="mt-3 text-sm text-[#63636b]">No conversations yet</p>
          </div>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => loadMessages(t)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4"
          >
            {t.other_user?.profile_photo ? (
              <img src={t.other_user.profile_photo} alt={t.other_user.name || ""} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f6f2]">
                <MessageSquare size={20} className="text-[#9ca3af]" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-[#131315]">{t.other_user?.name || "User"}</p>
              <p className="text-xs text-[#63636b]">
                {t.last_message_at ? new Date(t.last_message_at).toLocaleDateString() : "No messages"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
