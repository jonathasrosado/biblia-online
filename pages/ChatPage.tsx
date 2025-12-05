import React from 'react';
import { Helmet } from 'react-helmet-async';
import ChatBot from '../components/ChatBot';

interface ChatPageProps {
    language: string;
    t: any;
}

const ChatPage: React.FC<ChatPageProps> = ({ language, t }) => {
    return (
        <div className="h-full flex flex-col">
            <Helmet>
                <title>{`${t.chat} - ${t.appTitle}`}</title>
                <meta name="description" content="Converse com a IA sobre a Bíblia e tire suas dúvidas teológicas." />
            </Helmet>

            <div className="flex-1 overflow-y-auto">
                <ChatBot language={language} t={t} />
            </div>
        </div>
    );
};

export default ChatPage;
