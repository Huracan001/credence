import { NextResponse } from "next/server";
import { clearCache } from "@/lib/cache";

export const revalidate = 0;

export async function POST() {
  clearCache("markets-latest");
  return NextResponse.json({ cleared: true, key: "markets-latest" });
}
