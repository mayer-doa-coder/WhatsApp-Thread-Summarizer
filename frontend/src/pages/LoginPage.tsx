import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    const result = await login(email.trim(), password);
    if (result) navigate('/');
  }

  const inputCls = (hasError: boolean) => [
    'w-full rounded-lg border bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100',
    'placeholder-slate-600 outline-none transition',
    'focus:ring-1 focus:ring-[#25D366]/40 focus:border-[#25D366]/40',
    hasError ? 'border-red-500/50' : 'border-white/[0.08]',
  ].join(' ');

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-[#0e1020]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to access your history</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-500 mb-1.5">
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
              <label htmlFor="password" className="block text-xs font-medium text-slate-500 mb-1.5">
                Password
              </label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[#20bc59] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#25D366] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
