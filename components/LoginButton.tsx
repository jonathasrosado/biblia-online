import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { User } from 'lucide-react';

// REPLACE WITH YOUR ACTUAL GOOGLE CLIENT ID
// Get it from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = "831743160144-0plrd3o0o4a7kth481ks1vjth1o0c1ns.apps.googleusercontent.com";

interface LoginButtonProps {
    onLoginSuccess: (user: any) => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onLoginSuccess }) => {
    const [user, setUser] = useState<any>(null);

    const handleSuccess = async (credentialResponse: any) => {
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            console.log("Google Login Success:", decoded);
            setUser(decoded);

            // Send to backend to save/update user
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: decoded })
            });

            if (res.ok) {
                const data = await res.json();
                onLoginSuccess(data.user);
            }
        } catch (error) {
            console.error("Login Failed", error);
        }
    };

    if (user) {
        return (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-stone-100 dark:bg-stone-800">
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                <div className="text-xs">
                    <div className="font-bold truncate max-w-[100px]">{user.name}</div>
                    <div className="opacity-50 cursor-pointer hover:text-red-500" onClick={() => setUser(null)}>Sair</div>
                </div>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="overflow-hidden rounded-lg">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => console.log('Login Failed')}
                    useOneTap
                    shape="pill"
                    size="medium"
                    text="signin_with"
                />
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginButton;
