import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface NavBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const MENU_SPRING = { type: 'spring', stiffness: 340, damping: 32 } as const;

export default function NavBar({ theme, onToggleTheme }: NavBarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();

  function handleLogout() {
    logout();
    navigate('/');
    setMenuOpen(false);
  }

  function isActive(path: string) {
    return location.pathname === path;
  }

  const linkCls = (path: string) =>
    `text-sm font-semibold tracking-wide transition-colors relative ${
      isActive(path)
        ? 'text-[var(--accent)] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[var(--accent)]'
        : 'text-slate-400 hover:text-slate-100'
    }`;

  const nextThemeLabel = theme === 'dark' ? 'Light' : 'Dark';
  const toggleLabel = `Switch to ${nextThemeLabel} mode`;

  return (
    <nav className="sticky top-0 z-30 glass-nav">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="logo-glow flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] shadow-[0_8px_24px_rgba(56,189,248,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_12px_32px_rgba(56,189,248,0.55)]">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.054 23.25a.75.75 0 0 0 .918.919l5.442-1.485A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.717 9.717 0 0 1-4.97-1.362l-.356-.213-3.69 1.006 1.003-3.618-.233-.373A9.715 9.715 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
            </span>
            <span className="font-display font-semibold text-slate-100 text-sm tracking-tight transition-colors group-hover:text-[var(--accent)]">
              Thread Summarizer
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link to="/" className={linkCls('/')}>Summarize</Link>
            <Link to="/daily-brief" className={linkCls('/daily-brief')}>Daily Brief</Link>
            {user && <Link to="/history" className={linkCls('/history')}>History</Link>}
            {user && <Link to="/profile" className={linkCls('/profile')}>Profile</Link>}
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-3">
            <motion.button
              type="button"
              onClick={onToggleTheme}
              whileTap={reduced ? {} : { scale: 0.9, rotate: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="btn-ghost"
              aria-label={toggleLabel}
              title={toggleLabel}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {theme === 'dark' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5V3m0 18v-1.5m8.5-7.5H21m-18 0H4.5m12.02-5.02 1.06-1.06M6.42 17.58l-1.06 1.06m0-12.12 1.06 1.06m10.1 10.1 1.06 1.06M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
                  )}
                </svg>
                <span className="text-xs font-semibold tracking-wide">{nextThemeLabel}</span>
              </span>
            </motion.button>
            {user ? (
              <>
                <span className="text-xs text-slate-500 truncate max-w-[160px]">{user.email}</span>
                <motion.button
                  onClick={handleLogout}
                  whileTap={reduced ? {} : { scale: 0.94 }}
                  transition={MENU_SPRING}
                  className="btn-ghost"
                >
                  Log out
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
                  Log in
                </Link>
                <motion.div whileTap={reduced ? {} : { scale: 0.95 }} transition={MENU_SPRING}>
                  <Link to="/register" className="btn-primary-nav">
                    Sign up
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <motion.button
            className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            whileTap={reduced ? {} : { scale: 0.88 }}
            transition={MENU_SPRING}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </motion.button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={MENU_SPRING}
              className="sm:hidden overflow-hidden border-t border-white/[0.08]"
            >
              <div className="py-3 space-y-1 pb-4">
                <Link to="/" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">Summarize</Link>
                <Link to="/daily-brief" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">Daily Brief</Link>
                {user && <Link to="/history" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">History</Link>}
                {user && <Link to="/profile" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">Profile</Link>}
                <div className="pt-2 border-t border-white/[0.08] mt-2">
                  <button
                    type="button"
                    onClick={() => { onToggleTheme(); setMenuOpen(false); }}
                    className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]"
                  >
                    {toggleLabel}
                  </button>
                  {user ? (
                    <button onClick={handleLogout} className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/[0.06]">Log out</button>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">Log in</Link>
                      <Link to="/register" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-white/[0.06]">Sign up</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
