import React, { useState, useContext } from 'react';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ToastContext } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toastContext = useContext(ToastContext);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('กรุณากรอกอีเมลและรหัสผ่าน');
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const token = await user.getIdToken();

            localStorage.setItem('authToken', token);
            toastContext?.showToast('เข้าสู่ระบบสำเร็จ!', 'success');
            onLoginSuccess();
            
        } catch (err: any) {
            let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
            if (err.code) {
                switch (err.code) {
                    case 'auth/invalid-credential':
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'ตรวจพบการเข้าสู่ระบบผิดพลาดหลายครั้ง โปรดลองใหม่อีกครั้งในภายหลัง';
                        break;
                    default:
                        console.error("Firebase Auth Error:", err);
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-brand-950 bg-grid-pattern p-4">
             <style>{`
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-up {
                        animation: fade-in-up 0.4s ease-out forwards;
                    }
                `}</style>
            <Card className="w-full max-w-sm animate-fade-in-up">
                <div className="p-8">
                    <div className="flex flex-col items-center mb-6">
                         <div className="bg-brand-600 p-3 rounded-full mb-3">
                             <ShieldCheck className="text-white h-8 w-8" />
                         </div>
                        <h1 className="text-3xl font-bold text-brand-800">CYBERWATCH</h1>
                        <p className="text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                required
                            />
                        </div>

                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-focus-ring"
                                required
                            />
                        </div>
                        
                        {error && <p className="text-danger text-sm text-center">{error}</p>}

                        <Button type="submit" className="w-full !py-3 !text-base" disabled={isLoading}>
                            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default Login;
