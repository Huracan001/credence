import { NextRequest, NextResponse } from "next/server";
import { listBeliefShiftsForMarket } from "@/lib/persistence/store";

export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const since = searchParams.get("since") || undefined;

    const shifts = await listBeliefShiftsForMarket(id, since, limit);
    
    return NextResponse.json(
      {
        shifts,
        meta: {
          marketId: id,
          count: shifts.length,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/markets/:id/shifts] failed", err);
    return NextResponse.json(
      { error: "Unable to load shifts right now." },
      { status: 503 },
    );
  }
}
