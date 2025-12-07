import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import ChatBot from '../components/ChatBot';

interface ChatPageProps {
    language: string;
    t: any;
}

const ChatPage: React.FC<ChatPageProps> = ({ language, t }) => {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('p') || undefined;

    return (
        <div className="h-full flex flex-col">
            <Helmet>
                <title>{`${t.chat} - ${t.appTitle}`}</title>
                <meta name="description" content="Converse com a IA sobre a Bíblia e tire suas dúvidas teológicas." />
            </Helmet>

            <div className="flex-1 h-full overflow-hidden">
                <ChatBot
                    language={language}
                    t={t}
                    initialMessage={initialQuery}
                />
            </div>
        </div>
    );
};

export default ChatPage;
