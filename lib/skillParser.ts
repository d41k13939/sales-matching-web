/**
 * スキルシート解析（OpenAI API使用）
 */

import OpenAI from "openai";
import type { SkillProfile } from "./matching";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY が設定されていません");
  return new OpenAI({ apiKey });
}

export async function parseSkillSheetText(text: string, fileName: string): Promise<SkillProfile> {
  const openai = getOpenAI();

  const prompt = `以下はスキルシートのテキストです。候補者のスキルと経験年数を抽出してください。

テキスト:
${text.slice(0, 4000)}

以下のJSON形式で返してください（コードブロックなし）:
{
  "summary": "候補者のスキルサマリー（2〜3文）",
  "skills": ["スキル1", "スキル2", ...],
  "yearsOfExperience": {"スキル1": 年数, "スキル2": "unknown", ...}
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return parseSkillProfileFromLLM(content, text);
}

export async function parseSkillSheetBase64(base64: string, fileName: string): Promise<SkillProfile> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    // PDFはOpenAI Vision APIで解析
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `このスキルシートから候補者のスキルと経験年数を抽出してください。
以下のJSON形式で返してください（コードブロックなし）:
{
  "summary": "候補者のスキルサマリー（2〜3文）",
  "skills": ["スキル1", "スキル2", ...],
  "yearsOfExperience": {"スキル1": 年数, "スキル2": "unknown", ...}
}`,
            },
            {
              type: "image_url",
              image_url: { url: `data:application/pdf;base64,${base64}`, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    return parseSkillProfileFromLLM(content, base64);
  }

  // CSV/Excel はテキストとしてデコード
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  return parseSkillSheetText(decoded, fileName);
}

function parseSkillProfileFromLLM(responseText: string, rawText: string): SkillProfile {
  try {
    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary ?? "スキル情報を解析しました",
      skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: unknown) => typeof s === "string") : [],
      yearsOfExperience: parsed.yearsOfExperience ?? {},
      rawText,
    };
  } catch {
    return { summary: "スキルシートを解析しました", skills: [], yearsOfExperience: {}, rawText };
  }
}
