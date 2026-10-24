"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User as UserIcon,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Radio,
  FileText,
  Car,
  Camera,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import {
  User as UserType,
  ChatMessage,
  getChatStatusApi,
  getChatHistoryApi,
  deleteChatHistoryApi,
  sendChatMessageApi,
} from "@/lib/api";

interface TrafficChatWidgetProps {
  user: UserType | null;
  role: "CITIZEN" | "POLICE" | "ADMIN";
}

// Normalize stored ai_chats entries from backend
function parseStoredChats(rawChats: any[]): ChatMessage[] {
  if (!Array.isArray(rawChats)) return [];
  return rawChats
    .slice(-10)
    .map((c, idx) => {
      const text = c.chat_text || c.text || c.content || "";
      if (!text.trim()) return null;
      const role: "user" | "assistant" =
        c.created_by === "ai" || c.created_by === "assistant" || c.role === "assistant"
          ? "assistant"
          : "user";
      let timestamp = "";
      if (c.created_at || c.timestamp) {
        const d = new Date(c.created_at || c.timestamp);
        timestamp = isNaN(d.getTime())
          ? ""
          : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return {
        id: `stored-${idx}-${c.created_at || idx}`,
        role,
        content: text,
        timestamp,
      };
    })
    .filter((m): m is ChatMessage => m !== null);
}

export function TrafficChatWidget({ user, role }: TrafficChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [agentModel, setAgentModel] = useState<string>("qwen3.8-27b");
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roleName = role || user?.role || "CITIZEN";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Fetch initial agent status info
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await getChatStatusApi();
        if (res?.model) {
          const short = res.model.includes("/") ? res.model.split("/")[1] : res.model;
          setAgentModel(short);
        }
      } catch {
        // Fallback default
      }
    }
    loadStatus();
  }, []);

  // Fetch chat history from ai_chats table when widget is opened or user changes
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let cancelled = false;
    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await getChatHistoryApi(user?.id);
        if (cancelled) return;
        if (res.chatSummary) {
          setChatSummary(res.chatSummary);
        } else {
          setChatSummary(null);
        }
        if (Array.isArray(res.chats)) {
          const loaded = parseStoredChats(res.chats);
          setMessages((prev) => {
            if (prev.length === 0) return loaded;
            const seen = new Set(loaded.map((m) => `${m.role}::${m.content.trim()}`));
            const extras = prev.filter((m) => !seen.has(`${m.role}::${m.content.trim()}`));
            return [...loaded, ...extras].slice(-15);
          });
        }
      } catch (err) {
        console.warn("[TrafficChatWidget] could not load history:", err);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.id]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInputMessage("");
    setIsLoading(true);

    try {
      const historyContext = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessageApi({
        message: userMsg.content,
        history: historyContext,
        role: roleName,
        userId: user?.id,
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: res.message?.content || "I have received your request.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (res.chatSummary) {
        setChatSummary(res.chatSummary);
      }

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Agent Error**: ${err?.message || "Could not process request."}\n\nPlease verify that the backend AI service is online.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your chat history?")) return;
    try {
      await deleteChatHistoryApi(user?.id);
      setMessages([]);
      setChatSummary(null);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Role-specific suggested starter questions
  const getRoleQuickPrompts = () => {
    switch (roleName) {
      case "CITIZEN":
        return [
          { text: "Check my registered vehicles", icon: Car },
          { text: "Do I have any unpaid traffic fines?", icon: FileText },
          { text: "How do I pay my challan online?", icon: ShieldCheck },
          { text: "What is the speed limit in city zones?", icon: AlertCircle },
        ];
      case "POLICE":
        return [
          { text: "Look up plate DL2CAX560", icon: Car },
          { text: "Show summary of unpaid violations", icon: FileText },
          { text: "Check camera speed limits and active junctions", icon: Camera },
          { text: "Search vehicle with plate 2C", icon: ShieldCheck },
        ];
      case "ADMIN":
        return [
          { text: "Give me a city-wide traffic system overview", icon: Radio },
          { text: "What is the total fine revenue collected vs pending?", icon: FileText },
          { text: "Show operational status of all CCTV cameras", icon: Camera },
          { text: "Summarize high-risk violation trends", icon: Sparkles },
        ];
      default:
        return [
          { text: "What can you help me with?", icon: HelpCircle },
          { text: "Check system status", icon: Radio },
        ];
    }
  };

  // Markdown line-by-line renderer
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-[#171717] mt-3 mb-1">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-sm font-bold text-[#171717] mt-3 mb-1 pb-0.5 border-b border-[#E5E5E5]">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-base font-bold text-[#171717] mt-3 mb-1">
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemContent = trimmed.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-[#262626] leading-relaxed my-0.5">
            {renderInlineMarkdown(itemContent)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs text-[#262626] leading-relaxed my-0.5">
            {renderInlineMarkdown(trimmed.replace(/^\d+\.\s/, ""))}
          </li>
        );
      }
      if (trimmed === "---") {
        return <hr key={idx} className="my-2 border-t border-[#E5E5E5]" />;
      }
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-[#262626] leading-relaxed my-0.5">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[#171717]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 bg-[#F0F0F0] text-[#171717] rounded text-[11px] font-mono border border-[#E0E0E0]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const roleBadgeStyles: Record<string, { label: string; bg: string; text: string }> = {
    CITIZEN: { label: "Citizen Assistant", bg: "bg-emerald-50", text: "text-emerald-700" },
    POLICE: { label: "Police Tactical AI", bg: "bg-blue-50", text: "text-blue-700" },
    ADMIN: { label: "Smart City Command AI", bg: "bg-amber-50", text: "text-amber-800" },
  };

  const currentRoleStyle = roleBadgeStyles[roleName] || roleBadgeStyles.CITIZEN;

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setHasUnread(false);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#171717] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-neutral-800 group"
          aria-label="Open Navanagar AI Chatbot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-[#BAE2EF] group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#171717] animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-tight">Navanagar AI</span>
            <span className="text-[10px] text-[#A3A3A3] font-medium">{currentRoleStyle.label}</span>
          </div>
          {hasUnread && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-1" />
          )}
        </button>
      )}

      {/* Floating Chat Modal / Window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? "inset-4 sm:inset-10 max-w-4xl mx-auto h-[calc(100vh-5rem)]"
              : "bottom-6 right-6 w-[94vw] sm:w-[440px] h-[640px] max-h-[88vh]"
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-[#FAF9F6] border-b border-[#E5E5E5] flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#171717] text-[#BAE2EF] flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs tracking-tight text-[#171717]">
                    Navanagar AI
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${currentRoleStyle.bg} ${currentRoleStyle.text}`}
                  >
                    {roleName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#737373]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Agent SDK • {agentModel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 text-[#737373] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear conversation history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#F0F0F0] rounded-lg transition-colors hidden sm:block"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#F0F0F0] rounded-lg transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rolling Summary Banner (if available) */}
          {chatSummary && (
            <div className="px-3.5 py-2 bg-[#F6F8FA] border-b border-[#E5E5E5] text-[11px] text-[#525252] flex items-start gap-2 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <span className="font-semibold text-[#171717] mr-1">Context Summary:</span>
                <span className="line-clamp-2 leading-tight">{chatSummary}</span>
              </div>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F6]">
            {isLoadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-[#737373]">
                <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                <span>Loading conversation history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-[#BAE2EF]/30 text-[#171717] flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-[#171717]" />
                </div>
                <h3 className="text-sm font-bold text-[#171717] mb-1">
                  How can I assist you today, {user?.name?.split(" ")[0] || "Officer"}?
                </h3>
                <p className="text-[11px] text-[#737373] max-w-xs leading-relaxed mb-4">
                  {roleName === "CITIZEN" &&
                    "Inquire about your registered vehicles, check challan and fine amounts, or ask traffic regulation questions."}
                  {roleName === "POLICE" &&
                    "Search vehicle license plates, review unpaid violations across city cameras, and check junction speed limits."}
                  {roleName === "ADMIN" &&
                    "Access executive summaries of city-wide traffic enforcement, camera health, and fine collection statistics."}
                </p>

                {/* Suggested Starters */}
                <div className="w-full space-y-1.5 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] px-1">
                    Suggested Queries
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {getRoleQuickPrompts().map((prompt, idx) => {
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt.text)}
                          className="w-full text-left p-2.5 bg-white border border-[#E5E5E5] hover:border-[#171717] rounded-xl transition-all flex items-center justify-between group shadow-2xs"
                        >
                          <div className="flex items-center gap-2 text-xs text-[#171717]">
                            <Icon className="w-3.5 h-3.5 text-[#737373] group-hover:text-[#171717]" />
                            <span className="line-clamp-1">{prompt.text}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#A3A3A3] group-hover:text-[#171717] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-[#171717] text-[#BAE2EF] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      msg.role === "user"
                        ? "bg-[#171717] text-white rounded-br-xs shadow-2xs"
                        : "bg-white border border-[#E5E5E5] text-[#262626] rounded-bl-xs shadow-2xs"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-0.5">{renderFormattedContent(msg.content)}</div>
                    )}
                    {msg.timestamp && (
                      <div
                        className={`text-[9px] mt-1.5 ${
                          msg.role === "user" ? "text-neutral-400 text-right" : "text-[#A3A3A3]"
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-[#BAE2EF] text-[#171717] flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold shadow-2xs">
                      {(user?.name?.charAt(0) || "U").toUpperCase()}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* In-Flight Thinking Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-[#171717] text-[#BAE2EF] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="bg-white border border-[#E5E5E5] rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-[#737373] flex items-center gap-2 shadow-2xs">
                  <div className="w-3.5 h-3.5 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin" />
                  <span>Agent is reasoning & executing database tools...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer Bar */}
          <div className="p-3 bg-white border-t border-[#E5E5E5] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 bg-[#FAF9F6] border border-[#E5E5E5] rounded-xl p-1.5 focus-within:border-[#171717] transition-all"
            >
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  roleName === "CITIZEN"
                    ? "Ask about your vehicles, challans, or rules..."
                    : roleName === "POLICE"
                    ? "Lookup license plate, ask for unpaid summary..."
                    : "Request system status, fine revenue, cameras..."
                }
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 resize-none px-2.5 py-1.5 text-xs text-[#171717] placeholder-[#A3A3A3] focus:outline-none max-h-24 min-h-[34px]"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-8 h-8 rounded-lg bg-[#171717] hover:bg-neutral-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-xs"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-[#A3A3A3] px-1">
              <span>Enter to send • Shift + Enter for new line</span>
              <span className="font-semibold text-[#737373]">OpenAI Agent SDK</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default TrafficChatWidget;
