import path from "path";
import { promises as fs } from "fs";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";

let sqlPromise: Promise<SqlJsStatic> | null = null;
let dbPromise: Promise<Database> | null = null;

// Vercel's serverless file system is read-only except /tmp. Allow an override
// and default to /tmp when running on Vercel so persistence does not throw.
const DB_DIR =
  process.env.CREDENCE_DB_DIR ??
  (process.env.VERCEL ? path.join("/tmp", "credence-data") : path.join(process.cwd(), "data"));
const DB_PATH = path.join(DB_DIR, "credence.db");
let persistEnabled = true;

async function loadSqlJs() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file) =>
        path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
    });
  }
  return sqlPromise;
}

async function ensureDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    persistEnabled = false;
    console.warn("[db] could not create DB directory, running in memory only", err);
  }
}

async function loadDatabase() {
  const SQL = await loadSqlJs();
  await ensureDir();
  if (persistEnabled) {
    try {
      const fileBuffer = await fs.readFile(DB_PATH);
      return new SQL.Database(fileBuffer);
    } catch {
      // No persisted DB yet; fall through to a fresh instance.
    }
  }
  return new SQL.Database();
}

function applySchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      probability REAL NOT NULL,
      volume REAL,
      updatedAt TEXT NOT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS belief_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marketId TEXT NOT NULL,
      previousProbability REAL NOT NULL,
      currentProbability REAL NOT NULL,
      delta REAL NOT NULL,
      category TEXT,
      volume24h REAL,
      liquidity REAL,
      detectedAt TEXT NOT NULL,
      UNIQUE(marketId, detectedAt)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marketId TEXT NOT NULL,
      shiftDetectedAt TEXT NOT NULL,
      summary TEXT NOT NULL,
      whatChanged TEXT NOT NULL,
      whyMoved TEXT NOT NULL,
      uncertainty TEXT NOT NULL,
      interpretation TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(marketId, shiftDetectedAt)
    );
  `);

  // Ensure new columns exist on older databases.
  const columnsStmt = db.prepare(`PRAGMA table_info(belief_shifts);`);
  const columns: Array<{ name: string }> = [];
  while (columnsStmt.step()) {
    columns.push(columnsStmt.getAsObject() as { name: string });
  }
  columnsStmt.free();
  const existing = new Set(columns.map((c) => c.name));
  const addColumn = (name: string, type: string) => {
    if (!existing.has(name)) {
      try {
        db.run(`ALTER TABLE belief_shifts ADD COLUMN ${name} ${type};`);
      } catch (err) {
        console.warn(`[db] failed to add column ${name} to belief_shifts`, err);
      }
    }
  };
  addColumn("category", "TEXT");
  addColumn("volume24h", "REAL");
  addColumn("liquidity", "REAL");
}

async function persist(db: Database) {
  if (!persistEnabled) return; // Skip when file system is not writable.
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    await fs.writeFile(DB_PATH, buffer);
  } catch (err) {
    persistEnabled = false;
    console.warn("[db] persistence disabled after write failure; continuing in memory", err);
  }
}

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await loadDatabase();
      applySchema(db);
      await persist(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function withDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await getDb();
  const result = await fn(db);
  await persist(db);
  return result;
}

