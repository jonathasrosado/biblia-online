import React from 'react';
import SEO from '../components/SEO';
import { useSearchParams } from 'react-router-dom';
import ChatBot from '../components/ChatBot';

import { ReadingPreferences } from '../types';

interface ChatPageProps {
    language: string;
    t: any;
    preferences: ReadingPreferences;
}

const ChatPage: React.FC<ChatPageProps> = ({ language, t, preferences }) => {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('p') || undefined;

    return (
        <div className="h-full flex flex-col">
            <SEO
                title={`${t.chat}`}
                description="Converse com a IA sobre a Bíblia e tire suas dúvidas teológicas."
            />

            <div className="flex-1 h-full overflow-hidden">
                <ChatBot
                    language={language}
                    t={t}
                    initialMessage={initialQuery}
                    preferences={preferences}
                />
            </div>
        </div>
    );
};

export default ChatPage;
