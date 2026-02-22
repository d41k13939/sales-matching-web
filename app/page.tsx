"use client";

import { useState, useRef, useCallback } from "react";
import type { MatchResult, AnkenResult, ExcludedAnken, ConditionBadge } from "@/lib/matching";

type PriceType = "hourly" | "monthly";

interface SearchForm {
  location: string;
  priceType: PriceType;
  minPrice: string;
  workHours: string;
  workTimeZone: string;
  startDate: string;
  remarks: string;
}

const INITIAL_FORM: SearchForm = {
  location: "",
  priceType: "hourly",
  minPrice: "",
  workHours: "",
  workTimeZone: "",
  startDate: "",
  remarks: "",
};

export default function HomePage() {
  const [form, setForm] = useState<SearchForm>(INITIAL_FORM);
  const [skillFile, setSkillFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnken, setSelectedAnken] = useState<AnkenResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState<"name" | "full" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedIds(new Set());
    setSelectMode(null);

    try {
      let skillSheetBase64: string | undefined;
      let skillSheetFileName: string | undefined;

      if (skillFile) {
        const buf = await skillFile.arrayBuffer();
        skillSheetBase64 = Buffer.from(buf).toString("base64");
        skillSheetFileName = skillFile.name;
      }

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          minPrice: form.minPrice ? Number(form.minPrice) : undefined,
          skillSheetBase64,
          skillSheetFileName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "検索に失敗しました");
      }

      const data: MatchResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // fullTextの先頭にnameが重複している場合はnameを付加しない
  const buildFullText = (name: string, fullText: string): string => {
    const trimmedFull = fullText.trim();
    const trimmedName = name.trim();
    // fullTextがnameで始まる場合はfullTextをそのまま使う
    if (trimmedFull.startsWith(trimmedName)) return trimmedFull;
    return `${trimmedName}\n${trimmedFull}`;
  };

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label}をコピーしました`);
    } catch {
      showToast("コピーに失敗しました");
    }
  }, [showToast]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopySelected = async () => {
    if (!result || selectedIds.size === 0) return;
    const items = result.matched.filter((a) => selectedIds.has(a.id));
    if (selectMode === "name") {
      const text = items.map((a) => a.name).join("\n");
      await copyToClipboard(text, `案件名 ${items.length}件`);
    } else {
      const text = items.map((a) => buildFullText(a.name, a.fullText)).join("\n\n---\n\n");
      await copyToClipboard(text, `案件全文 ${items.length}件`);
    }
    setSelectMode(null);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (!result) return;
    if (selectedIds.size === result.matched.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(result.matched.map((a) => a.id)));
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 50) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const scoreLabel = (score: number) => {
    if (score >= 70) return "高マッチ";
    if (score >= 50) return "中マッチ";
    return "参考";
  };

  const badgeStyle = (status: ConditionBadge["status"]) => {
    if (status === "match") return "bg-green-50 text-green-700 border-green-200";
    if (status === "warn") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-500 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">案</div>
          <h1 className="text-lg font-bold text-gray-900">株式会社Salesaurus 案件選定🦖</h1>
          <div className="ml-auto flex items-center gap-3">
            {result && (
              <span className="text-sm text-gray-500">
                {result.totalCount}件マッチ / {result.excluded.length}件除外
              </span>
            )}
            <a
              href="/manual"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
            >
              📖 使い方
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* 検索フォーム */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">検索条件</h2>

            {/* スキルシート */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">スキルシート（任意）</label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {skillFile ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">{skillFile.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSkillFile(null); }}
                      className="text-gray-400 hover:text-red-500 ml-2 text-lg leading-none"
                    >×</button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">PDF / CSV / Excel をドロップまたはクリック</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => setSkillFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* 勤務地 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">勤務地</label>
              <input
                type="text"
                placeholder="例: 東京、リモート"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 単価 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">単価</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setForm({ ...form, priceType: "hourly" })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.priceType === "hourly"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >時給</button>
                <button
                  onClick={() => setForm({ ...form, priceType: "monthly" })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.priceType === "monthly"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >月額</button>
              </div>
              <input
                type="number"
                placeholder={form.priceType === "hourly" ? "例: 2000" : "例: 400000"}
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.priceType === "hourly" ? "時給（円）の最低金額" : "月額（円）の最低金額"}
              </p>
            </div>

            {/* 月稼働時間 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">月稼働時間</label>
              <input
                type="text"
                placeholder="例: 160、160h、160〜180"
                value={form.workHours}
                onChange={(e) => setForm({ ...form, workHours: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 稼働時間帯 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">稼働時間帯</label>
              <input
                type="text"
                placeholder="例: 9:00〜18:00、フレックス"
                value={form.workTimeZone}
                onChange={(e) => setForm({ ...form, workTimeZone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 開始日 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input
                type="text"
                placeholder="例: 2025年4月、即日、4月〜"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 備考 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">備考・NG条件</label>
              <textarea
                placeholder="例: PC貸与希望、残業なし希望、土日休み希望"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  検索中...
                </>
              ) : "🔍 案件を検索"}
            </button>

            {/* スキルシート利用時のAPI料金注意書き */}
            {skillFile && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  <span className="font-bold">⚠️ ご協力のお願い：</span>スキルシートを使った検索はAI解析のため弊社にAPI利用料が発生します。弊社都合で大変恐縮ですが、本当に必要なときだけご利用いただけますと大変助かります🙏
                </p>
              </div>
            )}
            {!skillFile && (
              <p className="mt-2 text-xs text-center text-gray-400">
                ※ スキルシートを使った検索は弊社にAPI料金が発生します。<br />必要なときだけご利用いただけますと幸いです🙏
              </p>
            )}
          </div>
        </aside>

        {/* 検索結果 */}
        <main className="flex-1 min-w-0">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {!result && !loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-base">左の検索条件を入力して<br />「案件を検索」を押してください</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <div className="animate-spin text-4xl mb-3">⏳</div>
              <p>案件を検索中です...</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* 結果ヘッダー */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-lg font-bold text-gray-900">{result.totalCount}件</span>
                    <span className="text-sm text-gray-500 ml-2">マッチしました</span>
                    {result.skillSummary && (
                      <p className="text-xs text-gray-500 mt-1">スキル: {result.skillSummary}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => { setSelectMode("name"); setSelectedIds(new Set()); }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 transition-colors"
                    >📋 案件名をコピー</button>
                    <button
                      onClick={() => { setSelectMode("full"); setSelectedIds(new Set()); }}
                      className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg border border-green-200 transition-colors"
                    >📄 全文をコピー</button>
                  </div>
                </div>

                {/* 選択モード */}
                {selectMode && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-yellow-800 font-medium">
                        {selectMode === "name" ? "📋 案件名コピーモード" : "📄 全文コピーモード"}
                      </span>
                      <span className="text-sm text-yellow-700">— タップして選択 ({selectedIds.size}件選択中)</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:underline">
                        {selectedIds.size === result.matched.length ? "全解除" : "全選択"}
                      </button>
                      <button
                        onClick={handleCopySelected}
                        disabled={selectedIds.size === 0}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
                      >コピー実行</button>
                      <button
                        onClick={() => { setSelectMode(null); setSelectedIds(new Set()); }}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                      >キャンセル</button>
                    </div>
                  </div>
                )}
              </div>

              {/* 案件一覧 */}
              <div className="space-y-3 mb-4">
                {result.matched.map((anken) => (
                  <div
                    key={anken.id}
                    className={`rounded-xl border transition-all cursor-pointer ${
                      selectMode
                        ? selectedIds.has(anken.id)
                          ? "border-blue-500 ring-2 ring-blue-200 bg-white"
                          : anken.score >= 70
                            ? "border-emerald-200 bg-emerald-50 hover:border-emerald-400"
                            : "border-gray-200 bg-white hover:border-blue-300"
                        : anken.score >= 70
                          ? "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    }`}
                    onClick={() => {
                      if (selectMode) toggleSelect(anken.id);
                      else setSelectedAnken(anken);
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {selectMode && (
                          <div className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                            selectedIds.has(anken.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                          }`}>
                            {selectedIds.has(anken.id) && <span className="text-white text-xs">✓</span>}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{anken.name}</h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${scoreColor(anken.score)}`}>
                                {scoreLabel(anken.score)}
                              </span>
                              {!selectMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(anken.name, "案件名");
                                  }}
                                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                                  title="案件名をコピー"
                                >案件名</button>
                              )}
                            </div>
                          </div>

                          {/* 条件一致バッジ */}
                          {anken.conditionBadges && anken.conditionBadges.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {anken.conditionBadges.map((badge, i) => (
                                <span
                                  key={i}
                                  className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${badgeStyle(badge.status)}`}
                                >
                                  {badge.label}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 警告 */}
                          {anken.warningMessages.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {anken.warningMessages.map((msg, i) => (
                                <p key={i} className="text-xs text-amber-600">⚠️ {msg}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 除外案件 */}
              {result.excluded.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <button
                    onClick={() => setShowExcluded(!showExcluded)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 w-full"
                  >
                    <span>{showExcluded ? "▼" : "▶"}</span>
                    除外された案件 ({result.excluded.length}件)
                  </button>
                  {showExcluded && (
                    <div className="mt-3 space-y-2">
                      {result.excluded.map((anken) => (
                        <div key={anken.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700">{anken.name}</p>
                          <p className="text-xs text-red-600 mt-1">🚫 {anken.excludeReasonMessage}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 案件詳細モーダル */}
      {selectedAnken && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAnken(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="flex items-start justify-between p-5 border-b border-gray-200">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-base font-bold text-gray-900 leading-snug">{selectedAnken.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAnken.extractedPrice != null && (
                    <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                      💴 {selectedAnken.extractedPrice.toLocaleString()}円/{selectedAnken.extractedPriceType === "hourly" ? "時" : "月"}
                    </span>
                  )}
                  {selectedAnken.extractedLocation && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      📍 {selectedAnken.extractedLocation}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyToClipboard(buildFullText(selectedAnken.name, selectedAnken.fullText), "全文")}
                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg border border-green-200 transition-colors whitespace-nowrap"
                >📄 全文をコピー</button>
                <button
                  onClick={() => setSelectedAnken(null)}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                  aria-label="閉じる"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* モーダルボディ */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* マッチ理由詳細 */}
              {selectedAnken.matchReasonDetail && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">🎯 マッチ理由</h3>
                  <div className="space-y-1">
                    {selectedAnken.matchReasonDetail.split("\n").map((line, i) => (
                      <p key={i} className="text-sm text-blue-900">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* 警告 */}
              {selectedAnken.warningMessages.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">⚠️ 注意事項</h3>
                  {selectedAnken.warningMessages.map((msg, i) => (
                    <p key={i} className="text-sm text-amber-700">{msg}</p>
                  ))}
                </div>
              )}

              {/* 全文 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">案件全文</h3>
                  <button
                    onClick={() => copyToClipboard(selectedAnken.fullText, "案件全文")}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >本文のみコピー</button>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-200 leading-relaxed">
                  {selectedAnken.fullText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* トースト通知 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-50 transition-all">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
