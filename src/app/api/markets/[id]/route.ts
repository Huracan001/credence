import { NextResponse } from "next/server";
import { getMarketSnapshotById } from "@/lib/server/markets";

export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const market = await getMarketSnapshotById(params.id);
    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }
    return NextResponse.json(
      {
        market,
        meta: { generatedAt: new Date().toISOString() },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/markets/:id] failed", err);
    return NextResponse.json(
      { error: "Unable to load this market right now." },
      { status: 503 },
    );
  }
}
