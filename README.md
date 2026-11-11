# 🎮 TrendMiniGames Studio（時事ミニゲーム量産＆広告収益化ファクトリー）

## 1. 経営目標・基本戦略（CEO方針）
- **目標月間純利益**: **100,000円 / 月**（初期投資・固定費 0円）
- **コアコンセプト**:
  1. GitHubでMITライセンス等として公開されている「1分で遊べる超単純・高リプレイ性HTML5ミニゲーム」をベースエンジンとして標準化。
  2. 最新ニュース・SNS流行語に合わせて**「タイトル・ストーリー・キャラクター・背景・BGM（Web Audio API自動生成）・連動広告」だけをJSON定義で差し替え**、1秒で別ゲームとして量産・投稿する。
  3. 収益は**「インプレッション/クリック広告（忍者AdMax / Google AdSense）」＋「ゲームオーバー画面の文脈連動型アフィリエイト（A8.net / もしもアフィリエイト）」**のハイブリッド構造とし、さらに「PRチェックでスコア1.5倍ボーナス」のリワードギミックとA/Bテストにより高CTR・高RPMを実現する。

---

## 2. ディレクトリ構成
- [monetization.json](file:///c:/Users/user/projects/ミニゲーム投稿/config/monetization.json) : 金庫番（オーナー）用：広告枠ID・ASPメディアID・A/Bテスト設定ファイル
- [github_oss_games.json](file:///c:/Users/user/projects/ミニゲーム投稿/catalog/github_oss_games.json) : GitHub公開の1分ミニゲーム厳選カタログ（ライセンス・特徴・リスキン箇所）
- [trends_2026.json](file:///c:/Users/user/projects/ミニゲーム投稿/themes/trends_2026.json) : 時事ネタ×ゲームスキン×BGM×連動アフィリエイト定義データ
- [factory.py](file:///c:/Users/user/projects/ミニゲーム投稿/factory.py) : 全ゲーム一括ビルド・新トレンド追加・効果測定・自律PDCA改善CLI＆配信サーバー
- [dist/index.html](file:///c:/Users/user/projects/ミニゲーム投稿/dist/index.html) : 時事ミニゲーム総合ポータルサイト（ビルド成果物）
- [dist/dashboard.html](file:///c:/Users/user/projects/ミニゲーム投稿/dist/dashboard.html) : CEO効果測定＆自律PDCA経営ダッシュボード（ビルド成果物）

---

## 3. 稼働中の時事ミニゲーム第1弾ラインナップ（全6本・即プレイ可能）
1. **『ドパガキ進化論！メロい推し活スイカ』** ([プレイ画面](file:///c:/Users/user/projects/ミニゲーム投稿/dist/games/dopagaki-suika/index.html))
   - ベースエンジン: `suika`（落下＆合体物理パズル）
   - 時事ネタ: 2026年流行語「ドパガキ」「メロい」・推し活ブーム
   - 連動広告: 新作スマホRPG無料DL案件（A8/Smart-C）・蒸気ホットアイマスク（楽天/もしも）
2. **『AIハッカー迎撃！サイバー防衛2048』** ([プレイ画面](file:///c:/Users/user/projects/ミニゲーム投稿/dist/games/ai-cyber-2048/index.html))
   - ベースエンジン: `game2048`（60秒スライド進化パズル）
   - 時事ネタ: 2026年AI悪用サイバー攻撃急増・情報漏洩対策
   - 連動広告: NordVPN・ノートンIDアドバイザー（A8.net 高単価 ¥3,200〜¥4,500/件）
3. **『フレネミー回避！SNS裏アカ脱出フラッピー』** ([プレイ画面](file:///c:/Users/user/projects/ミニゲーム投稿/dist/games/frenemy-flappy/index.html))
   - ベースエンジン: `flappy`（1タップ障害物回避アクション）
   - 時事ネタ: 2026年流行語「フレネミー」・裏アカ・怪しい副業DM回避
   - 連動広告: コミックシーモア復讐マンガ70%OFF・上場企業ポイ活モッピー（A8.net）
4. **『冬の電力クライシス！節電＆GXキャッチパニック』** ([プレイ画面](file:///c:/Users/user/projects/ミニゲーム投稿/dist/games/winter-power-catcher/index.html))
   - ベースエンジン: `catcher`（60秒ハイスピード収集＆罠回避）
   - 時事ネタ: 今冬の電力需給対策・電気代高騰・GX/J-クレジット
   - 連動広告: 電気・ガス料金一括比較乗り換え・ポータブル電源（A8.net 高単価 ¥3,500〜¥4,000/件）
5. **『物価高騰バスターズ！値上げラッシュ60秒撃退』** ([プレイ画面](file:///c:/Users/user/projects/ミニゲーム投稿/dist/games/inflation-whack/index.html))
   - ベースエンジン: `whack`（60秒高速反射タップ撃退）
   - 時事ネタ: ステルス値上げ・物価高騰・実質賃金サバイバル
   - 連動広告: 年会費永年無料・高還元クレジットカード・ふるさと納税（A8.net 高単価 ¥5,000/件）
6. **『伝説の名車復活！日野コンテッサ＆日本車進化スイカ』** ([プレイ画面](file:///c:/Users/user/projects/ミニゲーム投稿/dist/games/contessa-car-suika/index.html))
   - ベースエンジン: `suika`（落下＆合体物理パズル）
   - 時事ネタ: 「日野コンテッサ1300クーペ」2026年日本自動車殿堂・歴史遺産車選定
   - 連動広告: MOTA車買取一括査定・インズウェブ自動車保険比較（A8.net 超高単価 ¥6,500/件）

---

## 4. 量産＆自律PDCAコマンド
```powershell
# 全ゲーム・ポータル・ダッシュボードを一括ビルド
python factory.py build

# 効果測定データの分析＆自律PDCA改善サイクルの実行
python factory.py pdca

# 新しい時事ワードから新規ミニゲームを1秒で生成＆ビルド
python factory.py new-trend --keyword "年末調整ハック" --engine game2048

# ローカル検証＆リアルタイム効果測定サーバー起動 (http://localhost:8080)
python factory.py serve --port 8080
```

---

## 5. 金庫番（オーナー様）に行っていただく作業（受取口座・ID設定のみ）
- **支払い（支出）**: **現在 0円**（承認や支払いは一切不要です）
- **受け取り（収益振込設定）**:
  1. **忍者AdMax**（審査なし・即日バナー収益）と **A8.net**（成果報酬アフィリエイト）に無料登録し、振込先銀行口座を設定してください。
  2. 発行された広告タグID・アフィリエイトリンクを [monetization.json](file:///c:/Users/user/projects/ミニゲーム投稿/config/monetization.json) および [trends_2026.json](file:///c:/Users/user/projects/ミニゲーム投稿/themes/trends_2026.json) の `url` 欄に貼り付けて `python factory.py build` を実行すると、全ゲームからあなたの口座へ広告収益が集計・振込されます。
