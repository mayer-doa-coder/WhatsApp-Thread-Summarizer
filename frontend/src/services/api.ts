import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:4000';

const client = axios.create({ baseURL: `${BASE_URL}/api` });

/** Call once after login/logout to attach or clear the JWT on all requests. */
export function setAuthToken(token: string | null): void {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
  }
}

// ── Shared primitives ─────────────────────────────────────────────────────────

export type SummaryType = 'short' | 'medium' | 'detailed' | 'bullets';
export type MessageType = 'text' | 'media' | 'system' | 'deleted';
export type Tone =
  | 'formal'
  | 'casual'
  | 'concise'
  | 'empathetic'
  | 'apologetic'
  | 'assertive';
export type FocusOn = string;
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface Message {
  timestamp: string;
  sender: string | null;
  content: string;
  type: MessageType;
  date?: string;
  time?: string;
}

export interface DateRange {
  from: string;
  to: string;
}

// ── /api/upload ───────────────────────────────────────────────────────────────

export interface TypeCounts {
  text: number;
  media: number;
  system: number;
  deleted: number;
}

export interface ParsedFile {
  filename: string;
  sizeBytes: number;
  encoding: string;
  messageCount: number;
  truncated: boolean;
  parseWarnings: string[];
  participants: string[];
  dateRange: DateRange;
  typeCounts: TypeCounts;
  messages: Message[];
}

export interface UploadResponse {
  files: ParsedFile[];
}

// ── /api/summarize ────────────────────────────────────────────────────────────

export interface SummaryResult {
  topic: string;
  participants: string[];
  dateRange: DateRange;
  messageCount: number;
  keyDecisions: string[];
  actionItems: string[];
  notableFacts: string[];
  summaryText: string;
  sentiment?: Sentiment;
  dominantTopics?: string[];
}

export interface SummarizeRequest {
  messages: Message[];
  summaryType?: SummaryType;
  filename?: string;
  focusOn?: FocusOn;
  language?: string;
  participants?: string[];
  maxMessages?: number;
  includeQuotes?: boolean;
}

export interface SummarizeResponse {
  summary: SummaryResult;
  model: string;
  processingMs: number;
  inputMessages: number;
  truncated: boolean;
}

// ── /api/reply ────────────────────────────────────────────────────────────────

export interface DraftRequest {
  messages: Message[];
  tone?: Tone;
  tones?: Tone[];
  userIntent?: string;
  count?: number;
  maxWordsPerReply?: number;
  language?: string;
  includeEmoji?: boolean;
}

export interface DraftResponse {
  options: string[];
  model: string;
  processingMs: number;
}

// ── /api/brief ────────────────────────────────────────────────────────────────

export interface BriefRequest {
  files: File[];
  summaryType?: SummaryType;
  prioritize?: string;
  focusOn?: Omit<FocusOn, 'sentiment'>;
  language?: string;
  maxMessagesPerFile?: number;
  crossChatInsights?: boolean;
}

export interface BriefChatCard {
  index?: number;
  oneLiner?: string;
  actionRequired?: boolean;
  filename: string;
  topic: string;
  participants: string[];
  messageCount: number;
  dateRange: DateRange;
  actionItems: string[];
  keyDecisions: string[];
  notableFacts?: string[];
  sentiment?: string;
  summaryText: string;
}

export interface BriefResult {
  generatedAt: string;
  overviewParagraph: string;
  chatCards: BriefChatCard[];
  crossChatInsights: string[];
  keyPeople: string[];
  totalActionItems: string[];
  filesProcessed: number;
  filesExcluded: number;
}

export interface BriefResponse {
  brief: BriefResult;
  model: string;
  processingMs: number;
}

// ── /api/history ──────────────────────────────────────────────────────────────

export interface HistoryResponse {
  id: string;
  filename: string;
  type: 'thread' | 'brief';
  summaryText: string;
  messageCount: number | null;
  createdAt: string;
}

interface HistoryListEnvelope {
  summaries: HistoryResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Upload a .txt WhatsApp export, parse it on the backend, then summarize.
 * Uses FormData for the upload step as required by /api/upload.
 */
export async function uploadAndSummarize(
  file: File,
  summaryType: SummaryType = 'medium',
  focusOn?: string,
): Promise<SummarizeResponse> {
  const form = new FormData();
  form.append('files', file);

  const { data: uploadData } = await client.post<UploadResponse>('/upload', form);
  const messages: Message[] = uploadData.files[0]?.messages ?? [];

  const body: SummarizeRequest = {
    messages,
    summaryType,
    filename: file.name,
    ...(focusOn ? { focusOn: focusOn as FocusOn } : {}),
  };
  const { data } = await client.post<SummarizeResponse>('/summarize', body);
  return data;
}

export async function draftReply(payload: DraftRequest): Promise<DraftResponse> {
  const { data } = await client.post<DraftResponse>('/reply', payload);
  return data;
}

export async function generateBrief(payload: BriefRequest): Promise<BriefResponse> {
  const form = new FormData();
  payload.files.forEach((f) => form.append('files[]', f));
  if (payload.summaryType !== undefined) form.append('summaryType', payload.summaryType);
  if (payload.prioritize !== undefined) form.append('prioritize', payload.prioritize);
  if (payload.focusOn !== undefined) form.append('focusOn', String(payload.focusOn));
  if (payload.language !== undefined) form.append('language', payload.language);
  if (payload.maxMessagesPerFile !== undefined)
    form.append('maxMessagesPerFile', String(payload.maxMessagesPerFile));
  if (payload.crossChatInsights !== undefined)
    form.append('crossChatInsights', String(payload.crossChatInsights));

  const { data } = await client.post<BriefResponse>('/brief', form);
  return data;
}

export async function getHistory(): Promise<HistoryResponse[]> {
  const { data } = await client.get<HistoryListEnvelope>('/history');
  return data.summaries;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await client.delete(`/history/${id}`);
}

// ── /api/auth ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

export interface ProfileData {
  id: string;
  email: string;
  displayName: string | null;
  plan: 'free' | 'pro';
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function registerUser(email: string, password: string): Promise<RegisterResponse> {
  const { data } = await client.post<RegisterResponse>('/auth/register', { email, password });
  return data;
}

export interface VerifyOtpResponse {
  message: string;
  token?: string;
  user?: AuthUser;
}

export async function verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  const { data } = await client.post<VerifyOtpResponse>('/auth/verify-otp', { email, otp });
  return data;
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  const { data } = await client.post<{ message: string }>('/auth/resend-otp', { email });
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await client.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const { data } = await client.post<{ message: string }>('/auth/reset-password', { token, password });
  return data;
}

export async function getProfile(): Promise<ProfileData> {
  const { data } = await client.get<ProfileData>('/auth/me');
  return data;
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<{ message: string }> {
  const { data } = await client.patch<{ message: string }>('/auth/profile', payload);
  return data;
}

export async function saveToHistory(payload: {
  filename: string;
  type: 'thread' | 'brief';
  summaryText: string;
  messageCount?: number;
  participants?: string[];
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ summary: HistoryResponse }> {
  const { data } = await client.post<{ summary: HistoryResponse }>('/history', payload);
  return data;
}
