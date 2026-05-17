import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(email.trim(), password);
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
          <h1 className="text-2xl font-bold text-slate-100">Create an account</h1>
          <p className="mt-1.5 text-sm text-slate-500">Save and revisit your summaries</p>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={inputCls(!!fieldErrors.password)}
                placeholder="Minimum 8 characters"
              />
              {fieldErrors.password && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-500 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className={inputCls(!!fieldErrors.confirmPassword)}
                placeholder="••••••••"
              />
              {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[#20bc59] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#25D366] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
