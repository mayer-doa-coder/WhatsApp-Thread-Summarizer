import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { resetPassword } from '../services/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show an error page immediately if the token is missing from the URL
  if (!token) {
    return (
      <div className="page-shell flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4 fade-up">
          <p className="text-slate-400">This reset link is invalid or missing a token.</p>
          <Link to="/forgot-password" className="text-[var(--accent)] hover:underline font-medium text-sm">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  function validate(): boolean {
    const errs: { password?: string; confirm?: string } = {};
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (confirmPassword !== password) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
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
    'input-field placeholder-slate-600',
    hasError ? 'input-error' : '',
  ].join(' ');

  return (
    <div className="page-shell flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-up">

        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-bg)] mb-4">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {done ? 'Password updated' : 'Set a new password'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {done
              ? 'Your password has been changed successfully.'
              : 'Choose a strong password for your account.'}
          </p>
        </div>

        {done ? (
          /* Success state */
          <div className="surface-card rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-bg)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-slate-300">You can now log in with your new password.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary"
            >
              Go to log in
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            {error && (
              <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                {error}{' '}
                {error.includes('invalid') || error.includes('expired') ? (
                  <Link to="/forgot-password" className="underline">
                    Request a new link.
                  </Link>
                ) : null}
              </div>
            )}

            <div className="surface-card rounded-2xl p-6">
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-slate-500 mb-1.5">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                    disabled={loading}
                    className={inputCls(!!fieldErrors.password)}
                    placeholder="Minimum 8 characters"
                  />
                  {fieldErrors.password && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-500 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })); }}
                    disabled={loading}
                    className={inputCls(!!fieldErrors.confirm)}
                    placeholder="••••••••"
                  />
                  {fieldErrors.confirm && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.confirm}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary mt-2"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
