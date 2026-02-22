export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">案</div>
          <h1 className="text-lg font-bold text-gray-900">株式会社Salesaurus 案件選定🦖 — 使い方マニュアル</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-12">

        {/* はじめに */}
        <section>
          <div className="bg-blue-600 text-white rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">🦖</div>
            <h2 className="text-2xl font-bold mb-2">案件選定ツール 使い方ガイド</h2>
            <p className="text-blue-100 text-sm">このツールは、あなたの希望条件に合った案件を自動で探してくれます。<br />難しい操作は一切ありません！</p>
          </div>
        </section>

        {/* 目次 */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📋 目次</h2>
          <ol className="space-y-2 text-sm text-blue-600">
            <li><a href="#step1" className="hover:underline">① 画面の見かた</a></li>
            <li><a href="#step2" className="hover:underline">② 条件を入力してみよう</a></li>
            <li><a href="#step3" className="hover:underline">③ 検索結果の見かた（バッジの意味）</a></li>
            <li><a href="#step4" className="hover:underline">④ 案件の詳細を見てみよう</a></li>
            <li><a href="#step5" className="hover:underline">⑤ 案件名をコピーしよう</a></li>
            <li><a href="#step6" className="hover:underline">⑥ スキルシートを使った検索（上級）</a></li>
            <li><a href="#tips" className="hover:underline">💡 よくある質問・コツ</a></li>
          </ol>
        </section>

        {/* STEP 1 */}
        <section id="step1" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">1</div>
            <h2 className="text-xl font-bold text-gray-900">画面の見かた</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <img src="/manual/screen_01_initial.webp" alt="初期画面" className="w-full" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-sm text-gray-700 font-medium">画面は大きく <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">左側</span> と <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">右側</span> に分かれています。</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="font-bold text-blue-700 mb-1">📝 左側：検索条件</div>
                <p className="text-gray-600 text-xs">希望する条件（勤務地・単価・時間など）を入力する場所です。</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="font-bold text-green-700 mb-1">📊 右側：検索結果</div>
                <p className="text-gray-600 text-xs">条件に合った案件の一覧が表示されます。</p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 2 */}
        <section id="step2" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">2</div>
            <h2 className="text-xl font-bold text-gray-900">条件を入力してみよう</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <img src="/manual/screen_02_form_filled.webp" alt="条件入力済み" className="w-full" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm text-gray-700">左側のフォームに希望条件を入力します。<strong>全部入力しなくてもOK</strong>です！入力した条件だけで検索してくれます。</p>

            <div className="space-y-3">
              {[
                { label: "勤務地", example: "リモート　または　東京", desc: "「リモート」と入力すると、フルリモート案件だけを検索できます" },
                { label: "単価", example: "2000（時給）　または　300000（月額）", desc: "「時給」か「月額」のボタンを選んでから金額を入力してください" },
                { label: "月稼働時間", example: "160　または　80〜160", desc: "1ヶ月に働きたい時間の目安を入力します" },
                { label: "稼働時間帯", example: "9:00〜18:00　または　フレックス", desc: "働きたい時間帯を入力します" },
                { label: "開始日", example: "即日　または　2025年4月", desc: "いつから働けるかを入力します" },
                { label: "備考・NG条件", example: "PC貸与希望、残業なし希望", desc: "その他の希望や絶対に嫌な条件を入力します。読点（、）で区切って複数入力できます" },
              ].map((item) => (
                <div key={item.label} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded mt-0.5 flex-shrink-0">{item.label}</span>
                    <div>
                      <p className="text-xs text-blue-600 font-mono mb-0.5">例: {item.example}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-800 mb-1">✅ 入力したら「🔍 案件を検索」ボタンを押してください！</p>
              <p className="text-xs text-blue-600">数秒で結果が表示されます。</p>
            </div>
          </div>
        </section>

        {/* STEP 3 */}
        <section id="step3" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">3</div>
            <h2 className="text-xl font-bold text-gray-900">検索結果の見かた（バッジの意味）</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <img src="/manual/screen_03_results.webp" alt="検索結果" className="w-full" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm text-gray-700">各案件カードには、条件との一致状況を示す<strong>カラーバッジ</strong>が表示されます。</p>

            {/* マッチ度バッジ */}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-2">🎯 マッチ度（右上のバッジ）</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">高マッチ</span>
                  <p className="text-xs text-gray-600">入力した条件とよく合っています。優先的に確認しましょう！</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                  <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">中マッチ</span>
                  <p className="text-xs text-gray-600">一部の条件に合っています。詳細を確認してみましょう。</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">低マッチ</span>
                  <p className="text-xs text-gray-600">条件との一致が少ないです。参考程度にご確認ください。</p>
                </div>
              </div>
            </div>

            {/* 条件バッジ */}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-2">🏷️ 条件バッジ（案件カード内の小さいバッジ）</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-300 flex-shrink-0">✓ PC貸与</span>
                  <div>
                    <p className="text-xs font-bold text-green-700">緑バッジ = 条件に一致！</p>
                    <p className="text-xs text-gray-600">案件の説明文に、この条件が明記されています。</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-300 flex-shrink-0">? PC貸与</span>
                  <div>
                    <p className="text-xs font-bold text-yellow-700">黄バッジ = 要確認</p>
                    <p className="text-xs text-gray-600">案件の説明文に記載が見つかりませんでした。担当者に確認が必要です。</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-300 flex-shrink-0">🏠 フルリモート</span>
                  <div>
                    <p className="text-xs font-bold text-blue-700">青バッジ = 参考情報</p>
                    <p className="text-xs text-gray-600">案件の基本情報（勤務地・単価など）を表示しています。</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-300 flex-shrink-0">⚠️ 単価不明</span>
                  <div>
                    <p className="text-xs font-bold text-red-700">赤バッジ = 注意</p>
                    <p className="text-xs text-gray-600">案件の説明文から情報が読み取れませんでした。詳細確認が必要です。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-800 mb-1">💡 ポイント</p>
              <p className="text-xs text-amber-700">「PC貸与」など備考欄に入力した条件は、案件の説明文に<strong>明示的な記載がある場合のみ</strong>緑バッジになります。記載がない場合は黄バッジ（要確認）になります。PC貸与なしと書いてある案件も黄バッジになるので、詳細を必ず確認してください。</p>
            </div>
          </div>
        </section>

        {/* STEP 4 */}
        <section id="step4" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">4</div>
            <h2 className="text-xl font-bold text-gray-900">案件の詳細を見てみよう</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <img src="/manual/screen_04_modal.webp" alt="詳細モーダル" className="w-full" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-sm text-gray-700">案件カードをクリックすると、<strong>詳細ポップアップ</strong>が開きます。</p>
            <div className="space-y-2">
              {[
                { icon: "🎯", title: "マッチ理由", desc: "なぜこの案件がおすすめなのか、理由が表示されます" },
                { icon: "📄", title: "案件全文", desc: "案件の説明文が全部読めます" },
                { icon: "📋", title: "全文をコピー", desc: "案件の全文をコピーできます（担当者への共有に便利）" },
                { icon: "✅❌", title: "条件チェック", desc: "入力した備考条件が一致しているか、要確認かが詳しく表示されます" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 rounded-xl p-3 text-xs text-gray-600">
              <strong>閉じるには：</strong>右上の「✕」ボタンを押すか、ポップアップの外側をクリックしてください。
            </div>
          </div>
        </section>

        {/* STEP 5 */}
        <section id="step5" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">5</div>
            <h2 className="text-xl font-bold text-gray-900">案件名をコピーしよう</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm text-gray-700">気になる案件を複数選んで、まとめてコピーできます。</p>

            <div className="space-y-3">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-2">📋 案件名だけコピーする場合</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>結果一覧の上にある「📋 案件名をコピー」ボタンを押す</li>
                  <li>コピーしたい案件カードをタップして選択（青くなります）</li>
                  <li>もう一度「📋 案件名をコピー」ボタンを押すとコピー完了！</li>
                </ol>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-2">📄 案件の全文をコピーする場合</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>結果一覧の上にある「📄 全文をコピー」ボタンを押す</li>
                  <li>コピーしたい案件カードをタップして選択</li>
                  <li>もう一度「📄 全文をコピー」ボタンを押すとコピー完了！</li>
                </ol>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-2">⚡ 1件だけすぐコピーする場合</p>
                <p className="text-xs text-gray-600">各案件カードの右側にある「案件名」ボタンを押すと、その案件名だけをすぐコピーできます。</p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 6 */}
        <section id="step6" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">6</div>
            <h2 className="text-xl font-bold text-gray-900">スキルシートを使った検索（上級）</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm text-gray-700">スキルシート（PDF・Excel・CSV形式）をアップロードすると、AIが自動でスキルを読み取って、より精度の高いマッチングをしてくれます。</p>

            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                <span className="text-xl flex-shrink-0">📁</span>
                <div>
                  <p className="text-sm font-bold text-purple-800">対応ファイル形式</p>
                  <p className="text-xs text-gray-600">PDF、Excel（.xlsx / .xls）、CSV</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                <span className="text-xl flex-shrink-0">🤖</span>
                <div>
                  <p className="text-sm font-bold text-purple-800">AIが読み取ること</p>
                  <p className="text-xs text-gray-600">営業経験・スキル・業界知識などを自動で抽出し、案件との相性を判断します</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-800 mb-2">⚠️ ご協力のお願い</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                スキルシートをアップロードして検索する場合、AIによる解析のためにシステム側でAPI利用料が発生します。弊社都合で大変恐縮ですが、<strong>スキルシートを使った検索は本当に必要なときだけ</strong>ご利用いただけますと大変助かります。通常の条件入力だけでも十分な検索ができますので、まずは条件入力での検索をお試しください🙏
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-800">使い方</p>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>「スキルシート（任意）」の点線エリアをクリック</li>
                <li>ファイルを選択してアップロード</li>
                <li>他の条件も必要に応じて入力</li>
                <li>「🔍 案件を検索」ボタンを押す</li>
              </ol>
            </div>
          </div>
        </section>

        {/* よくある質問 */}
        <section id="tips" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💡</div>
            <h2 className="text-xl font-bold text-gray-900">よくある質問・コツ</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "条件を何も入力しないで検索するとどうなりますか？",
                a: "全案件が表示されます。まずは全件見てみたいときに便利です。",
              },
              {
                q: "「除外された案件」とは何ですか？",
                a: "入力したNG条件に引っかかった案件です。結果一覧の下にある「▶ 除外された案件」をクリックすると確認できます。",
              },
              {
                q: "備考欄に複数の条件を入力するには？",
                a: "読点（、）またはスペースで区切って入力してください。例：「PC貸与希望、残業なし希望、土日休み希望」",
              },
              {
                q: "「? PC貸与」（黄バッジ）の案件はPC貸与がないということですか？",
                a: "案件の説明文にPC貸与に関する記載が見つからなかった、ということです。PC貸与がないとは限りません。担当者に直接確認することをおすすめします。",
              },
              {
                q: "案件データはいつ更新されますか？",
                a: "スプレッドシートのデータが更新されると、次回の検索から反映されます。",
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-bold text-gray-800 mb-1">Q. {item.q}</p>
                <p className="text-sm text-gray-600">A. {item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* フッター */}
        <section className="text-center py-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            🦖 案件選定ツールに戻る
          </a>
          <p className="text-xs text-gray-400 mt-4">株式会社Salesaurus 案件選定ツール</p>
        </section>

      </main>
    </div>
  );
}
