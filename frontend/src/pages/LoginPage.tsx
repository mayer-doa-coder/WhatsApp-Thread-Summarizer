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

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ backgroundColor: '#0e1020' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-slate-400 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Server error alert */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-500/40 bg-red-900/25 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={[
                  'w-full rounded-lg border px-4 py-2.5 text-sm text-slate-100',
                  'bg-slate-800/70 placeholder-slate-500 outline-none transition',
                  'focus:ring-2 focus:ring-[#25D366]/60 disabled:opacity-50',
                  fieldErrors.email
                    ? 'border-red-500/70'
                    : 'border-slate-700 focus:border-[#25D366]/50',
                ].join(' ')}
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-7">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={[
                  'w-full rounded-lg border px-4 py-2.5 text-sm text-slate-100',
                  'bg-slate-800/70 placeholder-slate-500 outline-none transition',
                  'focus:ring-2 focus:ring-[#25D366]/60 disabled:opacity-50',
                  fieldErrors.password
                    ? 'border-red-500/70'
                    : 'border-slate-700 focus:border-[#25D366]/50',
                ].join(' ')}
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-slate-950
                         transition hover:bg-[#20bc59] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[#25D366] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
