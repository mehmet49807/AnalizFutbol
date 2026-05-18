import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Github, AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { signInWithGoogle, signUpWithEmail, loginWithEmail, resetPassword } from '../lib/firebase';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'signup' | 'forgot' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
    setAdminCode('');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google ile giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        if (password.length < 6) throw new Error('Şifre en az 6 karakter olmalıdır.');
        await signUpWithEmail(email, password);
        onClose();
      } else if (mode === 'login' || mode === 'admin') {
        if (mode === 'admin') {
          if (adminCode !== 'ADMIN2026') {
            throw new Error('Geçersiz Admin Kodu.');
          }
          localStorage.setItem('is_admin_setup', 'true');
        }
        await loginWithEmail(email, password);
        
        // If admin mode, we need to ensure the role is set in Firestore
        // In a real app this is done via Functions, here we might need a small delay or a trigger
        // The rules allow admins to write to matches, but we need to set the role first.
        // We'll handle the role assignment in FirebaseProvider if the special email is used,
        // or we can try to update it here if the rules allow (they don't by default for safety).
        onClose();
      } else {
        await resetPassword(email);
        setSuccess('Şifre sıfırlama bağlantısı e-postanıza gönderildi.');
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = 'Kullanıcı bulunamadı.';
      if (err.code === 'auth/wrong-password') msg = 'Hatalı şifre.';
      if (err.code === 'auth/email-already-in-use') msg = 'Bu e-posta zaten kullanımda.';
      setError(msg || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Progress bar at top */}
        {loading && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="absolute top-0 left-0 h-1 bg-emerald-500 z-10"
          />
        )}

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-emerald-500 decoration-4 underline-offset-8">
              {mode === 'login' ? 'Giriş Yap' : mode === 'signup' ? 'Kayıt Ol' : mode === 'admin' ? 'Admin Girişi' : 'Şifre Sıfırla'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-neutral-200 transition-all group"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Google ile {mode === 'login' ? 'Giriş Yap' : 'Devam Et'}
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-neutral-600">
                <span className="bg-neutral-900 px-3">VEYA E-POSTA İLE</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'admin' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="password"
                    required
                    placeholder="Admin Güvenlik Kodu"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full bg-neutral-800 border border-emerald-500/30 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-mono"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ad Soyad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="E-posta Adresi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    required
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? 'Giriş Yap' : mode === 'signup' ? 'Kayıt Ol' : 'Bağlantı Gönder'}
              </button>
            </form>

            <div className="flex flex-col gap-3 text-center">
              {mode === 'login' ? (
                <>
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs font-bold text-neutral-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Şifremi Unuttum</button>
                  <p className="text-xs text-neutral-400">
                    Hesabın yok mu? <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-emerald-500 font-bold hover:underline">Kayıt Ol</button>
                  </p>
                  <button type="button" onClick={() => { setMode('admin'); setError(''); }} className="text-[10px] font-black text-neutral-700 hover:text-emerald-500/50 transition-colors uppercase tracking-[0.2em] mt-2">🛡️ Admin Girişi</button>
                </>
              ) : mode === 'signup' ? (
                <p className="text-xs text-neutral-400">
                  Zaten üye misin? <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-emerald-500 font-bold hover:underline">Giriş Yap</button>
                </p>
              ) : (
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-xs font-bold text-neutral-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Girişe Dön</button>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-8 py-4 bg-black/20 border-t border-neutral-800/50 flex items-center justify-center gap-2">
           <ShieldCheck className="w-4 h-4 text-neutral-600" />
           <span className="text-[10px] uppercase font-black tracking-widest text-neutral-600 uppercase">Güvenli Şifreleme</span>
        </div>
      </motion.div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
