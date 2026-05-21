import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateProfile, getHistory } from '../services/api';

const FREE_LIMIT = 10;
const PAGE_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const;

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const reduced = useReducedMotion();

  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [summaryCount, setSummaryCount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  useEffect(() => {
    if (user?.plan === 'free' || user?.plan === undefined) {
      getHistory()
        .then((items) => setSummaryCount(items.length))
        .catch(() => setSummaryCount(null));
    }
  }, [user?.plan]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile({ displayName: displayName.trim() });
      await refreshProfile();
      showSuccess('Display name updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update name.';
      showError(msg);
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      showSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  }

  const isPro = user?.plan === 'pro';
  const usagePercent = summaryCount !== null ? Math.min((summaryCount / FREE_LIMIT) * 100, 100) : 0;

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={PAGE_SPRING}
      className="page-shell px-4 py-10 sm:px-6"
    >
      <div className="mx-auto max-w-2xl space-y-8">

        <div>
          <p className="section-kicker">Account</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-100">Your Profile</h1>
        </div>

        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Account Info</h2>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Email</p>
              <p className="text-sm font-medium text-slate-200">{user?.email}</p>
            </div>

            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                isPro
                  ? 'bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30'
                  : 'bg-slate-700/50 text-slate-300 border border-white/10',
              ].join(' ')}
            >
              {isPro ? (
                <>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Pro Plan
                </>
              ) : 'Free Plan'}
            </span>
          </div>

          {!isPro && summaryCount !== null && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-slate-500">Summaries saved</p>
                <p className="text-xs font-medium text-slate-300">
                  {summaryCount} / {FREE_LIMIT}
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-500',
                    summaryCount >= FREE_LIMIT ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]',
                  ].join(' ')}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {summaryCount >= FREE_LIMIT && (
                <p className="mt-2 text-xs text-[var(--danger)]">
                  You've reached the free plan limit. Contact us to upgrade to Pro.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Display Name</h2>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label htmlFor="display-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                Name shown in your account
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="input-field"
              />
            </div>
            <motion.button
              type="submit"
              disabled={savingName || !displayName.trim()}
              whileTap={reduced ? {} : { scale: 0.97 }}
              transition={PAGE_SPRING}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingName ? 'Saving…' : 'Save Name'}
            </motion.button>
          </form>
        </div>

        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Change Password</h2>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="input-field"
              />
            </div>

            {passwordError && (
              <div role="alert" className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                {passwordError}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              whileTap={reduced ? {} : { scale: 0.97 }}
              transition={PAGE_SPRING}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingPassword ? 'Updating…' : 'Update Password'}
            </motion.button>
          </form>
        </div>

      </div>
    </motion.div>
  );
}
