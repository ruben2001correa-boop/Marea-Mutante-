import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const DONATIONS_FILE = path.join(DATA_DIR, 'donations.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const PAYMENT_INTENTS_FILE = path.join(DATA_DIR, 'payment_intents.json');

const BRE_B_KEY = '@3155552964';
const NEQUI_NUMBER = '3155552964';
const NEQUI_CARD_NUMBER = '4525160122517220';
const NEQUI_CARD_MASKED = '4525 16•• •••• 7220';
const CREATOR_NAME = 'Rubén Darío Correa Cuellar';
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

interface DonationRecord {
  id: string;
  donorName: string;
  amountCop: number;
  channel: string;
  reference: string;
  message: string;
  purpose?: 'donation' | 'extra_life';
  verificationStatus?: 'verified_reference' | 'verified_gateway';
  cardLast4?: string;
  createdAt: number;
}

interface StoredPlayerRecord {
  id: string;
  name: string;
  country: string;
  maxScore: number;
  currentScore: number;
  dayCount: number;
  level: number;
  bounty: number;
  clanTag: string;
  titleName?: string;
  shipClass?: string;
  kills?: number;
  islandsVisited?: number;
  donorUnlocked?: boolean;
  achievementsCount?: number;
  titlesCount?: number;
  unlockedAchievementsPreview?: string[];
  flameTier?: number;
  lastSeen: number;
}

interface AccountRecord {
  id: string;
  username: string;
  usernameLower: string;
  passwordSalt: string;
  passwordHash: string;
  playerProfileId: string;
  captainName: string;
  country: string;
  avatarColor: string;
  motto: string;
  bio: string;
  cloudSave: Record<string, unknown> | null;
  cloudSavedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface SessionRecord {
  token: string;
  accountId: string;
  createdAt: number;
  expiresAt: number;
}

interface PaymentIntentRecord {
  id: string;
  code: string;
  playerProfileId?: string;
  donorName: string;
  amountCop: number;
  purpose: 'donation' | 'extra_life';
  method: string;
  status: 'pending' | 'awaiting_review' | 'verified' | 'rejected';
  reference?: string;
  cardLast4?: string;
  receiptNote?: string;
  message?: string;
  verifiedBy?: 'wompi_gateway' | 'wompi_webhook' | 'creator_pin';
  rewardGranted?: boolean;
  claimedByClient?: boolean;
  rejectReason?: string;
  createdAt: number;
  expiresAt: number;
  verifiedAt?: number;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonArray<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(filePath: string, data: T[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error guardando ${path.basename(filePath)}:`, err);
  }
}

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isValidLuhn(digitsOnly: string): boolean {
  if (!/^\d{12,19}$/.test(digitsOnly)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let n = parseInt(digitsOnly[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function computeFlameTier(entry: {
  achievementsCount?: number;
  maxScore?: number;
  donorUnlocked?: boolean;
}): number {
  const ach = Number(entry.achievementsCount || 0);
  const score = Number(entry.maxScore || 0);
  const bonus = entry.donorUnlocked ? 1 : 0;
  let tier = 0;
  if (ach >= 9 || score >= 100000) tier = 3;
  else if (ach >= 6 || score >= 45000) tier = 2;
  else if (ach >= 3 || score >= 15000) tier = 1;
  return Math.min(3, tier + (tier < 3 && bonus > 0 && ach >= 2 ? 1 : 0));
}

function sanitizeAccount(acc: AccountRecord) {
  return {
    id: acc.id,
    username: acc.username,
    playerProfileId: acc.playerProfileId,
    captainName: acc.captainName,
    country: acc.country,
    avatarColor: acc.avatarColor,
    motto: acc.motto,
    bio: acc.bio,
    hasCloudSave: Boolean(acc.cloudSave),
    cloudSavedAt: acc.cloudSavedAt,
    createdAt: acc.createdAt,
  };
}

let leaderboardRecords: StoredPlayerRecord[] = readJsonArray<StoredPlayerRecord>(LEADERBOARD_FILE);
let donationRecords: DonationRecord[] = readJsonArray<DonationRecord>(DONATIONS_FILE);
let accountRecords: AccountRecord[] = readJsonArray<AccountRecord>(ACCOUNTS_FILE);
let sessionRecords: SessionRecord[] = readJsonArray<SessionRecord>(SESSIONS_FILE);
let paymentIntentRecords: PaymentIntentRecord[] =
  readJsonArray<PaymentIntentRecord>(PAYMENT_INTENTS_FILE);

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const tok = auth.slice(7).trim();
  return tok || null;
}

function getAuthenticatedAccount(req: Request): AccountRecord | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  const now = Date.now();
  const sess = sessionRecords.find((s) => s.token === token && s.expiresAt > now);
  if (!sess) return null;
  return accountRecords.find((a) => a.id === sess.accountId) || null;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, serverTime: Date.now() });
  });

  // =========================================================================
  // USER ACCOUNTS & CLOUD SAVE SYNC (with mandatory Account Deletion)
  // =========================================================================

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const body = req.body || {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const captainName =
      typeof body.captainName === 'string' && body.captainName.trim()
        ? body.captainName.trim().slice(0, 24)
        : username.slice(0, 24) || 'Capitán Náufrago';
    const country =
      typeof body.country === 'string' && body.country.trim()
        ? body.country.trim().toUpperCase().slice(0, 8)
        : 'CO';
    const requestedProfileId =
      typeof body.playerProfileId === 'string' && body.playerProfileId.trim()
        ? body.playerProfileId.trim().slice(0, 24)
        : '';

    if (username.length < 3 || username.length > 24 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      res.status(400).json({
        error: 'El usuario debe tener entre 3 y 24 caracteres (letras, números, _ . -).',
      });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const lower = username.toLowerCase();
    if (accountRecords.some((a) => a.usernameLower === lower)) {
      res.status(409).json({ error: 'Ese nombre de usuario ya está registrado.' });
      return;
    }

    const { salt, hash } = hashPassword(password);
    const now = Date.now();
    const account: AccountRecord = {
      id: `acc_${crypto.randomBytes(6).toString('hex')}`,
      username,
      usernameLower: lower,
      passwordSalt: salt,
      passwordHash: hash,
      playerProfileId:
        requestedProfileId || `MM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      captainName,
      country,
      avatarColor: '#38bdf8',
      motto: 'Sobreviviente de las Cenizas Saladas',
      bio: '',
      cloudSave:
        body.initialSave && typeof body.initialSave === 'object'
          ? (body.initialSave as Record<string, unknown>)
          : null,
      cloudSavedAt: body.initialSave ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    accountRecords.push(account);
    writeJsonArray(ACCOUNTS_FILE, accountRecords);

    const token = crypto.randomBytes(24).toString('hex');
    sessionRecords.push({
      token,
      accountId: account.id,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
    writeJsonArray(SESSIONS_FILE, sessionRecords);

    res.status(201).json({
      token,
      account: sanitizeAccount(account),
      cloudSave: account.cloudSave,
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const body = req.body || {};
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const account = accountRecords.find((a) => a.usernameLower === username);
    if (!account || !verifyPassword(password, account.passwordSalt, account.passwordHash)) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      return;
    }

    const now = Date.now();
    sessionRecords = sessionRecords.filter((s) => s.expiresAt > now);
    const token = crypto.randomBytes(24).toString('hex');
    sessionRecords.push({
      token,
      accountId: account.id,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
    writeJsonArray(SESSIONS_FILE, sessionRecords);

    res.json({
      token,
      account: sanitizeAccount(account),
      cloudSave: account.cloudSave,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    if (token) {
      sessionRecords = sessionRecords.filter((s) => s.token !== token);
      writeJsonArray(SESSIONS_FILE, sessionRecords);
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const account = getAuthenticatedAccount(req);
    if (!account) {
      res.status(401).json({ error: 'Sesión no válida o expirada.' });
      return;
    }
    const includeSave = req.query.includeSave === '1';
    res.json({
      account: sanitizeAccount(account),
      cloudSave: includeSave ? account.cloudSave : undefined,
    });
  });

  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const account = getAuthenticatedAccount(req);
    if (!account) {
      res.status(401).json({ error: 'Inicia sesión primero.' });
      return;
    }
    const body = req.body || {};
    if (typeof body.captainName === 'string' && body.captainName.trim()) {
      account.captainName = body.captainName.trim().slice(0, 24);
    }
    if (typeof body.country === 'string' && body.country.trim()) {
      account.country = body.country.trim().toUpperCase().slice(0, 8);
    }
    if (typeof body.avatarColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.avatarColor)) {
      account.avatarColor = body.avatarColor;
    }
    if (typeof body.motto === 'string') {
      account.motto = body.motto.trim().slice(0, 80);
    }
    if (typeof body.bio === 'string') {
      account.bio = body.bio.trim().slice(0, 200);
    }
    account.updatedAt = Date.now();
    writeJsonArray(ACCOUNTS_FILE, accountRecords);
    res.json({ account: sanitizeAccount(account) });
  });

  app.post('/api/auth/save-cloud', (req: Request, res: Response) => {
    const account = getAuthenticatedAccount(req);
    if (!account) {
      res.status(401).json({ error: 'Inicia sesión para guardar en la nube.' });
      return;
    }
    const savePayload = req.body?.saveData;
    if (!savePayload || typeof savePayload !== 'object') {
      res.status(400).json({ error: 'Datos de partida inválidos.' });
      return;
    }
    account.cloudSave = savePayload as Record<string, unknown>;
    account.cloudSavedAt = Date.now();
    account.updatedAt = account.cloudSavedAt;
    writeJsonArray(ACCOUNTS_FILE, accountRecords);
    res.json({ ok: true, cloudSavedAt: account.cloudSavedAt, account: sanitizeAccount(account) });
  });

  app.get('/api/auth/load-cloud', (req: Request, res: Response) => {
    const account = getAuthenticatedAccount(req);
    if (!account) {
      res.status(401).json({ error: 'Inicia sesión para cargar tu partida en la nube.' });
      return;
    }
    if (!account.cloudSave) {
      res.status(404).json({ error: 'Aún no tienes una partida guardada en la nube.' });
      return;
    }
    res.json({
      ok: true,
      cloudSavedAt: account.cloudSavedAt,
      saveData: account.cloudSave,
    });
  });

  app.delete('/api/auth/account', (req: Request, res: Response) => {
    const account = getAuthenticatedAccount(req);
    if (!account) {
      res.status(401).json({ error: 'Inicia sesión para eliminar tu cuenta.' });
      return;
    }

    const accId = account.id;
    const profId = account.playerProfileId;
    accountRecords = accountRecords.filter((a) => a.id !== accId);
    sessionRecords = sessionRecords.filter((s) => s.accountId !== accId);
    leaderboardRecords = leaderboardRecords.filter((r) => r.id !== profId);

    writeJsonArray(ACCOUNTS_FILE, accountRecords);
    writeJsonArray(SESSIONS_FILE, sessionRecords);
    writeJsonArray(LEADERBOARD_FILE, leaderboardRecords);

    res.json({ ok: true, deletedAccountId: accId });
  });

  // =========================================================================
  // WORLD LEADERBOARD (with Achievements, Titles & Animated Flame Tiers)
  // =========================================================================

  app.get('/api/leaderboard', (_req, res) => {
    const now = Date.now();
    const enriched = leaderboardRecords
      .map((entry) => ({
        ...entry,
        achievementsCount: entry.achievementsCount ?? 0,
        titlesCount: entry.titlesCount ?? 1,
        unlockedAchievementsPreview: Array.isArray(entry.unlockedAchievementsPreview)
          ? entry.unlockedAchievementsPreview.slice(0, 6)
          : [],
        flameTier: computeFlameTier(entry),
        activeNow: now - entry.lastSeen <= ACTIVE_WINDOW_MS,
      }))
      .sort((a, b) => {
        if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
        return b.lastSeen - a.lastSeen;
      })
      .slice(0, 100);

    res.json({ players: enriched, serverTime: now });
  });

  app.post('/api/leaderboard/sync', (req, res) => {
    const body = req.body || {};
    const id = typeof body.id === 'string' ? body.id.trim().slice(0, 24) : '';
    if (!id) {
      res.status(400).json({ error: 'ID de jugador requerido' });
      return;
    }

    const now = Date.now();
    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim().slice(0, 24)
        : 'Capitán Náufrago';
    const country =
      typeof body.country === 'string' && body.country.trim()
        ? body.country.trim().slice(0, 8)
        : 'CO';
    const incomingMax = Math.max(0, Math.round(Number(body.maxScore) || 0));
    const currentScore = Math.max(0, Math.round(Number(body.currentScore) || 0));
    const dayCount = Math.max(1, Math.round(Number(body.dayCount) || 1));
    const level = Math.max(1, Math.round(Number(body.level) || 1));
    const bounty = Math.max(0, Math.round(Number(body.bounty) || 0));
    const clanTag =
      typeof body.clanTag === 'string' ? body.clanTag.trim().toUpperCase().slice(0, 6) : '';
    const titleName =
      typeof body.titleName === 'string' && body.titleName.trim()
        ? body.titleName.trim().slice(0, 42)
        : 'Náufrago';
    const shipClass =
      typeof body.shipClass === 'string' && body.shipClass.trim()
        ? body.shipClass.trim().slice(0, 32)
        : 'Balsa';
    const kills = Math.max(0, Math.round(Number(body.kills) || 0));
    const islandsVisited = Math.max(0, Math.round(Number(body.islandsVisited) || 0));
    const donorUnlocked = Boolean(body.donorUnlocked);
    const achievementsCount = Math.max(0, Math.round(Number(body.achievementsCount) || 0));
    const titlesCount = Math.max(1, Math.round(Number(body.titlesCount) || 1));
    const unlockedAchievementsPreview = Array.isArray(body.unlockedAchievementsPreview)
      ? body.unlockedAchievementsPreview
          .filter((x: unknown): x is string => typeof x === 'string')
          .slice(0, 6)
      : [];

    const idx = leaderboardRecords.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const prev = leaderboardRecords[idx];
      const maxScore = Math.max(prev.maxScore, incomingMax, currentScore);
      const maxAch = Math.max(prev.achievementsCount || 0, achievementsCount);
      const maxDonor = Boolean(prev.donorUnlocked || donorUnlocked);
      leaderboardRecords[idx] = {
        id,
        name,
        country,
        maxScore,
        currentScore,
        dayCount,
        level,
        bounty,
        clanTag,
        titleName,
        shipClass,
        kills: Math.max(prev.kills || 0, kills),
        islandsVisited: Math.max(prev.islandsVisited || 0, islandsVisited),
        donorUnlocked: maxDonor,
        achievementsCount: maxAch,
        titlesCount: Math.max(prev.titlesCount || 1, titlesCount),
        unlockedAchievementsPreview:
          unlockedAchievementsPreview.length > 0
            ? unlockedAchievementsPreview
            : prev.unlockedAchievementsPreview || [],
        flameTier: computeFlameTier({
          achievementsCount: maxAch,
          maxScore,
          donorUnlocked: maxDonor,
        }),
        lastSeen: now,
      };
    } else {
      const maxScore = Math.max(incomingMax, currentScore);
      leaderboardRecords.push({
        id,
        name,
        country,
        maxScore,
        currentScore,
        dayCount,
        level,
        bounty,
        clanTag,
        titleName,
        shipClass,
        kills,
        islandsVisited,
        donorUnlocked,
        achievementsCount,
        titlesCount,
        unlockedAchievementsPreview,
        flameTier: computeFlameTier({
          achievementsCount,
          maxScore,
          donorUnlocked,
        }),
        lastSeen: now,
      });
    }

    writeJsonArray(LEADERBOARD_FILE, leaderboardRecords);

    const enriched = leaderboardRecords
      .map((entry) => ({
        ...entry,
        achievementsCount: entry.achievementsCount ?? 0,
        titlesCount: entry.titlesCount ?? 1,
        unlockedAchievementsPreview: Array.isArray(entry.unlockedAchievementsPreview)
          ? entry.unlockedAchievementsPreview.slice(0, 6)
          : [],
        flameTier: computeFlameTier(entry),
        activeNow: now - entry.lastSeen <= ACTIVE_WINDOW_MS,
      }))
      .sort((a, b) => {
        if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
        if (b.currentScore !== a.currentScore) return b.currentScore - a.currentScore;
        return b.lastSeen - a.lastSeen;
      })
      .slice(0, 100);

    res.json({ players: enriched, serverTime: now });
  });

  // =========================================================================
  // BRE-B & NEQUI CARD DONATIONS + REAL PAYMENT VERIFICATION (NO QR)
  // =========================================================================

  function getCreatorVerifyPin(): string {
    return (process.env.CREATOR_VERIFY_PIN || '31552964').trim();
  }

  function isCreatorAuthorized(req: Request): boolean {
    const pin = String(req.headers['x-creator-pin'] || req.body?.pin || '').trim();
    const expected = getCreatorVerifyPin();
    if (!pin || !expected || pin.length !== expected.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  function validateRealPaymentReference(ref: string): { valid: boolean; reason?: string } {
    const clean = ref.trim().replace(/\s+/g, '');
    if (clean.length < 6 || clean.length > 32) {
      return {
        valid: false,
        reason: 'El número de comprobante / CUS / referencia Nequi debe tener entre 6 y 32 caracteres.',
      };
    }
    if (!/^[a-zA-Z0-9#_-]+$/.test(clean)) {
      return {
        valid: false,
        reason: 'La referencia contiene caracteres inválidos. Usa letras, números o guiones.',
      };
    }
    const lower = clean.toLowerCase();
    const dummyTokens = new Set([
      '123456',
      '1234567',
      '12345678',
      '654321',
      '000000',
      '111111',
      '999999',
      'abcdef',
      'qwerty',
      'prueba',
      'pruebas',
      'test12',
      'test123',
      'pago123',
      'nequi1',
    ]);
    if (dummyTokens.has(lower) || /^(.)\1{4,}$/.test(lower)) {
      return {
        valid: false,
        reason: 'El comprobante parece de prueba o repetitivo. Ingresa el código real de tu recibo Nequi/Bre-B.',
      };
    }
    return { valid: true };
  }

  function getWompiBaseUrl(key: string): string {
    return key.startsWith('prv_test_') || key.startsWith('pub_test_')
      ? 'https://sandbox.wompi.co/v1'
      : 'https://production.wompi.co/v1';
  }

  function finalizeVerifiedIntent(
    intent: PaymentIntentRecord,
    opts: {
      verifiedBy: 'wompi_gateway' | 'wompi_webhook' | 'creator_pin';
      reference: string;
      donorName?: string;
      message?: string;
      cardLast4?: string;
    }
  ): DonationRecord {
    const now = Date.now();
    intent.status = 'verified';
    intent.verifiedBy = opts.verifiedBy;
    intent.reference = opts.reference;
    intent.rewardGranted = true;
    intent.verifiedAt = now;
    if (opts.cardLast4) intent.cardLast4 = opts.cardLast4;
    if (opts.donorName) intent.donorName = opts.donorName;
    if (opts.message !== undefined) intent.message = opts.message;
    writeJsonArray(PAYMENT_INTENTS_FILE, paymentIntentRecords);

    const existingDonation = donationRecords.find(
      (d) => d.reference.trim().toLowerCase() === opts.reference.trim().toLowerCase()
    );
    if (existingDonation) return existingDonation;

    const record: DonationRecord = {
      id: `don_${now}_${Math.random().toString(36).slice(2, 7)}`,
      donorName: opts.donorName || intent.donorName,
      amountCop: intent.amountCop,
      channel: intent.method,
      reference: opts.reference,
      message: opts.message ?? intent.message ?? '',
      purpose: intent.purpose,
      verificationStatus:
        opts.verifiedBy === 'wompi_gateway' || opts.verifiedBy === 'wompi_webhook'
          ? 'verified_gateway'
          : 'verified_reference',
      cardLast4: opts.cardLast4 || intent.cardLast4 || undefined,
      createdAt: now,
    };

    donationRecords.unshift(record);
    donationRecords = donationRecords.slice(0, 200);
    writeJsonArray(DONATIONS_FILE, donationRecords);
    return record;
  }

  app.get('/api/donations', (_req, res) => {
    const sorted = [...donationRecords].sort((a, b) => b.createdAt - a.createdAt).slice(0, 60);
    const totalCop = donationRecords.reduce((acc, d) => acc + d.amountCop, 0);
    const wompiConfigured = Boolean(process.env.WOMPI_PRIVATE_KEY);
    const wompiCheckoutReady = Boolean(
      process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET
    );
    res.json({
      breBKey: BRE_B_KEY,
      nequiNumber: NEQUI_NUMBER,
      nequiCardNumber: NEQUI_CARD_NUMBER,
      nequiCardMasked: NEQUI_CARD_MASKED,
      creatorName: CREATOR_NAME,
      gatewayConfigured: wompiConfigured,
      wompiCheckoutReady,
      verificationMode: wompiConfigured
        ? 'Pasarela Wompi Colombia en vivo (verificación automática por API/Webhook)'
        : 'Transferencia directa Nequi / Bre-B con validación de comprobante por el creador',
      donations: sorted,
      totalCop,
      supporterCount: donationRecords.length,
    });
  });

  app.post('/api/payments/intent', (req, res) => {
    const body = req.body || {};
    const donorName =
      typeof body.donorName === 'string' && body.donorName.trim()
        ? body.donorName.trim().slice(0, 36)
        : 'Capitán Solidario';
    const playerProfileId =
      typeof body.playerProfileId === 'string' ? body.playerProfileId.trim().slice(0, 32) : '';
    const rawAmount = Math.round(Number(body.amountCop) || 0);
    if (!Number.isFinite(rawAmount) || rawAmount < 1000 || rawAmount > 50000000) {
      res.status(400).json({ error: 'El monto mínimo válido es $1.000 COP.' });
      return;
    }
    const purpose = body.purpose === 'extra_life' ? 'extra_life' : 'donation';
    if (purpose === 'extra_life' && rawAmount < 5000) {
      res.status(400).json({ error: 'La Vida Extra requiere mínimo $5.000 COP.' });
      return;
    }
    const method =
      typeof body.method === 'string' && body.method.trim()
        ? body.method.trim().slice(0, 32)
        : 'Nequi / Bre-B';

    const now = Date.now();
    const intent: PaymentIntentRecord = {
      id: `pi_${now}_${crypto.randomBytes(3).toString('hex')}`,
      code: `MM-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${String(now).slice(-4)}`,
      playerProfileId: playerProfileId || undefined,
      donorName,
      amountCop: rawAmount,
      purpose,
      method,
      status: 'pending',
      rewardGranted: false,
      claimedByClient: false,
      createdAt: now,
      expiresAt: now + 60 * 60 * 1000,
    };

    paymentIntentRecords.unshift(intent);
    paymentIntentRecords = paymentIntentRecords.slice(0, 300);
    writeJsonArray(PAYMENT_INTENTS_FILE, paymentIntentRecords);

    const wompiPub = process.env.WOMPI_PUBLIC_KEY || '';
    const wompiIntegrity = process.env.WOMPI_INTEGRITY_SECRET || '';
    const amountInCents = rawAmount * 100;
    const wompiCheckout =
      wompiPub && wompiIntegrity
        ? {
            publicKey: wompiPub,
            currency: 'COP',
            amountInCents,
            reference: intent.code,
            signature: crypto
              .createHash('sha256')
              .update(`${intent.code}${amountInCents}COP${wompiIntegrity}`)
              .digest('hex'),
          }
        : null;

    res.status(201).json({
      intent,
      wompiCheckout,
      breBKey: BRE_B_KEY,
      nequiNumber: NEQUI_NUMBER,
      nequiCardNumber: NEQUI_CARD_NUMBER,
      nequiCardMasked: NEQUI_CARD_MASKED,
      creatorName: CREATOR_NAME,
    });
  });

  app.post('/api/payments/verify', async (req, res) => {
    const body = req.body || {};
    const intentId = typeof body.intentId === 'string' ? body.intentId.trim() : '';
    const reference =
      typeof body.reference === 'string'
        ? body.reference.trim().replace(/\s+/g, '').slice(0, 32)
        : '';
    const senderLast4 =
      typeof body.cardNumberOrLast4 === 'string'
        ? body.cardNumberOrLast4.replace(/\D/g, '')
        : '';
    const message =
      typeof body.message === 'string' ? body.message.trim().slice(0, 140) : '';
    const receiptNote =
      typeof body.receiptNote === 'string' ? body.receiptNote.trim().slice(0, 140) : '';
    const donorNameOverride =
      typeof body.donorName === 'string' && body.donorName.trim()
        ? body.donorName.trim().slice(0, 36)
        : undefined;

    const intent = paymentIntentRecords.find((p) => p.id === intentId);
    if (!intent) {
      res.status(404).json({ error: 'Orden de pago no encontrada o expirada. Genera una nueva.' });
      return;
    }
    if (intent.status === 'verified') {
      const totalCop = donationRecords.reduce((acc, d) => acc + d.amountCop, 0);
      res.json({
        verified: true,
        awaitingReview: false,
        grantReward: !intent.claimedByClient,
        verificationMode:
          intent.verifiedBy === 'wompi_gateway' || intent.verifiedBy === 'wompi_webhook'
            ? 'Pasarela Wompi en vivo'
            : 'Verificado por el creador',
        intent,
        donations: donationRecords.slice(0, 60),
        totalCop,
        supporterCount: donationRecords.length,
      });
      return;
    }
    if (intent.status === 'rejected') {
      res.status(400).json({
        error:
          intent.rejectReason ||
          'Este comprobante fue rechazado porque no coincidió con un ingreso real en Nequi.',
      });
      return;
    }
    if (Date.now() > intent.expiresAt) {
      res.status(410).json({ error: 'La orden de pago expiró. Genera una nueva.' });
      return;
    }

    const refCheck = validateRealPaymentReference(reference);
    if (!refCheck.valid) {
      res.status(400).json({ error: refCheck.reason });
      return;
    }

    const normalizedRef = reference.toLowerCase();
    const duplicateInDonations = donationRecords.some(
      (d) => d.reference.trim().toLowerCase() === normalizedRef
    );
    const duplicateInIntents = paymentIntentRecords.some(
      (p) =>
        p.id !== intent.id &&
        p.status !== 'rejected' &&
        (p.reference || '').trim().toLowerCase() === normalizedRef
    );
    if (duplicateInDonations || duplicateInIntents) {
      res.status(409).json({
        error: 'Ese comprobante o referencia ya fue usado en otro pago. Verifica tu recibo.',
      });
      return;
    }

    let maskedLast4 = '';
    if (senderLast4.length >= 12) {
      if (!isValidLuhn(senderLast4)) {
        res.status(400).json({ error: 'El número de tarjeta ingresado no es válido (Luhn).' });
        return;
      }
      maskedLast4 = senderLast4.slice(-4);
    } else if (senderLast4.length === 4) {
      maskedLast4 = senderLast4;
    }

    // 1) Try automatic real verification with Wompi Colombia API if WOMPI_PRIVATE_KEY is configured
    const wompiKey = process.env.WOMPI_PRIVATE_KEY;
    if (wompiKey) {
      const baseUrl = getWompiBaseUrl(wompiKey);
      try {
        let tx: {
          id?: string;
          status?: string;
          amount_in_cents?: number;
          currency?: string;
          reference?: string;
        } | null = null;

        const directRes = await fetch(
          `${baseUrl}/transactions/${encodeURIComponent(reference)}`,
          { headers: { Authorization: `Bearer ${wompiKey}` } }
        );
        if (directRes.ok) {
          const directJson = await directRes.json();
          if (directJson?.data) tx = directJson.data;
        }

        if (!tx) {
          const byRefRes = await fetch(
            `${baseUrl}/transactions?reference=${encodeURIComponent(intent.code)}`,
            { headers: { Authorization: `Bearer ${wompiKey}` } }
          );
          if (byRefRes.ok) {
            const byRefJson = await byRefRes.json();
            if (Array.isArray(byRefJson?.data) && byRefJson.data.length > 0) {
              tx = byRefJson.data[0];
            }
          }
        }

        if (tx) {
          if (tx.status === 'APPROVED') {
            const paidCop = Math.floor(Number(tx.amount_in_cents || 0) / 100);
            if (tx.currency !== 'COP' || paidCop < intent.amountCop) {
              res.status(400).json({
                error: `La transacción en Wompi fue de ${paidCop} COP, menor al monto requerido (${intent.amountCop} COP).`,
              });
              return;
            }

            const record = finalizeVerifiedIntent(intent, {
              verifiedBy: 'wompi_gateway',
              reference: tx.id || reference,
              donorName: donorNameOverride,
              message,
              cardLast4: maskedLast4,
            });
            const totalCop = donationRecords.reduce((acc, d) => acc + d.amountCop, 0);
            res.status(201).json({
              verified: true,
              awaitingReview: false,
              grantReward: true,
              verificationMode: 'Pasarela Wompi Colombia verificada en vivo',
              donation: record,
              intent,
              donations: donationRecords.slice(0, 60),
              totalCop,
              supporterCount: donationRecords.length,
            });
            return;
          }

          if (tx.status === 'DECLINED' || tx.status === 'VOIDED' || tx.status === 'ERROR') {
            res.status(400).json({
              error: `La transacción figura como ${tx.status} en Wompi. No se pueden otorgar recompensas.`,
            });
            return;
          }
        }
      } catch {
        // Fall through to awaiting_review if Wompi network call failed temporarily
      }
    }

    // 2) Direct Bre-B / Nequi / Tarjeta transfer without automated bank confirmation:
    // Put into awaiting_review — NEVER grant rewards automatically until verified!
    intent.status = 'awaiting_review';
    intent.reference = reference;
    if (maskedLast4) intent.cardLast4 = maskedLast4;
    if (donorNameOverride) intent.donorName = donorNameOverride;
    if (message) intent.message = message;
    if (receiptNote) intent.receiptNote = receiptNote;
    writeJsonArray(PAYMENT_INTENTS_FILE, paymentIntentRecords);

    res.status(202).json({
      verified: false,
      awaitingReview: true,
      grantReward: false,
      intent,
      message:
        'Comprobante recibido y guardado en revisión. Por seguridad anti-fraude, la Vida Extra y los premios de Mecenas se desbloquearán en cuanto el pago sea confirmado en Nequi / Bre-B o vía pasarela Wompi.',
    });
  });

  app.post('/api/payments/wompi-webhook', (req, res) => {
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    const body = req.body || {};
    const tx = body?.data?.transaction;
    if (!tx || typeof tx.reference !== 'string') {
      res.status(400).json({ error: 'Payload de webhook inválido.' });
      return;
    }

    if (eventsSecret && Array.isArray(body?.signature?.properties) && body?.signature?.checksum) {
      const values = body.signature.properties
        .map((prop: string) => {
          const parts = prop.split('.');
          let cur: unknown = body.data;
          for (const part of parts) {
            if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
              cur = (cur as Record<string, unknown>)[part];
            } else {
              cur = '';
              break;
            }
          }
          return String(cur ?? '');
        })
        .join('');
      const expectedChecksum = crypto
        .createHash('sha256')
        .update(`${values}${body.timestamp || ''}${eventsSecret}`)
        .digest('hex');
      if (expectedChecksum !== body.signature.checksum) {
        res.status(401).json({ error: 'Firma de webhook Wompi inválida.' });
        return;
      }
    }

    const intent = paymentIntentRecords.find((p) => p.code === tx.reference);
    if (!intent) {
      res.json({ ok: true, ignored: true });
      return;
    }

    if (tx.status === 'APPROVED' && Number(tx.amount_in_cents || 0) >= intent.amountCop * 100) {
      finalizeVerifiedIntent(intent, {
        verifiedBy: 'wompi_webhook',
        reference: String(tx.id || tx.reference),
      });
    } else if (tx.status === 'DECLINED' || tx.status === 'VOIDED' || tx.status === 'ERROR') {
      intent.status = 'rejected';
      intent.rejectReason = `Wompi reportó estado ${tx.status}.`;
      writeJsonArray(PAYMENT_INTENTS_FILE, paymentIntentRecords);
    }

    res.json({ ok: true });
  });

  app.get('/api/payments/status/:intentId', (req, res) => {
    const intent = paymentIntentRecords.find((p) => p.id === req.params.intentId);
    if (!intent) {
      res.status(404).json({ error: 'Orden no encontrada.' });
      return;
    }
    const totalCop = donationRecords.reduce((acc, d) => acc + d.amountCop, 0);
    res.json({
      intent,
      verified: intent.status === 'verified',
      awaitingReview: intent.status === 'awaiting_review',
      rejected: intent.status === 'rejected',
      grantReward: intent.status === 'verified' && !intent.claimedByClient,
      donations: donationRecords.slice(0, 60),
      totalCop,
      supporterCount: donationRecords.length,
    });
  });

  app.get('/api/payments/rewards/:profileId', (req, res) => {
    const profileId = String(req.params.profileId || '').trim();
    if (!profileId) {
      res.status(400).json({ error: 'ID de perfil requerido.' });
      return;
    }
    const pendingRewards = paymentIntentRecords.filter(
      (p) => p.playerProfileId === profileId && p.status === 'verified' && !p.claimedByClient
    );
    const awaitingCount = paymentIntentRecords.filter(
      (p) => p.playerProfileId === profileId && p.status === 'awaiting_review'
    ).length;
    res.json({ pendingRewards, awaitingCount });
  });

  app.post('/api/payments/claim/:intentId', (req, res) => {
    const intent = paymentIntentRecords.find((p) => p.id === req.params.intentId);
    if (!intent) {
      res.status(404).json({ error: 'Orden no encontrada.' });
      return;
    }
    if (intent.status !== 'verified') {
      res.status(403).json({
        error: 'No se puede reclamar el premio: el pago aún no ha sido verificado.',
      });
      return;
    }
    if (intent.claimedByClient) {
      res.json({ ok: true, alreadyClaimed: true, intent });
      return;
    }
    intent.claimedByClient = true;
    writeJsonArray(PAYMENT_INTENTS_FILE, paymentIntentRecords);
    res.json({ ok: true, alreadyClaimed: false, intent });
  });

  app.get('/api/payments/pending', (req, res) => {
    if (!isCreatorAuthorized(req)) {
      res.status(401).json({ error: 'PIN del creador incorrecto.' });
      return;
    }
    const queue = paymentIntentRecords
      .filter((p) => p.status === 'awaiting_review' || p.status === 'verified' || p.status === 'rejected')
      .slice(0, 60);
    res.json({ intents: queue });
  });

  app.post('/api/payments/admin/approve', (req, res) => {
    if (!isCreatorAuthorized(req)) {
      res.status(401).json({ error: 'PIN del creador incorrecto.' });
      return;
    }
    const intentId = typeof req.body?.intentId === 'string' ? req.body.intentId.trim() : '';
    const intent = paymentIntentRecords.find((p) => p.id === intentId);
    if (!intent) {
      res.status(404).json({ error: 'Orden de pago no encontrada.' });
      return;
    }
    const record = finalizeVerifiedIntent(intent, {
      verifiedBy: 'creator_pin',
      reference: intent.reference || intent.code,
    });
    const totalCop = donationRecords.reduce((acc, d) => acc + d.amountCop, 0);
    res.json({
      ok: true,
      intent,
      donation: record,
      donations: donationRecords.slice(0, 60),
      totalCop,
      supporterCount: donationRecords.length,
    });
  });

  app.post('/api/payments/admin/reject', (req, res) => {
    if (!isCreatorAuthorized(req)) {
      res.status(401).json({ error: 'PIN del creador incorrecto.' });
      return;
    }
    const intentId = typeof req.body?.intentId === 'string' ? req.body.intentId.trim() : '';
    const reason =
      typeof req.body?.reason === 'string' && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 140)
        : 'No se encontró el ingreso en Nequi / Bre-B con esa referencia.';
    const intent = paymentIntentRecords.find((p) => p.id === intentId);
    if (!intent) {
      res.status(404).json({ error: 'Orden de pago no encontrada.' });
      return;
    }
    intent.status = 'rejected';
    intent.rejectReason = reason;
    intent.rewardGranted = false;
    writeJsonArray(PAYMENT_INTENTS_FILE, paymentIntentRecords);
    res.json({ ok: true, intent });
  });

  // Legacy endpoint disabled for unverified direct rewards
  app.post('/api/donations', (_req, res) => {
    res.status(400).json({
      error:
        'Usa el flujo de orden verificada (/api/payments/intent → /api/payments/verify) para validar tu transferencia Nequi o Bre-B.',
    });
  });

  // =========================================================================
  // FAST & COMPLETE AI CONVERSATIONS (gemini-3.1-flash-lite + MINIMAL thinking)
  // =========================================================================

  app.post('/api/ai/npc-chat', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY no configurada en Settings > Secrets.',
        code: 'NO_API_KEY',
      });
      return;
    }

    const body = req.body || {};
    const npcName = String(body.npcName || 'Vice-Cap. Vega').slice(0, 60);
    const npcRole = String(body.npcRole || 'Superviviente').slice(0, 60);
    const npcMood = String(body.npcMood || 'equilibrio').slice(0, 30);
    const npcAffinity = Number(body.npcAffinity) || 0;
    const playerName = String(body.playerName || 'Capitán').slice(0, 40);
    const playerVitals = body.playerVitals || {};
    const worldContext = body.worldContext || {};
    const transcript = Array.isArray(body.transcript) ? body.transcript.slice(-6) : [];
    const playerMessage =
      typeof body.playerMessage === 'string' ? body.playerMessage.trim().slice(0, 280) : '';

    const transcriptText = transcript
      .map((t: { name?: string; text?: string }) => `${t.name || 'Alguien'}: ${t.text || ''}`)
      .join('\n');

    const prompt = [
      `NPC: ${npcName} (${npcRole}), ánimo ${npcMood}, afinidad ${npcAffinity}/100.`,
      `Jugador ${playerName}: Sed ${Math.round(Number(playerVitals.thirst ?? 80))}%, Hambre ${Math.round(Number(playerVitals.hunger ?? 80))}%, Mente ${Math.round(Number(playerVitals.mentalHealth ?? 80))}% (${playerVitals.mood || 'equilibrio'}).`,
      `Mundo: Día ${worldContext.dayCount || 1}, clima ${worldContext.weather || 'despejado'}, peligro ${worldContext.dangerousWater ? 'sí' : 'no'}, leviatán ${worldContext.nearLeviathan ? 'cerca' : 'lejos'}.`,
      transcriptText ? `Últimas líneas:\n${transcriptText}` : 'Inicio de charla.',
      playerMessage
        ? `El jugador dijo: "${playerMessage}". Responde directo en 1-2 frases y da 4 opciones breves (empatica, pragmatica, humor, soberbia) para continuar.`
        : `Abre o continúa el tema de charla con 1-2 frases y 4 opciones breves para responder.`,
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          maxOutputTokens: 450,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          systemInstruction:
            'Eres un personaje vivo en "Marea Mutante". Responde siempre en español natural, directo y humano (máx. 2 frases por réplica), sin metacomentarios ni etiquetas técnicas. Devuelve JSON exacto.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              npcReply: { type: Type.STRING },
              npcNextMood: { type: Type.STRING },
              npcReason: { type: Type.STRING },
              affinityDelta: { type: Type.INTEGER },
              mentalDelta: { type: Type.INTEGER },
              outcomeNote: { type: Type.STRING },
              nextChoices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    toneKind: { type: Type.STRING },
                    toneLabel: { type: Type.STRING },
                    playerText: { type: Type.STRING },
                    affinityDelta: { type: Type.INTEGER },
                    mentalDelta: { type: Type.INTEGER },
                    outcomeNote: { type: Type.STRING },
                  },
                  required: [
                    'toneKind',
                    'toneLabel',
                    'playerText',
                    'affinityDelta',
                    'mentalDelta',
                    'outcomeNote',
                  ],
                },
              },
            },
            required: [
              'npcReply',
              'npcNextMood',
              'npcReason',
              'affinityDelta',
              'mentalDelta',
              'outcomeNote',
              'nextChoices',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ ok: true, data: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al contactar con Gemini AI';
      res.status(502).json({ error: message, code: 'AI_UPSTREAM_ERROR' });
    }
  });

  app.post('/api/ai/ambient-banter', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY no configurada en Settings > Secrets.',
        code: 'NO_API_KEY',
      });
      return;
    }

    const body = req.body || {};
    const crewNames = Array.isArray(body.crewNames)
      ? body.crewNames.slice(0, 6).join(', ')
      : 'Vice-Cap. Vega';
    const worldContext = body.worldContext || {};
    const playerVitals = body.playerVitals || {};

    const prompt = `4 líneas breves (máx 15 palabras c/u) para (${crewNames}) en Día ${worldContext.dayCount || 1}, clima ${worldContext.weather || 'despejado'}, peligro: ${worldContext.dangerousWater ? 'sí' : 'no'}, mente capitán: ${playerVitals.mood || 'equilibrio'}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          maxOutputTokens: 260,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          systemInstruction:
            'Escribe 4 intervenciones cortas y humanas de la tripulación de Marea Mutante en español.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['speaker', 'text'],
            },
          },
        },
      });

      const lines = JSON.parse((response.text || '[]').trim());
      res.json({ ok: true, lines });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando ambiente IA';
      res.status(502).json({ error: message, code: 'AI_UPSTREAM_ERROR' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Marea Mutante server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
