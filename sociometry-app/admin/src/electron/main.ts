import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { google } from 'googleapis';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { mapSheetRows } from '../modules/google-import/mapSheetRows';
import { buildChoiceMatrix } from '../modules/analysis/buildChoiceMatrix';
import { buildRejectMatrix } from '../modules/analysis/buildRejectMatrix';
import { buildCombinedGraph } from '../modules/analysis/buildCombinedGraph';
import { buildParticipantMetrics } from '../modules/analysis/buildParticipantMetrics';
import type { CleanResponse, RawResponse } from '../modules/types/response';

const isDev = !!process.env.VITE_DEV_SERVER_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(app.getAppPath(), '..');
const dataRoot = path.join(rootDir, 'project-data');
const recentFile = path.join(dataRoot, '.recent.json');

const defaults = {
  questions: { sociometryQuestions: [], openQuestionEnabled: false, openQuestionText: '' },
  source: { googleFormUrl: '', googleSheetUrl: '', googleSheetId: '', lastImportedAt: null },
  raw: [],
  clean: [],
  analysis: { generatedAt: '', questionAnalyses: [], combinedAnalysis: { edges: [] }, participantMetrics: [] },
};

const slugify = (txt: string) =>
  txt
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9ğüşöçıİ]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
const projDir = (slug: string) => path.join(dataRoot, slug);

const readJson = async <T>(p: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as T;
  } catch {
    return fallback;
  }
};
const writeJson = async (p: string, payload: unknown) => fs.writeFile(p, JSON.stringify(payload, null, 2), 'utf8');

const ensureProjectFiles = async (slug: string) => {
  const dir = projDir(slug);
  await fs.mkdir(path.join(dir, 'reports'), { recursive: true });
  const required: Array<[string, unknown]> = [
    ['participants.json', []],
    ['questions.json', defaults.questions],
    ['source.json', defaults.source],
    ['raw-responses.json', defaults.raw],
    ['clean-responses.json', defaults.clean],
    ['analysis.json', defaults.analysis],
  ];
  for (const [name, fallback] of required) {
    const full = path.join(dir, name);
    try {
      await fs.access(full);
    } catch {
      await writeJson(full, fallback);
    }
  }
};

const toCleanResponses = (raw: RawResponse[], participants: Array<{ id: string; fullName: string }>): CleanResponse[] => {
  const nameMap = new Map(participants.map((p) => [p.fullName.toLocaleLowerCase('tr-TR'), p.id]));

  return raw
    .filter((r) => !r.isPassive)
    .map((r) => {
      const respondentId = r.respondentParticipantId || nameMap.get(r.respondentName.toLocaleLowerCase('tr-TR')) || '';
      const normalizeTargets = (targets: string[]) => {
        const ids = targets
          .map((target) => nameMap.get(target.toLocaleLowerCase('tr-TR')) || target)
          .filter(Boolean)
          .filter((targetId) => targetId !== respondentId);
        return [...new Set(ids)].slice(0, 3);
      };

      const choicesByQuestion = Object.fromEntries(
        Object.entries(r.parsedChoicesByQuestion).map(([qid, targets]) => [qid, normalizeTargets(targets)]),
      ) as Record<string, string[]>;
      const rejectsByQuestion = Object.fromEntries(
        Object.entries(r.parsedRejectsByQuestion).map(([qid, targets]) => [qid, normalizeTargets(targets)]),
      ) as Record<string, string[]>;

      return {
        id: r.id,
        submittedAt: r.submittedAt,
        respondentParticipantId: respondentId,
        choicesByQuestion,
        rejectsByQuestion,
        openQuestionAnswer: r.openQuestionAnswer,
      };
    })
    .filter((r) => !!r.respondentParticipantId);
};

const fetchSheetRows = async (sheetId: string) => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) {
    return { rows: [] as Record<string, string>[], error: 'Google credentials bulunamadı. admin/.env dosyasını doldurun.' };
  }

  const auth = new google.auth.JWT(clientEmail, undefined, privateKey, ['https://www.googleapis.com/auth/spreadsheets.readonly']);
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'A1:ZZ' });
  const values = res.data.values ?? [];
  if (values.length === 0) return { rows: [] as Record<string, string>[] };
  const [header, ...rows] = values;
  return {
    rows: rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']))),
  };
};

async function createWindow() {
  await fs.mkdir(dataRoot, { recursive: true });

  const win = new BrowserWindow({
    width: 1500,
    height: 940,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) await win.loadURL(process.env.VITE_DEV_SERVER_URL!);
  else await win.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
}

ipcMain.handle('list-projects', async () => {
  await fs.mkdir(dataRoot, { recursive: true });
  const dirs = await fs.readdir(dataRoot, { withFileTypes: true });
  const projects = [];
  for (const d of dirs.filter((x) => x.isDirectory())) {
    const meta = await readJson(path.join(dataRoot, d.name, 'project.json'), null);
    if (meta) projects.push(meta);
  }
  return projects.sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
});

ipcMain.handle('create-project', async (_, title: string, organizationName: string) => {
  const slug = `${slugify(title)}-${Date.now()}`;
  const dir = projDir(slug);
  await fs.mkdir(path.join(dir, 'reports'), { recursive: true });
  const now = new Date().toISOString();
  const project = {
    id: crypto.randomUUID(),
    slug,
    title,
    organizationName,
    createdAt: now,
    updatedAt: now,
    openQuestionEnabled: false,
    openQuestionText: '',
  };
  await writeJson(path.join(dir, 'project.json'), project);
  await ensureProjectFiles(slug);
  return project;
});

ipcMain.handle('load-project', async (_, slug: string) => {
  await ensureProjectFiles(slug);
  const dir = projDir(slug);
  return {
    project: await readJson(path.join(dir, 'project.json'), null),
    participants: await readJson(path.join(dir, 'participants.json'), []),
    questions: await readJson(path.join(dir, 'questions.json'), defaults.questions),
    source: await readJson(path.join(dir, 'source.json'), defaults.source),
    rawResponses: await readJson(path.join(dir, 'raw-responses.json'), []),
    cleanResponses: await readJson(path.join(dir, 'clean-responses.json'), []),
    analysis: await readJson(path.join(dir, 'analysis.json'), defaults.analysis),
  };
});

ipcMain.handle('read-project-file', async (_, slug, fileName) => readJson(path.join(projDir(slug), fileName), null));
ipcMain.handle('write-project-file', async (_, slug, fileName, payload) => {
  await writeJson(path.join(projDir(slug), fileName), payload);
  if (fileName !== 'project.json') {
    const project = await readJson<any>(path.join(projDir(slug), 'project.json'), null);
    if (project) {
      project.updatedAt = new Date().toISOString();
      await writeJson(path.join(projDir(slug), 'project.json'), project);
    }
  }
});

ipcMain.handle('fetch-sheet-data', async (_, sheetId: string) => {
  try {
    return await fetchSheetRows(sheetId);
  } catch (error) {
    return { rows: [], error: `Sheet verisi alınamadı: ${(error as Error).message}` };
  }
});

ipcMain.handle('import-sheet', async (_, slug: string) => {
  const dir = projDir(slug);
  const participants = await readJson<Array<{ id: string; fullName: string }>>(path.join(dir, 'participants.json'), []);
  const questions = await readJson<any>(path.join(dir, 'questions.json'), defaults.questions);
  const source = await readJson<any>(path.join(dir, 'source.json'), defaults.source);

  const sheetId = source.googleSheetId || source.googleSheetUrl;
  if (!sheetId) return { error: 'Google Sheet bağlantısı boş.' };

  try {
    const result = await fetchSheetRows(sheetId);
    if ((result as any).error) return result;
    const raw = mapSheetRows(result.rows, participants as any, questions);
    const clean = toCleanResponses(raw, participants);
    const nextSource = { ...source, lastImportedAt: new Date().toISOString() };

    await writeJson(path.join(dir, 'raw-responses.json'), raw);
    await writeJson(path.join(dir, 'clean-responses.json'), clean);
    await writeJson(path.join(dir, 'source.json'), nextSource);

    return { raw, clean, source: nextSource };
  } catch (error) {
    return { error: `Import başarısız: ${(error as Error).message}` };
  }
});

ipcMain.handle('set-passive', async (_, slug: string, responseId: string, isPassive: boolean) => {
  const dir = projDir(slug);
  const participants = await readJson<Array<{ id: string; fullName: string }>>(path.join(dir, 'participants.json'), []);
  const raw = await readJson<RawResponse[]>(path.join(dir, 'raw-responses.json'), []);
  const updatedRaw = raw.map((r) => (r.id === responseId ? { ...r, isPassive } : r));
  const clean = toCleanResponses(updatedRaw, participants);
  await writeJson(path.join(dir, 'raw-responses.json'), updatedRaw);
  await writeJson(path.join(dir, 'clean-responses.json'), clean);
  return { raw: updatedRaw, clean };
});

ipcMain.handle('run-analysis', async (_, slug: string) => {
  const dir = projDir(slug);
  const clean = await readJson<CleanResponse[]>(path.join(dir, 'clean-responses.json'), []);
  const questions = await readJson<any>(path.join(dir, 'questions.json'), defaults.questions);
  const participants = await readJson<Array<{ id: string }>>(path.join(dir, 'participants.json'), []);

  const questionAnalyses = questions.sociometryQuestions.map((q: any) => {
    const choiceMatrix = buildChoiceMatrix(clean, q.id);
    const rejectMatrix = buildRejectMatrix(clean, q.id);
    const edges = buildCombinedGraph([choiceMatrix], [rejectMatrix]);
    return { questionId: q.id, choiceMatrix, rejectMatrix, edges };
  });

  const combinedAnalysis = {
    edges: buildCombinedGraph(
      questionAnalyses.map((x: any) => x.choiceMatrix),
      questionAnalyses.map((x: any) => x.rejectMatrix),
    ),
  };

  const participantMetrics = buildParticipantMetrics(
    participants.map((p) => p.id),
    combinedAnalysis.edges,
  );

  const analysis = {
    generatedAt: new Date().toISOString(),
    questionAnalyses,
    combinedAnalysis,
    participantMetrics,
  };

  await writeJson(path.join(dir, 'analysis.json'), analysis);
  return analysis;
});

ipcMain.handle('export-report', async (_, slug: string, kind: 'pdf' | 'word' | 'excel') => {
  const dir = projDir(slug);
  const reportsDir = path.join(dir, 'reports');
  await fs.mkdir(reportsDir, { recursive: true });

  const project = await readJson<any>(path.join(dir, 'project.json'), {});
  const participants = await readJson<any[]>(path.join(dir, 'participants.json'), []);
  const questions = await readJson<any>(path.join(dir, 'questions.json'), defaults.questions);
  const raw = await readJson<any[]>(path.join(dir, 'raw-responses.json'), []);
  const clean = await readJson<any[]>(path.join(dir, 'clean-responses.json'), []);
  const analysis = await readJson<any>(path.join(dir, 'analysis.json'), defaults.analysis);

  const base = path.join(reportsDir, `${project.slug || 'report'}-${Date.now()}`);

  if (kind === 'pdf') {
    const pdf = new jsPDF();
    let y = 12;
    const line = (text: string) => {
      pdf.text(text, 10, y);
      y += 8;
    };

    line(`Proje: ${project.title || '-'}`);
    line(`Kurum: ${project.organizationName || '-'}`);
    line(`Katılımcı sayısı: ${participants.length}`);
    line(`Soru sayısı: ${questions.sociometryQuestions.length}`);
    line(`Ham kayıt sayısı: ${raw.length}`);
    line(`Temiz kayıt sayısı: ${clean.length}`);
    line(`Üretilen metrik sayısı: ${analysis.participantMetrics.length}`);

    const file = `${base}.pdf`;
    await fs.writeFile(file, Buffer.from(pdf.output('arraybuffer')));
    return file;
  }

  if (kind === 'word') {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun(`Proje: ${project.title || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Kurum: ${project.organizationName || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Katılımcılar: ${participants.length}`)] }),
            new Paragraph({ children: [new TextRun(`Sorular: ${questions.sociometryQuestions.length}`)] }),
            new Paragraph({ children: [new TextRun(`Ham veri özeti: ${raw.length}`)] }),
            new Paragraph({ children: [new TextRun(`Metrik sayısı: ${analysis.participantMetrics.length}`)] }),
          ],
        },
      ],
    });

    const file = `${base}.docx`;
    await fs.writeFile(file, await Packer.toBuffer(doc));
    return file;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(participants), 'participants');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(questions.sociometryQuestions), 'questions');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(raw), 'raw responses');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clean), 'clean responses');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(analysis.participantMetrics), 'participant metrics');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(analysis.combinedAnalysis.edges), 'combined edges');
  const file = `${base}.xlsx`;
  XLSX.writeFile(workbook, file);
  return file;
});

ipcMain.handle('get-recent-projects', async () => readJson<string[]>(recentFile, []));
ipcMain.handle('set-recent-project', async (_, slug: string) => {
  const list = await readJson<string[]>(recentFile, []);
  const next = [slug, ...list.filter((x) => x !== slug)].slice(0, 10);
  await writeJson(recentFile, next);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
