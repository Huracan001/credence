import { BeliefShift, Market, StoredInsight } from "@/types";
import { withDb } from "./db";

type MarketRow = {
  id: string;
  question: string;
  probability: number;
  volume: number | null;
  updatedAt: string;
};

function mapMarketRow(row: MarketRow): Market {
  return {
    id: row.id,
    question: row.question,
    probability: row.probability,
    volume: row.volume ?? 0,
    updatedAt: row.updatedAt,
  };
}

type InsightRow = {
  marketId: string;
  shiftDetectedAt: string;
  summary: string;
  whatChanged: string;
  whyMoved: string;
  uncertainty: string;
  interpretation: string;
  createdAt: string;
};

function mapInsightRow(row: InsightRow): StoredInsight {
  return {
    id: `${row.marketId}-${row.shiftDetectedAt}`,
    marketId: row.marketId,
    shiftDetectedAt: row.shiftDetectedAt,
    summary: row.summary,
    whatChanged: JSON.parse(row.whatChanged),
    whyMoved: JSON.parse(row.whyMoved),
    uncertainty: JSON.parse(row.uncertainty),
    interpretation: row.interpretation,
    createdAt: row.createdAt,
  };
}

export async function upsertMarkets(markets: Market[]): Promise<void> {
  return withDb((db) => {
    const stmt = db.prepare(
      `INSERT INTO markets (id, question, probability, volume, updatedAt)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         question=excluded.question,
         probability=excluded.probability,
         volume=excluded.volume,
         updatedAt=excluded.updatedAt`,
    );
    markets.forEach((m) => {
      stmt.run([m.id, m.question, m.probability, m.volume, m.updatedAt]);
    });
    stmt.free();
  });
}

export async function getMarkets(): Promise<Market[]> {
  return withDb((db) => {
    const stmt = db.prepare(`SELECT * FROM markets`);
    const rows: MarketRow[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as MarketRow);
    }
    stmt.free();
    return rows.map(mapMarketRow);
  });
}

export async function getMarketById(id: string): Promise<Market | null> {
  return withDb((db) => {
    const stmt = db.prepare(`SELECT * FROM markets WHERE id = ? LIMIT 1`);
    stmt.bind([id]);
    const hasResult = stmt.step();
    if (!hasResult) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject() as unknown as MarketRow;
    stmt.free();
    return mapMarketRow(row);
  });
}

export async function recordBeliefShift(shift: BeliefShift): Promise<void> {
  return withDb((db) => {
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO belief_shifts
      (marketId, previousProbability, currentProbability, delta, detectedAt)
      VALUES (?, ?, ?, ?, ?)`,
    );
    stmt.run([
      shift.marketId,
      shift.previousProbability,
      shift.currentProbability,
      shift.delta,
      shift.detectedAt,
    ]);
    stmt.free();
  });
}

export async function getLatestBeliefShift(
  marketId: string,
): Promise<BeliefShift | null> {
  return withDb((db) => {
    const stmt = db.prepare(
      `SELECT marketId, previousProbability, currentProbability, delta, detectedAt
       FROM belief_shifts
       WHERE marketId = ?
       ORDER BY datetime(detectedAt) DESC
       LIMIT 1`,
    );
    stmt.bind([marketId]);
    const hasResult = stmt.step();
    if (!hasResult) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject() as BeliefShift;
    stmt.free();
    return row;
  });
}

export async function listBeliefShifts(limit = 20): Promise<BeliefShift[]> {
  return withDb((db) => {
    const stmt = db.prepare(
      `SELECT marketId, previousProbability, currentProbability, delta, detectedAt
       FROM belief_shifts
       ORDER BY datetime(detectedAt) DESC
       LIMIT ?`,
    );
    stmt.bind([limit]);
    const rows: BeliefShift[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as BeliefShift);
    }
    stmt.free();
    return rows;
  });
}

export async function listBeliefShiftsForMarket(
  marketId: string,
  sinceIso?: string,
  limit = 100,
): Promise<BeliefShift[]> {
  return withDb((db) => {
    const stmt = sinceIso
      ? db.prepare(
          `SELECT marketId, previousProbability, currentProbability, delta, detectedAt
           FROM belief_shifts
           WHERE marketId = ? AND datetime(detectedAt) >= datetime(?)
           ORDER BY datetime(detectedAt) DESC
           LIMIT ?`,
        )
      : db.prepare(
          `SELECT marketId, previousProbability, currentProbability, delta, detectedAt
           FROM belief_shifts
           WHERE marketId = ?
           ORDER BY datetime(detectedAt) DESC
           LIMIT ?`,
        );

    if (sinceIso) {
      stmt.bind([marketId, sinceIso, limit]);
    } else {
      stmt.bind([marketId, limit]);
    }

    const rows: BeliefShift[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as BeliefShift);
    }
    stmt.free();
    return rows;
  });
}

export async function getHistoricalProbability(
  marketId: string,
  cutoffIso: string,
): Promise<number | null> {
  return withDb((db) => {
    const stmt = db.prepare(
      `SELECT currentProbability
       FROM belief_shifts
       WHERE marketId = ? AND datetime(detectedAt) <= datetime(?)
       ORDER BY datetime(detectedAt) DESC
       LIMIT 1`,
    );
    stmt.bind([marketId, cutoffIso]);
    const hasResult = stmt.step();
    if (!hasResult) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject() as { currentProbability: number };
    stmt.free();
    return row.currentProbability ?? null;
  });
}

export async function saveInsight(insight: StoredInsight): Promise<void> {
  return withDb((db) => {
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO insights
      (marketId, shiftDetectedAt, summary, whatChanged, whyMoved, uncertainty, interpretation, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    stmt.run([
      insight.marketId,
      insight.shiftDetectedAt,
      insight.summary,
      JSON.stringify(insight.whatChanged),
      JSON.stringify(insight.whyMoved),
      JSON.stringify(insight.uncertainty),
      insight.interpretation,
      insight.createdAt,
    ]);
    stmt.free();
  });
}

export async function getInsightForShift(
  marketId: string,
  shiftDetectedAt: string,
): Promise<StoredInsight | null> {
  return withDb((db) => {
    const stmt = db.prepare(
      `SELECT marketId, shiftDetectedAt, summary, whatChanged, whyMoved, uncertainty, interpretation, createdAt
       FROM insights
       WHERE marketId = ? AND shiftDetectedAt = ?
       LIMIT 1`,
    );
    stmt.bind([marketId, shiftDetectedAt]);
    const hasResult = stmt.step();
    if (!hasResult) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject() as InsightRow;
    stmt.free();
    return mapInsightRow(row);
  });
}

export async function getLatestInsight(
  marketId: string,
): Promise<StoredInsight | null> {
  return withDb((db) => {
    const stmt = db.prepare(
      `SELECT marketId, shiftDetectedAt, summary, whatChanged, whyMoved, uncertainty, interpretation, createdAt
       FROM insights
       WHERE marketId = ?
       ORDER BY datetime(shiftDetectedAt) DESC
       LIMIT 1`,
    );
    stmt.bind([marketId]);
    const hasResult = stmt.step();
    if (!hasResult) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject() as InsightRow;
    stmt.free();
    return mapInsightRow(row);
  });
}

