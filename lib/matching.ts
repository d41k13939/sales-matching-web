/**
 * 営業人材マッチングコアロジック（Next.js Web版）
 * モバイルアプリ版から移植・独立動作
 */

// ===== 型定義 =====

export type PriceType = "hourly" | "monthly";

export interface SearchCondition {
  location?: string;
  priceType?: PriceType;
  minPrice?: number;
  workHours?: string;
  workTimeZone?: string;
  startDate?: string;
  remarks?: string;
  skillSheetText?: string; // テキスト抽出済みのスキルシート内容
  skillSheetFileName?: string;
}

export interface AnkenData {
  id: string;
  name: string;
  fullText: string;
}

export type WarningType =
  | "location_out_of_range"
  | "location_unknown"
  | "price_unknown"
  | "must_relaxed";

export interface AnkenResult {
  id: string;
  name: string;
  fullText: string;
  score: number;
  warnings: WarningType[];
  warningMessages: string[];
  extractedLocation?: string;
  extractedPriceType?: PriceType;
  extractedPrice?: number;
  matchReason?: string;
  matchReasonDetail?: string;
}

export interface ExcludedAnken {
  id: string;
  name: string;
  fullText: string;
  excludeReason: "price_mismatch" | "remarks_ng" | "location_excluded";
  excludeReasonMessage: string;
}

export interface SkillProfile {
  summary: string;
  skills: string[];
  yearsOfExperience: Record<string, number | "unknown">;
  rawText: string;
}

export interface MatchResult {
  matched: AnkenResult[];
  excluded: ExcludedAnken[];
  totalCount: number;
  mustRelaxed: boolean;
  skillSummary?: string;
}

// ===== スプレッドシート取得 =====

let sheetCache: { data: AnkenData[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function clearSheetCache() {
  sheetCache = null;
}

function toExportUrl(url: string): string {
  if (url.includes("/export")) return url;
  const match = url.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) throw new Error("Invalid Google Sheets URL");
  const sheetId = match[1];
  const gidMatch = url.match(/[?&]gid=(\d+)/);
  const gid = gidMatch ? `&gid=${gidMatch[1]}` : "";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
}

export async function fetchAnkenFromSheet(sheetUrl?: string): Promise<AnkenData[]> {
  const url = sheetUrl || process.env.GOOGLE_SHEET_URL || "";
  if (!url) throw new Error("GOOGLE_SHEET_URL が設定されていません");

  if (sheetCache && Date.now() - sheetCache.fetchedAt < CACHE_TTL_MS) {
    return sheetCache.data;
  }

  const exportUrl = toExportUrl(url);
  const response = await fetch(exportUrl, { headers: { Accept: "text/csv" } });
  if (!response.ok) {
    throw new Error(`スプレッドシートの取得に失敗しました: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const data = parseCsvToAnken(csvText);
  sheetCache = { data, fetchedAt: Date.now() };
  return data;
}

function parseCsvToAnken(csvText: string): AnkenData[] {
  const allRows = parseCsvAllRows(csvText);
  if (allRows.length < 2) return [];

  const nameRow = allRows[0];
  const textRow = allRows[1];
  const result: AnkenData[] = [];

  for (let col = 0; col < nameRow.length; col++) {
    const name = (nameRow[col] ?? "").trim();
    const fullText = (textRow[col] ?? "").trim();
    if (!name && !fullText) continue;
    result.push({ id: `anken_${col + 1}`, name: name || `案件${col + 1}`, fullText });
  }
  return result;
}

function parseCsvAllRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(current); current = "";
    } else if ((char === '\n' || (char === '\r' && next === '\n')) && !inQuotes) {
      currentRow.push(current); current = "";
      rows.push(currentRow); currentRow = [];
      if (char === '\r') i++;
    } else {
      current += char;
    }
  }
  if (current || currentRow.length > 0) { currentRow.push(current); rows.push(currentRow); }
  return rows;
}

// ===== 単価抽出 =====

export function extractPrice(text: string): { price: number | null; priceType: PriceType | null } {
  // ===== 時給パターン =====

  // 「単価：～2,400円税込」チルダ付き上限のみ（時給範囲）
  const hourlyTildeUpper = text.match(/単価\s*[:：]\s*[〜～~]\s*([\d,，]+)\s*円/);
  if (hourlyTildeUpper) {
    const val = parseInt(hourlyTildeUpper[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val < 10000) return { price: val, priceType: "hourly" };
  }

  // 「時給制：2,000~2,400円」
  const hourlySeq = text.match(/時給制\s*[:：]\s*([\d,，]+)\s*[〜～~\-−]\s*([\d,，]+)\s*円/);
  if (hourlySeq) {
    const val = parseInt(hourlySeq[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val)) return { price: val, priceType: "hourly" };
  }

  // 「時給：1,600円〜2,000円」
  const hourlyColon = text.match(/時給\s*[:：]\s*([\d,，]+)\s*円/);
  if (hourlyColon) {
    const val = parseInt(hourlyColon[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val)) return { price: val, priceType: "hourly" };
  }

  // 「2,300円~2,500円/時給」後置時給
  const hourlyPostfix = text.match(/([\d,，]+)\s*円\s*[〜～~\-−\/]\s*(?:[\d,，]+\s*円\s*[〜～~\-−\/]\s*)?(?:時給|時間|h)/);
  if (hourlyPostfix) {
    const val = parseInt(hourlyPostfix[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val < 10000) return { price: val, priceType: "hourly" };
  }

  // 「1,600円 / 時」
  const hourlySlash = text.match(/([\d,，]+)\s*円\s*[\/／]\s*時/);
  if (hourlySlash) {
    const val = parseInt(hourlySlash[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val < 10000) return { price: val, priceType: "hourly" };
  }

  // 「時給2,200円」
  const hourlyPrefix = text.match(/時給\s*([\d,，]+)\s*円/);
  if (hourlyPrefix) {
    const val = parseInt(hourlyPrefix[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val)) return { price: val, priceType: "hourly" };
  }

  // 「■単価：2,300円~2,500円/時給」単価ラベル付き時給範囲
  const hourlyLabelRange = text.match(/単価\s*[:：]\s*([\d,，]+)\s*円\s*[〜～~\-−]\s*([\d,，]+)\s*円\s*[\/／]\s*時/);
  if (hourlyLabelRange) {
    const val = parseInt(hourlyLabelRange[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val < 10000) return { price: val, priceType: "hourly" };
  }

  // 「■単価：2,300円~2,500円」単価ラベル付き（時給相当の小さい値）
  const hourlyLabelSmall = text.match(/単価\s*[:：]\s*([\d,，]+)\s*円\s*[〜～~\-−]\s*([\d,，]+)\s*円/);
  if (hourlyLabelSmall) {
    const val = parseInt(hourlyLabelSmall[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val < 10000) return { price: val, priceType: "hourly" };
  }

  // 「日/12,000円＋税」日給
  const dailyRate = text.match(/日\s*[\/／]\s*([\d,，]+)\s*円/);
  if (dailyRate) {
    const dailyVal = parseInt(dailyRate[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(dailyVal)) return { price: dailyVal * 20, priceType: "monthly" };
  }

  // 「報酬」セクション後の時給（改行対応）
  const rewardSection = text.match(/(?:報酬|給与)\s*\n(?:.*\n)*?.*?([\d,，]+)\s*円\s*[〜～~\-−]\s*([\d,，]+)\s*円/);
  if (rewardSection) {
    const val = parseInt(rewardSection[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val < 10000) return { price: val, priceType: "hourly" };
  }

  // 「①トッププレイヤー枠 2,200円~2,600円」報酬セクション後の番号付き時給
  const rewardNumbered = text.match(/(?:報酬|給与)[^\n]*\n[^\n]*?([\d,，]+)\s*円\s*[〜～~\-−]\s*([\d,，]+)\s*円/);
  if (rewardNumbered) {
    const val = parseInt(rewardNumbered[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val < 10000) return { price: val, priceType: "hourly" };
  }

  // ===== 月額パターン =====

  // 「税抜32万円（フルタイム）」税抜万円
  const monthlyTaxExcluded = text.match(/税抜\s*([\d.]+)\s*万円/);
  if (monthlyTaxExcluded) {
    const val = Math.round(parseFloat(monthlyTaxExcluded[1]) * 10000);
    if (!isNaN(val)) return { price: val, priceType: "monthly" };
  }

  // 「32〜35万円目安」万円範囲（単価ラベル付き）
  const monthlyManEnLabelRange = text.match(/単価\s*[:：]\s*([\d.]+)\s*[〜～~\-−]\s*([\d.]+)\s*万円/);
  if (monthlyManEnLabelRange) {
    const val = Math.round(parseFloat(monthlyManEnLabelRange[1]) * 10000);
    if (!isNaN(val)) return { price: val, priceType: "monthly" };
  }

  // 「32〜35万円」万円範囲（ラベルなし）
  const monthlyManEnRange = text.match(/([\d.]+)\s*[〜～~\-−]\s*([\d.]+)\s*万円/);
  if (monthlyManEnRange) {
    const val = Math.round(parseFloat(monthlyManEnRange[1]) * 10000);
    if (!isNaN(val)) return { price: val, priceType: "monthly" };
  }

  // 「単価：330,000円〜350,000円（スキル見合い）」円単位の範囲
  const monthlyCircleRange = text.match(/単価\s*[:：]\s*([\d,，]+)\s*円\s*[〜～~\-−]\s*([\d,，]+)\s*円/);
  if (monthlyCircleRange) {
    const val = parseInt(monthlyCircleRange[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val >= 10000) return { price: val, priceType: "monthly" };
  }

  // 「単価：330,000円（目安）」単一値
  const monthlySingleLabel = text.match(/単価\s*[:：]\s*([\d,，]+)\s*円/);
  if (monthlySingleLabel) {
    const val = parseInt(monthlySingleLabel[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val >= 10000) return { price: val, priceType: "monthly" };
  }

  // 「月額XX万円」
  const monthlyManEn = text.match(/月額\s*([\d.]+)\s*万円/);
  if (monthlyManEn) {
    const val = Math.round(parseFloat(monthlyManEn[1]) * 10000);
    if (!isNaN(val)) return { price: val, priceType: "monthly" };
  }

  // 「XX万円/月」
  const monthlyPerMonth = text.match(/([\d.]+)\s*万円\s*[\/／]\s*月/);
  if (monthlyPerMonth) {
    const val = Math.round(parseFloat(monthlyPerMonth[1]) * 10000);
    if (!isNaN(val)) return { price: val, priceType: "monthly" };
  }

  // 「XXX,000円/月」
  const monthlyCirclePerMonth = text.match(/([\d,，]+)\s*円\s*[\/／]\s*月/);
  if (monthlyCirclePerMonth) {
    const val = parseInt(monthlyCirclePerMonth[1].replace(/[,，]/g, ""), 10);
    if (!isNaN(val) && val >= 10000) return { price: val, priceType: "monthly" };
  }

  return { price: null, priceType: null };
}

// ===== 勤務地マッチング =====

const REMOTE_PATTERNS = [
  /フルリモ|フルリモート|完全リモート|在宅.*可|リモート.*可|テレワーク/,
  /remote.*ok|fully\s*remote/i,
];

const LOCATION_LABEL_PATTERNS = [
  /勤務地\s*[:：]\s*(.+?)(?:\n|$)/,
  /就業場所\s*[:：]\s*(.+?)(?:\n|$)/,
  /作業場所\s*[:：]\s*(.+?)(?:\n|$)/,
  /稼働\s*[:：]\s*(.+?)(?:\n|$)/,
];

function extractLocationFromText(text: string): string | null {
  for (const pattern of LOCATION_LABEL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const loc = match[1].trim();
      if (loc.length > 0 && loc.length < 50) return loc;
    }
  }
  return null;
}

function isRemote(text: string): boolean {
  return REMOTE_PATTERNS.some((p) => p.test(text));
}

function matchLocation(
  condition: string | undefined,
  text: string
): { match: "remote" | "exact" | "in_range" | "warning" | "unknown" | "excluded"; message?: string } {
  if (!condition) return { match: "in_range" };

  const condLower = condition.toLowerCase();
  const textLower = text.toLowerCase();

  // リモート希望
  if (/リモート|remote/i.test(condition)) {
    if (isRemote(text)) return { match: "remote" };
    return { match: "warning", message: "リモート希望ですが、出社が必要な可能性があります" };
  }

  // フルリモート案件は常にOK
  if (isRemote(text)) return { match: "remote" };

  // 都道府県・地名マッチ
  const prefectures = ["東京", "神奈川", "大阪", "愛知", "福岡", "北海道", "京都", "兵庫", "埼玉", "千葉"];
  for (const pref of prefectures) {
    if (condLower.includes(pref) && textLower.includes(pref)) return { match: "exact" };
  }

  // 関東・関西エリア
  const kantoPrefs = ["東京", "神奈川", "埼玉", "千葉", "茨城", "栃木", "群馬"];
  const kansaiPrefs = ["大阪", "京都", "兵庫", "奈良", "滋賀", "和歌山"];
  if (/関東/.test(condition) && kantoPrefs.some((p) => textLower.includes(p))) return { match: "in_range" };
  if (/関西/.test(condition) && kansaiPrefs.some((p) => textLower.includes(p))) return { match: "in_range" };

  return { match: "unknown" };
}

// ===== 稼働時間パース =====

function parseWorkHours(workHours: string): number | null {
  const match = workHours.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ===== 備考評価 =====

const REMARKS_TOPICS = {
  ng: [
    { keyword: "PC持参不可", pattern: /PC.*持参|自前.*PC|自己.*PC/ },
    { keyword: "土日出社", pattern: /土日.*出社|週末.*出社/ },
    { keyword: "長期不可", pattern: /長期|1年以上/ },
  ],
  positive: [
    { keyword: "フルリモート", pattern: /フルリモ|フルリモート|完全リモート/ },
    { keyword: "週3以下", pattern: /週[1-3]日|週[1-3]回/ },
    { keyword: "土日休み", pattern: /土日祝|完全週休2日/ },
    { keyword: "SaaS", pattern: /SaaS/ },
    { keyword: "高単価", pattern: /高単価|単価高/ },
  ],
};

function evaluateRemarks(remarks: string | undefined, ankenText: string) {
  if (!remarks) return { score: 0, ngMatched: [] as string[], positiveMatched: [] as string[] };

  const ngMatched: string[] = [];
  const positiveMatched: string[] = [];
  let score = 0;

  for (const topic of REMARKS_TOPICS.ng) {
    if (new RegExp(topic.keyword, "i").test(remarks) && topic.pattern.test(ankenText)) {
      ngMatched.push(topic.keyword);
    }
  }

  for (const topic of REMARKS_TOPICS.positive) {
    if (new RegExp(topic.keyword, "i").test(remarks) && topic.pattern.test(ankenText)) {
      positiveMatched.push(topic.keyword);
      score += 10;
    }
  }

  return { score, ngMatched, positiveMatched };
}

// ===== キーワード辞書 =====

const ANKEN_KEYWORD_DICT: Array<{ label: string; patterns: RegExp[]; category: string }> = [
  { label: "IS（インサイドセールス）", patterns: [/インサイドセールス|\bIS\b|Inside\s*Sales/i], category: "営業形態" },
  { label: "FS（フィールドセールス）", patterns: [/フィールドセールス|\bFS\b|Field\s*Sales/i], category: "営業形態" },
  { label: "BDR", patterns: [/\bBDR\b|アウトバウンド/i], category: "営業形態" },
  { label: "SDR", patterns: [/\bSDR\b|インバウンド/i], category: "営業形態" },
  { label: "CS（カスタマーサクセス）", patterns: [/カスタマーサクセス|\bCS\b|Customer\s*Success/i], category: "営業形態" },
  { label: "新規開拓", patterns: [/新規開拓|新規顧客|新規獲得/i], category: "営業形態" },
  { label: "テレアポ", patterns: [/テレアポ|電話営業|コールセンター/i], category: "営業形態" },
  { label: "反響営業", patterns: [/反響営業/i], category: "営業形態" },
  { label: "アップセル・クロスセル", patterns: [/アップセル|クロスセル/i], category: "営業形態" },
  { label: "SaaS", patterns: [/\bSaaS\b/i], category: "商材・業種" },
  { label: "無形商材", patterns: [/無形商材/i], category: "商材・業種" },
  { label: "HR・人材サービス", patterns: [/\bHR\b|人材サービス|人材紹介|求人/i], category: "商材・業種" },
  { label: "不動産・不動産DX", patterns: [/不動産/i], category: "商材・業種" },
  { label: "保険・金融", patterns: [/保険|金融|フィンテック/i], category: "商材・業種" },
  { label: "AI・機械学習", patterns: [/\bAI\b|人工知能|機械学習/i], category: "商材・業種" },
  { label: "法務・LegalTech", patterns: [/法務|\bLegalTech\b|弁護士/i], category: "商材・業種" },
  { label: "車両・自動車", patterns: [/車両|自動車|車販|車買取/i], category: "商材・業種" },
  { label: "DX・デジタル化", patterns: [/\bDX\b|デジタル化/i], category: "商材・業種" },
  { label: "医療・ヘルスケア", patterns: [/医療|ヘルスケア/i], category: "商材・業種" },
  { label: "光回線・通信", patterns: [/光回線|通信|テレコム/i], category: "商材・業種" },
  { label: "クラウド・インフラ", patterns: [/クラウド|\bAWS\b|\bGCP\b|\bAzure\b/i], category: "商材・業種" },
  { label: "Salesforce", patterns: [/Salesforce|\bSFA\b|\bCRM\b/i], category: "ツール" },
  { label: "HubSpot", patterns: [/HubSpot/i], category: "ツール" },
  { label: "Slack・Teams", patterns: [/\bSlack\b|\bTeams\b/i], category: "ツール" },
  { label: "エンタープライズ営業", patterns: [/エンタープライズ|大手企業|中堅大手/i], category: "営業スタイル" },
  { label: "ABM", patterns: [/\bABM\b|アカウントベースド/i], category: "営業スタイル" },
  { label: "マネジメント・リーダー", patterns: [/マネジメント|リーダー|チームリード/i], category: "営業スタイル" },
];

export function detectAnkenKeywords(text: string): Array<{ label: string; category: string }> {
  const detected: Array<{ label: string; category: string }> = [];
  for (const entry of ANKEN_KEYWORD_DICT) {
    if (entry.patterns.some((p) => p.test(text))) {
      detected.push({ label: entry.label, category: entry.category });
    }
  }
  return detected;
}

// ===== メインマッチング =====

export async function runMatching(
  condition: SearchCondition,
  skillProfile: SkillProfile | null
): Promise<MatchResult> {
  const ankenList = await fetchAnkenFromSheet();
  const { matched, excluded } = matchAnken(ankenList, condition, skillProfile);
  return {
    matched,
    excluded,
    totalCount: matched.length,
    mustRelaxed: false,
    skillSummary: skillProfile?.summary,
  };
}

function matchAnken(
  ankenList: AnkenData[],
  condition: SearchCondition,
  skillProfile: SkillProfile | null
): { matched: AnkenResult[]; excluded: ExcludedAnken[] } {
  const matched: AnkenResult[] = [];
  const excluded: ExcludedAnken[] = [];

  for (const anken of ankenList) {
    const text = anken.fullText;
    const warnings: WarningType[] = [];
    const warningMessages: string[] = [];
    let score = 50;
    let isExcluded = false;
    let excludeReason: ExcludedAnken["excludeReason"] | null = null;
    let excludeReasonMessage = "";

    // 単価チェック
    const { price: extractedPrice, priceType: extractedPriceType } = extractPrice(text);

    if (condition.priceType && condition.minPrice) {
      if (extractedPriceType === null) {
        warnings.push("price_unknown");
        warningMessages.push("単価が案件本文から確認できませんでした");
      } else if (extractedPriceType !== condition.priceType) {
        isExcluded = true;
        excludeReason = "price_mismatch";
        excludeReasonMessage = `単価種別が一致しません（案件: ${extractedPriceType === "hourly" ? "時給" : "月額"}, 条件: ${condition.priceType === "hourly" ? "時給" : "月額"}）`;
      } else if (extractedPrice !== null && extractedPrice < condition.minPrice) {
        isExcluded = true;
        excludeReason = "price_mismatch";
        excludeReasonMessage = `単価が最低条件を下回ります（案件: ${extractedPrice.toLocaleString()}円, 条件: ${condition.minPrice.toLocaleString()}円以上）`;
      } else if (extractedPrice !== null) {
        const excess = (extractedPrice - condition.minPrice) / condition.minPrice;
        score += Math.min(20, Math.floor(excess * 100));
      }
    }

    if (isExcluded) {
      excluded.push({ id: anken.id, name: anken.name, fullText: anken.fullText, excludeReason: excludeReason!, excludeReasonMessage });
      continue;
    }

    // 勤務地チェック
    const locationResult = matchLocation(condition.location, text);
    const extractedLocation = extractLocationFromText(text);

    if (locationResult.match === "excluded") {
      score -= 30;
      warnings.push("location_out_of_range");
      if (locationResult.message) warningMessages.push(locationResult.message);
    } else if (locationResult.match === "warning") {
      warnings.push("location_out_of_range");
      if (locationResult.message) warningMessages.push(locationResult.message);
      score -= 10;
    } else if (locationResult.match === "unknown") {
      warnings.push("location_unknown");
    } else if (locationResult.match === "remote") {
      score += 5;
    } else if (locationResult.match === "exact") {
      score += 10;
    }

    // 備考チェック
    const remarksResult = evaluateRemarks(condition.remarks, text);
    if (remarksResult.ngMatched.length > 0) {
      isExcluded = true;
      excludeReason = "remarks_ng";
      excludeReasonMessage = `備考のNGキーワードに合致しました: ${remarksResult.ngMatched.join(", ")}`;
    } else {
      score += remarksResult.score;
    }

    if (isExcluded) {
      excluded.push({ id: anken.id, name: anken.name, fullText: anken.fullText, excludeReason: excludeReason!, excludeReasonMessage });
      continue;
    }

    // スキルマッチング
    if (skillProfile) {
      for (const skill of skillProfile.skills) {
        if (new RegExp(skill, "i").test(text)) score += 5;
      }
    }

    // キーワード自動検出
    const detectedKeywords = detectAnkenKeywords(text);
    if (!skillProfile && detectedKeywords.length > 0) {
      score += Math.min(10, detectedKeywords.length * 2);
    }

    score = Math.max(0, Math.min(100, score));

    // マッチ理由生成
    const matchReasonParts: string[] = [];
    const matchReasonDetailParts: string[] = [];

    if (extractedPrice != null && condition.minPrice && extractedPriceType === condition.priceType) {
      const unit = extractedPriceType === "hourly" ? "円/時" : "円/月";
      matchReasonParts.push(`単価${extractedPrice.toLocaleString()}${unit}`);
      matchReasonDetailParts.push(`✅ 単価: ${extractedPrice.toLocaleString()}${unit}（条件: ${condition.minPrice.toLocaleString()}${unit}以上）`);
    } else if (extractedPrice != null) {
      const unit = extractedPriceType === "hourly" ? "円/時" : "円/月";
      matchReasonDetailParts.push(`ℹ️ 単価: ${extractedPrice.toLocaleString()}${unit}`);
    }

    if (locationResult.match === "remote") {
      matchReasonParts.push("フルリモート");
      matchReasonDetailParts.push("✅ 勤務地: フルリモート対応");
    } else if (locationResult.match === "exact" && extractedLocation) {
      matchReasonParts.push(extractedLocation.substring(0, 10));
      matchReasonDetailParts.push(`✅ 勤務地: ${extractedLocation}（希望地と一致）`);
    } else if (locationResult.match === "warning" && locationResult.message) {
      matchReasonDetailParts.push(`⚠️ 勤務地: ${locationResult.message}`);
    }

    if (skillProfile && skillProfile.skills.length > 0) {
      const matchedSkills = skillProfile.skills.filter((skill) => new RegExp(skill, "i").test(text));
      if (matchedSkills.length > 0) {
        matchReasonParts.push(`スキル${matchedSkills.length}項一致`);
        matchReasonDetailParts.push(`✅ スキルマッチ: ${matchedSkills.slice(0, 5).join("、")}`);
      }
      const unmatchedSkills = skillProfile.skills.filter((skill) => !new RegExp(skill, "i").test(text));
      if (unmatchedSkills.length > 0) {
        matchReasonDetailParts.push(`ℹ️ 未一致スキル: ${unmatchedSkills.slice(0, 3).join("、")}`);
      }
    }

    if (detectedKeywords.length > 0) {
      const byCategory: Record<string, string[]> = {};
      for (const kw of detectedKeywords) {
        if (!byCategory[kw.category]) byCategory[kw.category] = [];
        byCategory[kw.category].push(kw.label);
      }
      const topCategories = ["営業形態", "商材・業種", "ツール", "営業スタイル"];
      const cardKeywords: string[] = [];
      for (const cat of topCategories) {
        if (byCategory[cat] && !skillProfile) {
          cardKeywords.push(...byCategory[cat].slice(0, 1));
          if (cardKeywords.length >= 2) break;
        }
      }
      if (!skillProfile && cardKeywords.length > 0) matchReasonParts.push(cardKeywords.join("・"));
      for (const [cat, labels] of Object.entries(byCategory)) {
        matchReasonDetailParts.push(`ℹ️ ${cat}: ${labels.join("、")}`);
      }
    }

    if (remarksResult.positiveMatched.length > 0) {
      matchReasonParts.push(remarksResult.positiveMatched[0]);
      matchReasonDetailParts.push(`✅ 希望条件: ${remarksResult.positiveMatched.join("、")}`);
    }

    if (score < 40) {
      matchReasonDetailParts.push("⚠️ スコアが低いため、条件に完全にはマッチしていない可能性があります");
    }

    const matchReason = matchReasonParts.length > 0
      ? matchReasonParts.join("・")
      : score >= 70 ? "条件に適合しています" : score >= 40 ? "部分的にマッチしています" : "参考情報として表示";

    matched.push({
      id: anken.id,
      name: anken.name,
      fullText: anken.fullText,
      score,
      warnings,
      warningMessages,
      extractedLocation: extractedLocation ?? undefined,
      extractedPriceType: extractedPriceType ?? undefined,
      extractedPrice: extractedPrice ?? undefined,
      matchReason,
      matchReasonDetail: matchReasonDetailParts.length > 0 ? matchReasonDetailParts.join("\n") : undefined,
    });
  }

  matched.sort((a, b) => b.score - a.score);
  return { matched, excluded };
}
