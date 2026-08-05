'use client';

import { useState, useEffect } from 'react';
import { generateSetupCode, verifyAndSaveSecret } from './actions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function Setup2FAPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const result = await generateSetupCode();
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result.qrCodeUrl && result.secret) {
        setQrCodeUrl(result.qrCodeUrl);
        setSecret(result.secret);
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || !token) return;
    
    setError(null);
    setIsVerifying(true);
    
    const result = await verifyAndSaveSecret(secret, token);
    setIsVerifying(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else if (result.error) {
      setError(result.error);
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
        className="z-10 w-full max-w-md p-8"
      >
        <div className="backdrop-blur-2xl bg-zinc-950/40 border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden relative text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-inner"
            >
              <Shield className="text-white w-8 h-8" />
            </motion.div>
            
            <h1 className="text-2xl font-semibold text-white mb-2 tracking-wide">הגדרת אימות דו-שלבי</h1>
            <p className="text-zinc-400 text-sm mb-8">
              סרוק את הברקוד באפליקציית Google Authenticator והזן את הקוד שמופיע.
            </p>

            {isLoading ? (
              <div className="flex justify-center mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
                />
              </div>
            ) : isSuccess ? (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                className="flex flex-col items-center text-green-400 mb-8"
              >
                <CheckCircle2 className="w-16 h-16 mb-4" />
                <p>האימות הוגדר בהצלחה!</p>
              </motion.div>
            ) : qrCodeUrl ? (
              <>
                <div className="bg-white p-4 rounded-xl mb-6 shadow-lg inline-block">
                  <Image src={qrCodeUrl} alt="QR Code" width={150} height={150} />
                </div>
                
                <form onSubmit={handleVerify} className="w-full">
                  <div className="relative mb-6">
                    <input
                      type="text"
                      maxLength={6}
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value.replace(/[^0-9]/g, ''));
                        setError(null);
                      }}
                      className={`w-full bg-zinc-900/50 border text-center text-xl tracking-[0.5em] font-mono ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'} rounded-xl py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-4 ${error ? 'focus:ring-red-500/10' : 'focus:ring-white/5'} transition-all duration-300 backdrop-blur-md`}
                      placeholder="000000"
                      disabled={isVerifying}
                      autoFocus
                    />
                    {error && (
                      <p className="text-red-400 text-sm mt-2">{error}</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isVerifying || token.length < 6}
                    className="w-full bg-white text-black font-medium py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isVerifying ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                      />
                    ) : (
                      <>
                        <span>אימות ושמירה</span>
                        <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>
              </>
            ) : (
               <p className="text-red-400 text-sm mb-4">{error}</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
