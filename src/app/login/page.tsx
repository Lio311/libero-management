'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Activity, ChevronRight } from 'lucide-react';
import { login } from './actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | false>(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (isLoading || token.length < 4) return;
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
        animate(x, 0, { type: 'spring', bounce: 0.2 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [0, containerWidth - 56],
    ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.2)']
  );

  const disabled = isLoading || token.length < 4;

  const handleDragEnd = () => {
    if (x.get() > containerWidth * 0.55 && !disabled) {
      handleLogin();
      animate(x, containerWidth - 56, { type: 'spring', bounce: 0, duration: 0.3 });
    } else {
      animate(x, 0, { type: 'spring', bounce: 0.2, duration: 0.4 });
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
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
            
            <div className="relative h-16 w-36 overflow-hidden mb-2">
              <Image src="/libero-d.png" alt="Libero Logo" fill className="object-cover object-center invert opacity-90" priority />
            </div>
            <p className="text-zinc-400 text-sm mb-10 tracking-widest uppercase">Management</p>

            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative mb-6">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value.replace(/[^0-9]/g, ''));
                    setError(false);
                    animate(x, 0, { type: 'spring', bounce: 0.2 });
                  }}
                  className={`w-full bg-zinc-900/50 border text-center text-xl tracking-[0.5em] font-mono ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'} rounded-xl py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-4 ${error ? 'focus:ring-red-500/10' : 'focus:ring-white/5'} transition-all duration-300 backdrop-blur-md`}
                  placeholder="000000"
                  disabled={isLoading}
                  autoFocus
                />
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
              </div>

              <div dir="ltr" ref={containerRef} className="relative w-full h-14 bg-zinc-900/50 rounded-full overflow-hidden flex items-center justify-center border border-white/10 mt-4 backdrop-blur-md">
                <motion.div style={{ background }} className="absolute inset-0 z-0" />
                <span className="text-zinc-500 font-medium z-0 select-none text-sm tracking-wider uppercase">
                  {isLoading ? 'Unlocking...' : 'Slide to unlock'}
                </span>
                
                {!isLoading && (
                  <motion.div
                    drag={disabled ? false : "x"}
                    dragConstraints={{ left: 0, right: containerWidth > 0 ? containerWidth - 56 : 0 }}
                    dragElastic={0.05}
                    onDragEnd={handleDragEnd}
                    style={{ x }}
                    className={`absolute left-1 w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-lg ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <ChevronRight className="w-5 h-5 text-black" />
                  </motion.div>
                )}
                {isLoading && (
                  <div className="absolute right-1 w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-lg">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                    />
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

