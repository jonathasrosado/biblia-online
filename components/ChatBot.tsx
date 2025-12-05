import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface ChatBotProps {
  language: string;
  t: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ language, t }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset messages if language changes
    setMessages([
      { id: '1', role: 'model', text: t.chatWelcome }
    ]);
  }, [language, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass current messages as history (excluding the one we just added to UI but not to state yet)
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

  // Simple Markdown Renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // 1. Headers (###)
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{parseInline(line.replace('### ', ''))}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-5 mb-3">{parseInline(line.replace('## ', ''))}</h2>;
      }

      // 2. Lists
      // Ordered (1. )
      const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (orderedMatch) {
        return (
          <div key={i} className="ml-4 mb-2 flex gap-2">
            <span className="font-bold min-w-[1.5rem]">{orderedMatch[1]}.</span>
            <span>{parseInline(orderedMatch[2])}</span>
          </div>
        );
      }
      // Unordered (* or -)
      const unorderedMatch = line.match(/^[\*\-]\s+(.*)/);
      if (unorderedMatch) {
        return (
          <div key={i} className="ml-4 mb-2 flex gap-2">
            <span className="min-w-[1rem]">•</span>
            <span>{parseInline(unorderedMatch[1])}</span>
          </div>
        );
      }

      // 3. Empty lines (Paragraph breaks)
      if (line.trim() === '') {
        return <div key={i} className="h-2"></div>;
      }

      // 4. Regular Paragraphs
      return <p key={i} className="mb-1">{parseInline(line)}</p>;
    });
  };

  // Helper for inline formatting (Bold, Italic)
  const parseInline = (text: string) => {
    // We need to return an array of React nodes or a string
    // This simple regex replacement is tricky with React nodes. 
    // Let's use dangerouslySetInnerHTML for inline parts for simplicity, 
    // OR split by regex.

    // Splitting by bold marker **
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
              ${msg.role === 'user'
                ? 'bg-bible-text dark:bg-stone-700 text-white rounded-br-none'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 rounded-bl-none'
              }
            `}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-bold uppercase tracking-wider">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                {msg.role === 'user' ? 'Você' : 'AI'}
              </div>

              {/* Render Content */}
              <div className="markdown-content">
                {msg.role === 'user' ? msg.text : renderMarkdown(msg.text)}
              </div>

            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl rounded-bl-none border border-stone-200 dark:border-stone-800 shadow-sm">
              <Loader2 className="animate-spin text-bible-gold" size={20} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 transition-colors">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatPlaceholder}
            className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-bible-gold/50 text-stone-900 dark:text-stone-100 dark:placeholder-stone-400 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-bible-gold hover:bg-yellow-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;