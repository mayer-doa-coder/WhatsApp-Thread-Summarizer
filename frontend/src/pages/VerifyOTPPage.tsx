import React, { useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { verifyOtp, resendOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DIGITS = 6;

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { completeVerification } = useAuth();

  // Prefer URL query param so the email survives page refreshes
  const email: string =
    searchParams.get('email') ??
    (location.state as { email?: string } | null)?.email ??
    '';

  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < DIGITS - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIndex = Math.min(pasted.length, DIGITS - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < DIGITS) {
      setError('Enter all 6 digits of the code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await verifyOtp(email, otp);
      if (data.token) {
        completeVerification(data.token);
        navigate('/');
      } else {
        navigate('/login', { state: { verified: true } });
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await resendOtp(email);
      setSuccess(data.message);
      setDigits(Array(DIGITS).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : 'Failed to resend code.';
      setError(msg);
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="page-shell flex items-center justify-center px-4">
        <div className="text-center fade-up">
          <p className="text-slate-400 mb-4">No email address found. Please sign up first.</p>
          <Link to="/register" className="text-[var(--accent)] hover:underline font-medium text-sm">
            Go to Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const digitInputCls = (hasValue: boolean) => [
    'w-11 h-14 rounded-xl border text-center text-xl font-bold text-slate-100 bg-white/[0.03] outline-none transition',
    'focus:ring-1 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40',
    hasValue ? 'border-[var(--accent)]/50 shadow-[0_0_16px_rgba(46,232,156,0.2)]' : 'border-white/[0.08]',
  ].join(' ');

  return (
    <div className="page-shell flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-bg)] mb-4">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Check your email</h1>
          <p className="mt-2 text-sm text-slate-400">
            We sent a 6-digit code to{' '}
            <span className="text-slate-300 font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="mb-5 rounded-lg border border-[var(--accent)]/30 bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--accent)]">
            {success}
          </div>
        )}

        <div className="surface-card rounded-2xl p-6">
          <form onSubmit={handleVerify} noValidate>
            <label className="block text-xs font-medium text-slate-400 mb-4 text-center uppercase tracking-wider">
              Verification code
            </label>

            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className={digitInputCls(!!d)}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || digits.join('').length < DIGITS}
              className="w-full btn-primary"
            >
              {loading ? 'Verifying…' : 'Verify email'}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center space-y-2">
          <p className="text-sm text-slate-400">
            Didn't receive a code?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-[var(--accent)] hover:underline font-medium disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </p>
          <p className="text-sm text-slate-500">
            <Link to="/register" className="hover:text-slate-500 transition-colors">
              ← Back to sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
