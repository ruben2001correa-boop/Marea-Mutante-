import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
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
const BRE_B_KEY = '@3155552964';
const CREATOR_NAME = 'Ruben Dario Correa Cuellar';
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

interface DonationRecord {
  id: string;
  donorName: string;
  amountCop: number;
  channel: string;
  reference: string;
  message: string;
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
  lastSeen: number;
}

function loadLeaderboard(): StoredPlayerRecord[] {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) return [];
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(records: StoredPlayerRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando leaderboard:', err);
  }
}

function loadDonations(): DonationRecord[] {
  try {
    if (!fs.existsSync(DONATIONS_FILE)) return [];
    const raw = fs.readFileSync(DONATIONS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDonations(records: DonationRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DONATIONS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando donaciones:', err);
  }
}

let leaderboardRecords: StoredPlayerRecord[] = loadLeaderboard();
let donationRecords: DonationRecord[] = loadDonations();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/leaderboard', (_req, res) => {
    const now = Date.now();
    const enriched = leaderboardRecords
      .map((entry) => ({
        ...entry,
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
        : 'MX';
    const incomingMax = Math.max(0, Math.round(Number(body.maxScore) || 0));
    const currentScore = Math.max(0, Math.round(Number(body.currentScore) || 0));
    const dayCount = Math.max(1, Math.round(Number(body.dayCount) || 1));
    const level = Math.max(1, Math.round(Number(body.level) || 1));
    const bounty = Math.max(0, Math.round(Number(body.bounty) || 0));
    const clanTag =
      typeof body.clanTag === 'string' ? body.clanTag.trim().toUpperCase().slice(0, 6) : '';
    const titleName =
      typeof body.titleName === 'string' && body.titleName.trim()
        ? body.titleName.trim().slice(0, 32)
        : 'Náufrago';
    const shipClass =
      typeof body.shipClass === 'string' && body.shipClass.trim()
        ? body.shipClass.trim().slice(0, 28)
        : 'Balsa';
    const kills = Math.max(0, Math.round(Number(body.kills) || 0));
    const islandsVisited = Math.max(0, Math.round(Number(body.islandsVisited) || 0));
    const donorUnlocked = Boolean(body.donorUnlocked);

    const idx = leaderboardRecords.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const prev = leaderboardRecords[idx];
      leaderboardRecords[idx] = {
        id,
        name,
        country,
        maxScore: Math.max(prev.maxScore, incomingMax, currentScore),
        currentScore,
        dayCount,
        level,
        bounty,
        clanTag,
        titleName,
        shipClass,
        kills: Math.max(prev.kills || 0, kills),
        islandsVisited: Math.max(prev.islandsVisited || 0, islandsVisited),
        donorUnlocked: Boolean(prev.donorUnlocked || donorUnlocked),
        lastSeen: now,
      };
    } else {
      leaderboardRecords.push({
        id,
        name,
        country,
        maxScore: Math.max(incomingMax, currentScore),
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
        lastSeen: now,
      });
    }

    saveLeaderboard(leaderboardRecords);

    const enriched = leaderboardRecords
      .map((entry) => ({
        ...entry,
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

  app.get('/api/donations', (_req, res) => {
    const sorted = [...donationRecords].sort((a, b) => b.createdAt - a.createdAt).slice(0, 60);
    const totalCop = donationRecords.reduce((acc, d) => acc + d.amountCop, 0);
    res.json({
      breBKey: BRE_B_KEY,
      creatorName: CREATOR_NAME,
      donations: sorted,
      totalCop,
      supporterCount: donationRecords.length,
    });
  });

  app.post('/api/donations', (req, res) => {
    const body = req.body || {};
    const donorName =
      typeof body.donorName === 'string' && body.donorName.trim()
        ? body.donorName.trim().slice(0, 36)
        : 'Capitán Anónimo';
    const rawAmount = Math.round(Number(body.amountCop) || 0);
    if (!Number.isFinite(rawAmount) || rawAmount < 1000 || rawAmount > 50000000) {
      res.status(400).json({ error: 'El monto mínimo de donación es $1.000 COP' });
      return;
    }

    const channel =
      typeof body.channel === 'string' && body.channel.trim()
        ? body.channel.trim().slice(0, 28)
        : 'Bre-B';
    const reference =
      typeof body.reference === 'string' ? body.reference.trim().slice(0, 24) : '';
    const message =
      typeof body.message === 'string' ? body.message.trim().slice(0, 140) : '';

    const record: DonationRecord = {
      id: `don_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      donorName,
      amountCop: rawAmount,
      channel,
      reference,
      message,
      createdAt: Date.now(),
    };

    donationRecords.unshift(record);
    donationRecords = donationRecords.slice(0, 200);
    saveDonations(donationRecords);

    const totalCop = donationRecords.reduce((acc, d) => acc + d.amountCop, 0);
    res.status(201).json({
      donation: record,
      breBKey: BRE_B_KEY,
      creatorName: CREATOR_NAME,
      donations: donationRecords.slice(0, 60),
      totalCop,
      supporterCount: donationRecords.length,
    });
  });

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
    const transcript = Array.isArray(body.transcript) ? body.transcript.slice(-8) : [];
    const playerMessage =
      typeof body.playerMessage === 'string' ? body.playerMessage.trim().slice(0, 320) : '';

    const transcriptText = transcript
      .map((t: { name?: string; text?: string }) => `${t.name || 'Alguien'}: ${t.text || ''}`)
      .join('\n');

    const prompt = [
      `Personaje NPC: ${npcName} (${npcRole}).`,
      `Actitud actual del NPC: ${npcMood}, afinidad con el jugador: ${npcAffinity}/100.`,
      `Estado del jugador (${playerName}): Sed ${Math.round(Number(playerVitals.thirst ?? 80))}%, Hambre ${Math.round(Number(playerVitals.hunger ?? 80))}%, Sueño ${Math.round(Number(playerVitals.sleepiness ?? 80))}%, Cansancio ${Math.round(Number(playerVitals.fatigue ?? 80))}%, Salud Mental ${Math.round(Number(playerVitals.mentalHealth ?? 80))}%, Emoción actual: ${playerVitals.mood || 'equilibrio'}.`,
      `Contexto del mundo: Día ${worldContext.dayCount || 1}, Clima: ${worldContext.weather || 'despejado'}, Aguas peligrosas: ${worldContext.dangerousWater ? 'Sí' : 'No'}, Leviatán cerca: ${worldContext.nearLeviathan ? 'Sí' : 'No'}, Misión activa: ${worldContext.missionTitle || 'Supervivencia libre'}, Islas visitadas: ${worldContext.islandsVisited || 0}.`,
      transcriptText ? `Conversación reciente:\n${transcriptText}` : 'Inicio de conversación en cubierta.',
      playerMessage
        ? `El jugador acaba de decirte directamente: "${playerMessage}". Responde de forma muy humana, emotiva y coherente con el mundo y propón 4 respuestas posibles para que el jugador continúe hablando.`
        : `Genera un nuevo comentario/pregunta viva de ${npcName} para abrir o continuar la charla, junto con 4 opciones de respuesta variadas (empática, pragmática, humor, soberbia).`,
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Eres el motor narrativo de "Marea Mutante: El Océano de las Cenizas Saladas", un mundo postapocalíptico marino crudo y emotivo donde la humanidad sobrevive en balsas e islas ante piratas desesperados y leviatanes colosales. Responde SIEMPRE en español natural, inmersivo, breve (1-3 frases por diálogo) y sin metacomentarios ni etiquetas técnicas. Devuelve JSON válido según el esquema. Si el jugador está en estado "lokito", sediento, hambriento o soberbio, el NPC debe notarlo y reaccionar humanamente.',
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
                    npcReply: { type: Type.STRING },
                    npcNextMood: { type: Type.STRING },
                    affinityDelta: { type: Type.INTEGER },
                    mentalDelta: { type: Type.INTEGER },
                    outcomeNote: { type: Type.STRING },
                  },
                  required: [
                    'toneKind',
                    'toneLabel',
                    'playerText',
                    'npcReply',
                    'npcNextMood',
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

    const prompt = `Genera 4 líneas breves y vivas de diálogo ambiental para los NPCs humanos (${crewNames}) en el Día ${worldContext.dayCount || 1}, clima ${worldContext.weather || 'despejado'}, aguas peligrosas: ${worldContext.dangerousWater ? 'sí' : 'no'}, leviatán cerca: ${worldContext.nearLeviathan ? 'sí' : 'no'}, estado mental del capitán: ${playerVitals.mood || 'equilibrio'} (${Math.round(Number(playerVitals.mentalHealth ?? 80))}%).`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Escribe 4 intervenciones cortas, emotivas y realistas de la tripulación de Marea Mutante en español (máximo 18 palabras cada una). Deben sentirse humanas y reflejar el ambiente marino.',
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
