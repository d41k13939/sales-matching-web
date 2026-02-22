import { NextRequest, NextResponse } from "next/server";
import { runMatching } from "@/lib/matching";
import { parseSkillSheetBase64, parseSkillSheetText } from "@/lib/skillParser";
import type { SearchCondition, SkillProfile } from "@/lib/matching";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      location,
      priceType,
      minPrice,
      workHours,
      workTimeZone,
      startDate,
      remarks,
      skillSheetBase64,
      skillSheetFileName,
    } = body;

    const condition: SearchCondition = {
      location,
      priceType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      workHours,
      workTimeZone,
      startDate,
      remarks,
    };

    let skillProfile: SkillProfile | null = null;
    if (skillSheetBase64 && skillSheetFileName) {
      try {
        skillProfile = await parseSkillSheetBase64(skillSheetBase64, skillSheetFileName);
      } catch (e) {
        console.error("スキルシート解析エラー:", e);
      }
    }

    const result = await runMatching(condition, skillProfile);
    return NextResponse.json(result);
  } catch (error) {
    console.error("マッチングエラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
