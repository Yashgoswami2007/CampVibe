import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Bot, User, ArrowRight, Calendar, Clock, MapPin, ExternalLink, RefreshCw } from 'lucide-react';
import { AssistantMessage, CampusAnnouncement, StudentProfile } from '../types';
import { formatDate } from '../lib/dates';

interface AiCampusAssistantProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  isOpen?: boolean;
  onClose: () => void;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
}

const SUGGESTED_QUESTIONS = [
  'What is happening today on campus?',
  'What deadlines are closing in the next 48 hours?',
  'Show me AI & Hackathon opportunities',
  'Are there any paid internship or placement drives?',
  'What workshops can I attend this week?',
];

export const AiCampusAssistant: React.FC<AiCampusAssistantProps> = ({
  profile,
  announcements,
  isOpen = true,
  onClose,
  onSelectAnnouncement,
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello ${profile.name.split(' ')[0]}! I'm your AI Campus Assistant. Ask me anything about upcoming campus events, urgent registration cutoffs, hackathons, or opportunities matching your ${profile.department} roadmap.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const announcementMap = new Map<string, CampusAnnouncement>();
  announcements.forEach((a) => announcementMap.set(a.id, a));

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputText).trim();
    if (!q || isTyping) return;

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          announcements,
          profile,
          today: '2026-10-31',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to get answer');
      }

      const assistantMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: json.data?.answer || 'I looked through the campus notices and found the matching items below.',
        related_announcement_ids: json.data?.related_announcement_ids || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Assistant error:', err);
      const fallbackMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: 'Sorry, I had trouble reaching the AI service right now. Please try asking again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl h-[88vh] bg-white rounded-3xl shadow-2xl border border-[#E0DBD0] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2EFE9] bg-[#FAF8F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C96B35] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#292A28]">
                  AI Campus Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF3EB] text-[#C96B35] border border-[#F8DCBA]">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-[#787774]">
                Grounded in {announcements.length} campus announcements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#787774] hover:text-[#292A28] hover:bg-[#EFECE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FCFBF8]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const relatedItems = (msg.related_announcement_ids || [])
              .map((id) => announcementMap.get(id))
              .filter((a): a is CampusAnnouncement => Boolean(a));

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#FDF3EB] border border-[#F8DCBA] text-[#C96B35] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-2.5`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-[#292A28] text-white rounded-tr-xs'
                        : 'bg-white border border-[#EAE6DF] text-[#292A28] rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1.5 font-mono ${
                        isUser ? 'text-white/60 text-right' : 'text-[#8C8880]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Render referenced announcement cards if any */}
                  {relatedItems.length > 0 && (
                    <div className="space-y-2 pl-1">
                      <div className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider">
                        Referenced Campus Notices:
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {relatedItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              onSelectAnnouncement(item);
                            }}
                            className="p-3 bg-white rounded-xl border border-[#E0DBD0] hover:border-[#C96B35] cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold text-[#C96B35] uppercase">
                                {item.category}
                              </div>
                              <h5 className="text-xs font-bold text-[#292A28] truncate group-hover:text-[#C96B35] transition-colors">
                                {item.title}
                              </h5>
                              <div className="flex items-center gap-3 text-[10px] text-[#787774] mt-0.5">
                                {item.event_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(item.event_date)}
                                  </span>
                                )}
                                {item.venue && (
                                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                                    <MapPin className="w-3 h-3" />
                                    {item.venue}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-[#C96B35] shrink-0 flex items-center gap-1">
                              View <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#292A28] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-[#FDF3EB] text-[#C96B35] flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#EAE6DF] text-xs text-[#787774] flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#C96B35]/30 border-t-[#C96B35] rounded-full animate-spin" />
                <span>Checking campus database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Question Chips */}
        <div className="px-4 py-2 border-t border-[#F2EFE9] bg-white overflow-x-auto flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-[#8C8880] uppercase tracking-wider shrink-0 mr-1">
            Try:
          </span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#FAF8F3] hover:bg-[#FDF3EB] text-[#555] hover:text-[#C96B35] border border-[#E8E5DF] transition-colors whitespace-nowrap shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#F2EFE9] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about events, eligibility, deadlines, venues, or links..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E0DBD0] text-xs text-[#292A28] placeholder-[#9B9890] focus:outline-none focus:border-[#C96B35] transition-colors"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#C96B35] text-white hover:bg-[#B85E2B] disabled:opacity-40 transition-colors shadow-2xs font-bold text-xs flex items-center gap-1.5 shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
