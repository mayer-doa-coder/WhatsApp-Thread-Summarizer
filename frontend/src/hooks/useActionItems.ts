import { useCallback, useEffect, useRef, useState } from 'react';

export type ActionStatus = 'pending' | 'active' | 'done';

export interface ActionState {
  text: string;
  status: ActionStatus;
}

export type DecisionState = { text: string; acknowledged: boolean };

const STATUS_CYCLE: ActionStatus[] = ['pending', 'active', 'done'];
const ACTION_PREFIX   = 'wts_actions_';
const DECISION_PREFIX = 'wts_decisions_';

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Action items (3-state + editable text) ────────────────────────────────────

export function useActionItems(storageKey: string, initialTexts: string[]) {
  const [items, setItems] = useState<ActionState[]>(() => {
    const stored = readStorage<ActionState[]>(ACTION_PREFIX + storageKey);
    if (stored && stored.length === initialTexts.length) return stored;
    return initialTexts.map((text) => ({ text, status: 'pending' as ActionStatus }));
  });

  const dirty = useRef(false);

  useEffect(() => {
    if (dirty.current) {
      writeStorage(ACTION_PREFIX + storageKey, items);
      dirty.current = false;
    }
  });

  const cycleStatus = useCallback((index: number) => {
    dirty.current = true;
    setItems((prev) => {
      const next = [...prev];
      const curr = STATUS_CYCLE.indexOf(next[index].status);
      next[index] = { ...next[index], status: STATUS_CYCLE[(curr + 1) % STATUS_CYCLE.length] };
      return next;
    });
  }, []);

  const updateText = useCallback((index: number, text: string) => {
    dirty.current = true;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text };
      return next;
    });
  }, []);

  return { items, cycleStatus, updateText };
}

// ── Key decisions (binary acknowledged toggle) ────────────────────────────────

export function useDecisionItems(storageKey: string, initialTexts: string[]) {
  const [items, setItems] = useState<DecisionState[]>(() => {
    const stored = readStorage<DecisionState[]>(DECISION_PREFIX + storageKey);
    if (stored && stored.length === initialTexts.length) return stored;
    return initialTexts.map((text) => ({ text, acknowledged: false }));
  });

  const dirty = useRef(false);

  useEffect(() => {
    if (dirty.current) {
      writeStorage(DECISION_PREFIX + storageKey, items);
      dirty.current = false;
    }
  });

  const toggle = useCallback((index: number) => {
    dirty.current = true;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], acknowledged: !next[index].acknowledged };
      return next;
    });
  }, []);

  return { items, toggle };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive a stable storage key from a topic string (no crypto needed). */
export function topicKey(topic: string): string {
  return encodeURIComponent(topic.slice(0, 60)).replace(/%/g, '_');
}

/** Persist full SummaryData for a saved history entry. */
export function persistHistoryDetail(id: string, data: unknown): void {
  writeStorage(`wts_hist_data_${id}`, data);
}

/** Load persisted SummaryData for a history entry, or null. */
export function loadHistoryDetail<T>(id: string): T | null {
  return readStorage<T>(`wts_hist_data_${id}`);
}
