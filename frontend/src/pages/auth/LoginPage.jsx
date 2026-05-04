import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import { Mail, Phone, ArrowRight, Shield, Store, User } from 'lucide-react';

const STEPS = { METHOD: 'method', OTP: 'otp' };

export default function LoginPage() {
  const [step,       setStep]       = useState(STEPS.METHOD);
  const [method,     setMethod]     = useState('email');    // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [otp,        setOtp]        = useState('');
  const [role,       setRole]       = useState('customer'); // customer | vendor
  const [isRegister, setIsRegister] = useState(false);

  const { sendOtp, verifyOtp, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error('Please enter your email or phone.');
    const res = await sendOtp(identifier.trim(), method, isRegister ? 'register' : 'login');
    if (res.ok) {
      toast.success(res.message);
      setStep(STEPS.OTP);
    } else {
      toast.error(res.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP.');
    const res = await verifyOtp(identifier.trim(), method, otp, role);
    if (res.ok) {
      toast.success('Welcome! Redirecting…');
      navigate(res.redirectPath || '/');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-400 rounded-2xl mb-4 shadow-lg shadow-amber-400/30">
            <Store size={28} className="text-neutral-950" />
          </div>
          <h1 className="text-2xl font-bold text-white">{process.env.REACT_APP_STORE_NAME || 'YourStore'}</h1>
          <p className="text-neutral-400 mt-1 text-sm">Multi-Vendor Marketplace</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-neutral-400 text-sm mb-6">
            {step === STEPS.METHOD
              ? 'Enter your details to continue'
              : `OTP sent to ${identifier}`}
          </p>

          {/* ── Step 1: Identifier ─────────────────────────────────────────── */}
          {step === STEPS.METHOD && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Method toggle */}
              <div className="flex bg-neutral-800 rounded-xl p-1">
                {['email', 'phone'].map((m) => (
                  <button
                    key={m} type="button"
                    onClick={() => setMethod(m)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                      ${method === m ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {m === 'email' ? <Mail size={14} /> : <Phone size={14} />}
                    {m === 'email' ? 'Email' : 'Phone'}
                  </button>
                ))}
              </div>

              <input
                type={method === 'email' ? 'email' : 'tel'}
                placeholder={method === 'email' ? 'you@example.com' : '+91 98765 43210'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                           placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />

              {/* Role selector (only on register) */}
              {isRegister && (
                <div className="flex bg-neutral-800 rounded-xl p-1">
                  {[
                    { key: 'customer', label: 'Customer', Icon: User },
                    { key: 'vendor',   label: 'Vendor',   Icon: Store },
                  ].map(({ key, label, Icon }) => (
                    <button
                      key={key} type="button"
                      onClick={() => setRole(key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                        ${role === key ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold py-3 rounded-xl
                           flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send OTP'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP Verification ───────────────────────────────────── */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3">
                <Shield size={16} className="text-amber-400 shrink-0" />
                <p className="text-amber-300 text-xs">
                  Enter the 6-digit OTP we sent to <strong>{identifier}</strong>
                </p>
              </div>

              <input
                type="text" inputMode="numeric" maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-4
                           text-center text-2xl tracking-[0.6em] placeholder-neutral-600
                           focus:outline-none focus:border-amber-400 transition-colors font-mono"
                required
              />

              <button
                type="submit" disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold py-3 rounded-xl
                           flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
                {!loading && <ArrowRight size={16} />}
              </button>

              <button
                type="button" onClick={() => setStep(STEPS.METHOD)}
                className="w-full text-neutral-500 hover:text-neutral-300 text-sm py-2 transition-colors"
              >
                ← Change {method}
              </button>
            </form>
          )}

          {/* Toggle register/login */}
          <div className="mt-6 text-center">
            <p className="text-neutral-500 text-sm">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button
                onClick={() => { setIsRegister(!isRegister); setStep(STEPS.METHOD); }}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-neutral-600 text-xs mt-6">
          Secured with OTP verification · No password required
        </p>
      </div>
    </div>
  );
}
