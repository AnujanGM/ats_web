import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/store";

export async function POST() {
  try {
    const result = await seedDatabase(true);
    return NextResponse.json({
      message: "LedgerPro demo data restored successfully.",
      ...result,
    });
  } catch (error) {
    console.error("[POST /api/seed] Error:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data." },
      { status: 500 }
    );
  }
}
