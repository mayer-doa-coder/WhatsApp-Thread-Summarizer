'use strict';

const supabase = require('../config/supabase');

/**
 * Insert a new summary row. Returns the created record.
 * @param {string} userId
 * @param {{ filename: string, type: string, summaryText: string, messageCount?: number, participants?: string[], dateFrom?: string, dateTo?: string }} summaryData
 */
async function saveSummary(userId, summaryData) {
  const { filename, type, summaryText, messageCount, participants, dateFrom, dateTo } = summaryData;

  const { data, error } = await supabase
    .from('summaries')
    .insert({
      user_id: userId,
      filename,
      type,
      summary_text: summaryText,
      message_count: messageCount ?? null,
      participants: participants ?? [],
      date_from: dateFrom ?? null,
      date_to: dateTo ?? null,
    })
    .select('id, user_id, filename, type, summary_text, message_count, participants, date_from, date_to, created_at')
    .single();

  if (error) throw new Error(`saveSummary failed: ${error.message}`);
  return data;
}

/**
 * Fetch all summaries for a user, newest first.
 * @param {string} userId
 */
async function getUserSummaries(userId) {
  const { data, error } = await supabase
    .from('summaries')
    .select('id, user_id, filename, type, summary_text, message_count, participants, date_from, date_to, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getUserSummaries failed: ${error.message}`);
  return data ?? [];
}

/**
 * Delete a summary only if it belongs to userId (prevents IDOR).
 * Returns true on success, throws if the row doesn't exist or belongs to another user.
 * @param {string} summaryId
 * @param {string} userId
 */
async function deleteSummary(summaryId, userId) {
  const { data, error } = await supabase
    .from('summaries')
    .delete()
    .eq('id', summaryId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw new Error(`deleteSummary failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error('Summary not found or does not belong to the requesting user.');
  }
  return true;
}

/**
 * Return the number of summaries saved by a user.
 * @param {string} userId
 */
async function getSummaryCount(userId) {
  const { count, error } = await supabase
    .from('summaries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error(`getSummaryCount failed: ${error.message}`);
  return count ?? 0;
}

module.exports = { saveSummary, getUserSummaries, deleteSummary, getSummaryCount };
