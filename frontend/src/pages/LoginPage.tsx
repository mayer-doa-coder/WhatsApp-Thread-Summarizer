import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const justVerified = !!(location.state as { verified?: boolean })?.verified;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password cannot be empty.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password, rememberMe);
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.unverified && data?.email) {
          navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setError(data?.message ?? err.message);
      } else {
        setError('An unexpected error occurred.');
      }
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
        <div className="text-center mb-8">
          <p className="section-kicker">Welcome back</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Sign in to your workspace</h1>
          <p className="mt-1.5 text-sm text-slate-400">Access saved briefs and summaries</p>
        </div>

        {justVerified && (
          <div role="status" className="mb-5 rounded-lg border border-[var(--accent)]/30 bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--accent)]">
            Email verified! You can now log in.
          </div>
        )}

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
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={inputCls(!!fieldErrors.email)}
                placeholder="you@example.com"
              />
              {fieldErrors.email && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--accent)] hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={inputCls(!!fieldErrors.password)}
                placeholder="••••••••"
              />
              {fieldErrors.password && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 select-none">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className={[
                  'w-4 h-4 rounded border transition',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]/40',
                  rememberMe
                    ? 'bg-[var(--accent)] border-[var(--accent)]'
                    : 'bg-white/[0.03] border-white/[0.15]',
                ].join(' ')} />
                {rememberMe && (
                  <svg
                    className="absolute inset-0 w-4 h-4 text-slate-950 pointer-events-none"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <polyline points="3,8 6.5,11.5 13,4.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-400 cursor-pointer">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-2"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--accent)] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
