import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, MessageSquare, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';

import { ReadingPreferences } from '../types';

interface ChatBotProps {
  language: string;
  t: any;
  initialMessage?: string;
  preferences: ReadingPreferences;
}

const ChatBot: React.FC<ChatBotProps> = ({ language, t, initialMessage, preferences }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasInitialSent = useRef(false);

  const suggestions = [
    "Quem foi a esposa de Caim?",
    "Por que Deus permite o sofrimento?",
    "O que a Bíblia diz sobre ansiedade?",
    "Quais são os sinais do fim dos tempos?",
    "Diferença entre Alma e Espírito",
    "Posso perder a Salvação?"
  ];

  useEffect(() => {
    // Reset messages if language changes
    setMessages([
      { id: '1', role: 'model', text: t.chatWelcome }
    ]);
  }, [language, t]);

  // Handle Initial Message (from URL)
  useEffect(() => {
    if (initialMessage && !hasInitialSent.current && !isLoading) {
      hasInitialSent.current = true;
      handleAutoSend(initialMessage);
    }
  }, [initialMessage]);

  const handleAutoSend = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const responseText = await sendChatMessage(text, [{ id: '1', role: 'model', text: t.chatWelcome }], language);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Ocorreu um erro ao conectar com o serviço." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;

    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass current messages as history
      const responseText = await sendChatMessage(userMsg.text, messages, language);

      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Ocorreu um erro ao conectar com o serviço." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown Renderer with Link Support
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // 1. Headers (###)
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-bible-accent dark:text-bible-gold">{parseInline(line.replace('### ', ''))}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-5 mb-3 text-bible-accent dark:text-bible-gold">{parseInline(line.replace('## ', ''))}</h2>;
      }

      // 2. Lists
      // Ordered (1. )
      const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (orderedMatch) {
        return (
          <div key={i} className="ml-4 mb-2 flex gap-2">
            <span className="font-bold min-w-[1.5rem] text-bible-gold">{orderedMatch[1]}.</span>
            <span>{parseInline(orderedMatch[2])}</span>
          </div>
        );
      }
      // Unordered (* or -)
      const unorderedMatch = line.match(/^[\*\-]\s+(.*)/);
      if (unorderedMatch) {
        return (
          <div key={i} className="ml-4 mb-2 flex gap-2">
            <span className="min-w-[1rem] text-bible-gold">•</span>
            <span>{parseInline(unorderedMatch[1])}</span>
          </div>
        );
      }

      // 3. Empty lines (Paragraph breaks)
      if (line.trim() === '') return <div key={i} className="h-2"></div>;

      // 4. Regular Paragraphs
      return <p key={i} className="mb-2 leading-relaxed">{parseInline(line)}</p>;
    });
  };

  // Helper for inline formatting (Bold, Italic, Links)
  const parseInline = (text: string) => {
    // Robust Regex to capture:
    // 1. Links: [text](url)
    // 2. Bold: **text**
    // 3. Italic: *text* (handling spaces to avoid accidental list bullets if passed inline)

    // Split by tokens, keeping delimiters
    const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*[^*\s]+(?:[^*]*[^*\s])?\*)/g);

    return parts.map((part, index) => {
      // Link: [text](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];

        // Internal Link
        if (linkUrl.startsWith('/')) {
          return <Link key={index} to={linkUrl} className={`${preferences.theme === 'bw' ? 'text-black bg-stone-100 hover:bg-stone-200' : 'text-bible-gold bg-bible-gold/10'} hover:underline font-bold px-1 rounded`}>{linkText}</Link>;
        }
        // External Link
        return (
          <a key={index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{linkText}</a>
        );
      }

      // Bold: **text**
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index} className="font-bold text-bible-text dark:text-gray-100">{part.slice(2, -2)}</strong>;
      }

      // Italic: *text*
      // Ensure it's not just a single * or star + space
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.includes('**')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }

      return part;
    });
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full transition-colors
      ${preferences.theme === 'bw'
        ? 'bg-white text-black'
        : 'bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100'}
    `}>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto px-4 pt-4 pb-0 md:p-6 md:pb-0 space-y-6 flex flex-col justify-start`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>

            <div className={`flex gap-3 max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

              {/* Avatar */}
              <div className={`
                    w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'user'
                  ? (preferences.theme === 'bw' ? 'bg-black text-white' : 'bg-bible-gold text-white')
                  : (preferences.theme === 'bw' ? 'bg-white text-black border border-black' : 'bg-white dark:bg-stone-800 text-bible-accent dark:text-bible-gold border border-stone-100 dark:border-stone-700')}
                `}>
                {msg.role === 'user' ? <User size={18} /> : <BookOpen size={18} />}
              </div>

              {/* Bubble */}
              <div className={`
                p-4 md:p-5 rounded-xl shadow-sm text-sm md:text-base leading-relaxed relative group
                ${msg.role === 'user'
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-tr-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 rounded-tl-sm'}
                `}>
                <div className="markdown-content">
                  {msg.role === 'user' ? msg.text : renderMarkdown(msg.text)}
                </div>

                {/* Share Button (User Only) */}
                {msg.role === 'user' && (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/chat?p=${encodeURIComponent(msg.text)}`;
                      navigator.clipboard.writeText(url);
                      // Optional: Show toast or feedback
                    }}
                    className="absolute -left-8 top-0 p-1.5 rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-bible-gold shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    title="Copiar Link da Pergunta"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex gap-3 max-w-[75%]">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white dark:bg-stone-800 text-bible-accent dark:text-bible-gold border border-stone-100 dark:border-stone-700 flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen size={18} className="animate-spin" />
              </div>
              <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl rounded-tl-none border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-2">
                <Loader2 className="animate-spin text-bible-gold" size={18} />
                <span className="text-stone-500 text-sm italic">Pensando...</span>
              </div>
            </div>
          </div>
        )}

        {/* Ice Breakers (Show only if standard welcome message is the only one) */}
        {/* Ice Breakers removed from here, now above input */}
        {/* Ice Breakers / Suggestions (In-Chat) */}


        <div ref={bottomRef} />
      </div>

      {/* Suggestions Carousel (Above Input Border) */}
      {!isLoading && messages.length <= 1 && (
        <div className="w-full overflow-x-auto px-4 pb-3 bg-stone-50/50 dark:bg-stone-950/50 flex gap-2 [&::-webkit-scrollbar]:hidden transition-colors" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(undefined, suggestion)}
              className={`flex-shrink-0 px-4 py-2 bg-white dark:bg-stone-800 border rounded-lg text-sm transition-all shadow-sm whitespace-nowrap active:scale-95
                ${preferences.theme === 'bw'
                  ? 'border-stone-200 text-black hover:bg-black hover:text-white hover:border-black'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-bible-gold hover:text-bible-gold dark:hover:border-bible-gold'}
              `}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Area with Suggestions */}
      <div className="bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 transition-colors z-10 flex flex-col">

        {/* Suggestions Carousel (Fixed in Footer) */}


        <div className="p-4 pt-2">
          <form onSubmit={(e) => sendMessage(e)} className="flex gap-3 max-w-4xl mx-auto items-end">
            <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg focus-within:ring-2 focus-within:ring-bible-gold/50 transition-all shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faça uma pergunta..."
                className="w-full px-4 py-3 bg-transparent border-none focus:outline-none text-stone-900 dark:text-stone-100 dark:placeholder-stone-500 resize-none max-h-32 min-h-[48px] overflow-y-auto text-sm leading-relaxed"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`px-6 py-3 min-h-[48px] flex items-center justify-center rounded-lg transition-all shadow-md hover:shadow-xl active:scale-95 flex-shrink-0 text-white font-bold text-sm uppercase tracking-wider disabled:cursor-not-allowed
                ${preferences.theme === 'bw'
                  ? 'bg-black hover:bg-stone-800'
                  : 'bg-bible-gold hover:bg-yellow-600'}
              `}
            >
              ENVIAR
            </button>
          </form>
        </div>

        <div className="text-center mt-2 pb-2">
          <span className="text-[10px] text-stone-400">A IA pode cometer erros. Verifique sempre nas Escrituras.</span>
        </div>
      </div >
    </div >
  );
};

export default ChatBot;