import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { isAxiosError } from 'axios';

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { initiateRegister } = useAuth();
  const reduced = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setError(null);
    try {
      const confirmedEmail = await initiateRegister(email.trim(), password);
      navigate(`/verify-otp?email=${encodeURIComponent(confirmedEmail)}`);
    } catch (err) {
      const msg = isAxiosError(err)
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
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={PAGE_SPRING}
      className="page-shell flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="section-kicker">Create account</p>
          <h1 className="mt-2 text-2xl font-semibold text-gradient">Start your AI workspace</h1>
          <p className="mt-1.5 text-sm text-slate-400">Save, revisit, and export your briefings</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="surface-card rounded-2xl p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <input id="email" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading}
                className={inputCls(!!fieldErrors.email)} placeholder="you@example.com" />
              {fieldErrors.email && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input id="password" type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={loading}
                className={inputCls(!!fieldErrors.password)} placeholder="Minimum 8 characters" />
              {fieldErrors.password && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-400 mb-1.5">Confirm password</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading}
                className={inputCls(!!fieldErrors.confirmPassword)} placeholder="••••••••" />
              {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={reduced ? {} : { scale: 0.97 }}
              transition={PAGE_SPRING}
              className="w-full btn-primary mt-2"
            >
              {loading ? 'Sending code…' : 'Create account'}
            </motion.button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent)] hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </motion.div>
  );
}
