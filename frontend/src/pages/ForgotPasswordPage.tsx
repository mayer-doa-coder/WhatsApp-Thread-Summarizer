import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { forgotPassword } from '../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (hasError: boolean) => [
    'input-field placeholder-slate-500',
    hasError ? 'input-error' : '',
  ].join(' ');

  return (
    <div className="page-shell flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-up">

        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-bg)] mb-4">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Forgot password?</h1>
          <p className="mt-2 text-sm text-slate-400">
            {submitted
              ? 'Check your inbox for a reset link.'
              : "Enter your account email and we'll send you a reset link."}
          </p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="surface-card rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-bg)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-slate-300">
              If <span className="font-medium text-slate-100">{email}</span> is registered, you'll receive a
              password reset link shortly. Check your spam folder if it doesn't arrive within a few minutes.
            </p>
            <Link
              to="/login"
              className="inline-block w-full btn-primary mt-2"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            {error && (
              <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="surface-card rounded-2xl p-6">
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                    disabled={loading}
                    className={inputCls(!!emailError)}
                    placeholder="you@example.com"
                  />
                  {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary mt-2"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </div>

            <p className="mt-5 text-center text-sm text-slate-400">
              Remember it?{' '}
              <Link to="/login" className="text-[var(--accent)] hover:underline font-medium">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
