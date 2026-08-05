'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Activity } from 'lucide-react';
import { login } from './actions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | false>(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    try {
      const res = await login(token);
      if (res.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(res.error || 'שגיאה בהתחברות');
        setToken('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-zinc-900 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-md p-8"
      >
        <div className="backdrop-blur-2xl bg-zinc-950/40 border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-inner"
            >
              <Activity className="text-white w-8 h-8" />
            </motion.div>
            
            <h1 className="text-3xl font-light text-white mb-2 tracking-wide">Libero</h1>
            <p className="text-zinc-400 text-sm mb-10 tracking-widest uppercase">Management</p>

            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative mb-6">
                <input
                  type="text"
                  maxLength={6}
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value.replace(/[^0-9]/g, ''));
                    setError(false);
                  }}
                  className={`w-full bg-zinc-900/50 border text-center text-xl tracking-[0.5em] font-mono ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'} rounded-xl py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-4 ${error ? 'focus:ring-red-500/10' : 'focus:ring-white/5'} transition-all duration-300 backdrop-blur-md`}
                  placeholder="000000"
                  disabled={isLoading}
                  autoFocus
                />
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || token.length < 4}
                className="w-full bg-white text-black font-medium py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                  />
                ) : (
                  <>
                    <span>Unlock</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

