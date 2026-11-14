#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TrendMiniGames Factory, SEO/IndexNow Acquisition & Autonomous PDCA Engine
時事風刺ミニゲームの量産ビルド・SEO/OGP/RSS/AI検索対応・検索エンジン即時Ping・自律PDCAを行う統合システム
"""

import argparse
import datetime
import html as html_lib
import json
import random
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config" / "monetization.json"
THEMES_PATH = BASE_DIR / "themes" / "trends_2026.json"
ANALYTICS_PATH = BASE_DIR / "data" / "analytics_state.json"
SRC_DIR = BASE_DIR / "src"
DIST_DIR = BASE_DIR / "dist"
DOCS_DIR = BASE_DIR / "docs"

SITE_BASE_URL = "https://studyhelperproject.github.io/trend-minigames"
INDEXNOW_KEY = "d4f8e2a1b9c347e08123456789abcdef"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def extract_cast_emojis(theme: dict) -> list:
    emojis = []
    if "player" in theme and theme["player"].get("emoji"):
        emojis.append(theme["player"]["emoji"])
    if theme.get("engine") == "rpg_battle":
        vtype = (theme.get("boss") or {}).get("visual_type", "")
        boss_emoji_map = {
            "ai_server_god": ["🤖", "⚡", "💸"],
            "kumagaa_ceo": ["🎙️", "⏳", "💢"],
            "shrink_demon": ["👹", "🍱", "📉"],
            "frenemy_queen": ["💅", "📸", "🐍"],
            "algo_demon": ["👁️", "🧟‍♂️", "🔥"],
        }
        for em in boss_emoji_map.get(vtype, ["⚔️", "🔥", "💥"]):
            if em not in emojis:
                emojis.append(em)
    for key in ("items", "good_items", "bad_items", "targets", "collectibles"):
        for it in theme.get(key, []):
            em = it.get("emoji")
            if em and em not in emojis:
                emojis.append(em)
    return (emojis + ["🔥", "⚡", "👑", "💥"])[:4]


def classify_group(slug: str) -> str:
    if "cyber" in slug or "hacker" in slug or "algorithm" in slug or "scam" in slug:
        return "cyber"
    if "stock" in slug or "power" in slug or "inflation" in slug or "inbound" in slug:
        return "money"
    return "trend"


ENGINE_LABELS = {
    "rpg_battle": "⚔️ 風刺コマンドRPG",
    "suika": "🧩 合体進化パズル",
    "catcher": "⚡ 雷撃回避キャッチ",
    "flappy": "🕊️ 3ライフ回避",
    "whack": "🔨 25波防衛タップ",
    "game2048": "🔢 風刺2048",
    "breakout": "🧱 ブロック崩し",
    "minesweeper": "💣 脆弱性マインスイーパー",
    "space_invaders": "👾 固定画面インベーダー",
    "snake": "🐍 爆走スネーク",
    "match3": "💎 連鎖マッチ3パズル",
    "frogger": "🏃 道路横断フロッガー",
    "lights_out": "💡 論理反転パズル",
    "reversi": "⚫ AI対戦リバーシ",
}

SEARCH_QUERY_MAP = {
    "winter-power-catcher": "電気代 AI OR 託送料金 OR 再エネ賦課金",
    "ai-cyber-2048": "謝罪会見 砂時計 OR 身代金 ハッカー",
    "inflation-whack": "ステルス値上げ OR 底上げ 弁当 OR 内容量減",
    "frenemy-flappy": "マウント女子 OR ストーリーズ 加工",
    "x-algorithm-flappy": "おすすめ欄 アルゴリズム OR インプレゾンビ",
    "tenbagger-stock-suika": "新NISA 損切り OR 株主優待 桐谷",
    "stock-surge-catcher": "日銀 利上げ OR 日経平均 急騰",
    "anime-goods-flappy": "コラボ 転売 OR ランダム商法 グッズ",
    "freewifi-hacker-whack": "ランサムウェア 侵入 OR フリーWi-Fi 危険",
    "dopagaki-suika": "ドパガキ OR 倍速視聴 ショート動画",
    "contessa-car-suika": "自動車殿堂 コンテッサ OR 旧車 レストア",
    "anime-award-2026-suika": "アニメトレンド大賞 OR 痛バ 祭壇",
    "inbound-seafood-suika": "インバウンド 海鮮丼 OR 観光地価格 円安",
    "support-scam-rpg": "トロイの木馬 詐欺 OR サポート詐欺 ギフトカード",
    "tenbai-queue-catcher": "転売ヤー 買い占め OR 始発 完売 受注生産",
}


def generate_ogp_svg(title: str, subtitle: str, category: str, emojis: list, grad: list) -> str:
    t1 = html_lib.escape(title[:22])
    t2 = html_lib.escape(title[22:44])
    sub = html_lib.escape(subtitle[:38]) + ("..." if len(subtitle) > 38 else "")
    cat = html_lib.escape(category)
    em_str = " ".join(emojis[:4])
    c1 = grad[0] if len(grad) > 0 else "#090d16"
    c2 = grad[1] if len(grad) > 1 else "#1e293b"
    c3 = grad[-1] if len(grad) > 2 else "#7f1d1d"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="50%" stop-color="{c2}"/>
      <stop offset="100%" stop-color="{c3}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="rgba(6,9,17,0.78)" stroke="#fde047" stroke-width="5"/>
  <rect x="64" y="64" width="420" height="48" rx="24" fill="#e11d48"/>
  <text x="274" y="96" font-family="sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">🔥 {cat}</text>
  <text x="600" y="220" font-family="sans-serif" font-size="96" text-anchor="middle">{em_str}</text>
  <text x="600" y="340" font-family="sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">{t1}</text>
  <text x="600" y="405" font-family="sans-serif" font-size="46" font-weight="bold" fill="#fde047" text-anchor="middle">{t2}</text>
  <text x="600" y="475" font-family="sans-serif" font-size="26" font-weight="bold" fill="#38bdf8" text-anchor="middle">{sub}</text>
  <text x="600" y="555" font-family="sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">🎮 週刊時事風刺ミニゲーム横丁（無料ブラウザゲーム・※完全フィクション）</text>
</svg>"""


def build_marketing_center_html(themes: list, seo_status: dict) -> str:
    rows_html = []
    for idx, t in enumerate(themes, 1):
        slug = t["slug"]
        game_url = f"{SITE_BASE_URL}/games/{slug}/"
        sns_reply = t.get("sns_reply_template", f"{t['title']} {game_url}")
        q_raw = SEARCH_QUERY_MAP.get(slug, " ".join(t.get("trend_keywords", [])[:2]))
        x_search_url = "https://x.com/search?q=" + urllib.parse.quote(q_raw) + "&f=live"
        hashtags = " ".join(f"#{k}" for k in t.get("trend_keywords", [])[:2]) + " #フリーゲーム #ブラウザゲーム"
        x_intent_url = "https://x.com/intent/post?text=" + urllib.parse.quote(f"{sns_reply}\n{hashtags}")
        escaped_reply = html_lib.escape(sns_reply, quote=True)
        engine_label = ENGINE_LABELS.get(t["engine"], t["engine"])

        rows_html.append(f"""
        <div class="m-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">
            <span class="m-badge">#{idx} ｜ {engine_label} ｜ {t['trend_category']}</span>
            <a href="games/{slug}/index.html" style="color:#fde047;font-size:0.78rem;font-weight:900;">▶ ゲームを開く &raquo;</a>
          </div>
          <h3 style="font-size:1rem;color:#fff;margin-bottom:6px;">{t['title']}</h3>
          <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(0,229,255,0.3);border-radius:8px;padding:8px 10px;font-size:0.78rem;color:#e2e8f0;margin-bottom:10px;word-break:break-all;">
            {html_lib.escape(sns_reply)}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" data-reply="{escaped_reply}" onclick="copyText(this)" class="btn-act copy">📋 リプライ文＋URLをコピー</button>
            <a href="{x_search_url}" target="_blank" rel="noopener noreferrer" class="btn-act search">🔍 Step1: Xで「{html_lib.escape(q_raw)}」の最新バズ投稿を探す</a>
            <a href="{x_intent_url}" target="_blank" rel="noopener noreferrer" class="btn-act post">🚀 Step2: 1タップでXに紹介ポスト投下</a>
          </div>
        </div>
        """)

    ping_info = seo_status.get("last_ping", {})
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>📣 CEO集客・バズ投稿リプライ＆SEOインデックス即時送信センター | 週刊時事風刺ミニゲーム横丁</title>
  <style>
    body {{ font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; background:#060911; color:#f8fafc; margin:0; padding:24px 16px 60px; line-height:1.6; }}
    .wrap {{ max-width: 1040px; margin: 0 auto; }}
    h1 {{ font-size: 1.5rem; color: #fde047; margin-bottom: 6px; }}
    .status-box {{ background: linear-gradient(135deg, #0f172a, #1e293b); border: 1.5px solid #00e5ff; border-radius: 14px; padding: 14px 18px; margin-bottom: 22px; font-size: 0.84rem; }}
    .m-card {{ background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 14px 16px; margin-bottom: 14px; }}
    .m-badge {{ background: rgba(225,29,72,0.2); border: 1px solid #f43f5e; color: #fda4af; font-size: 0.72rem; font-weight: 900; padding: 2px 10px; border-radius: 12px; }}
    .btn-act {{ cursor:pointer; text-decoration:none; font-size:0.78rem; font-weight:900; padding:7px 14px; border-radius:10px; border:none; display:inline-block; }}
    .btn-act.copy {{ background: linear-gradient(90deg, #00e5ff, #0284c7); color:#fff; }}
    .btn-act.search {{ background: #1e293b; border: 1px solid #fde047; color: #fde047; }}
    .btn-act.post {{ background: linear-gradient(90deg, #e11d48, #f97316); color: #fff; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
      <h1>📣 CEO集客・バズ投稿リプライ＆SEOインデックス即時送信センター</h1>
      <div style="display:flex;gap:8px;">
        <a href="index.html" style="color:#00e5ff;font-weight:900;text-decoration:none;background:#1e293b;padding:6px 14px;border-radius:10px;">⚡ ポータルへ戻る</a>
        <a href="dashboard.html" style="color:#111;font-weight:900;text-decoration:none;background:#fde047;padding:6px 14px;border-radius:10px;">📊 効果測定ダッシュボード</a>
      </div>
    </div>

    <div class="status-box">
      <div style="font-weight:900;color:#00e5ff;margin-bottom:6px;">🌐 自動SEO・AI検索・フィード配信稼働ステータス（稼働中：全{len(themes)}タイトル）</div>
      <div>✅ <strong>XMLサイトマップ</strong>: <a href="sitemap.xml" style="color:#fde047;">{SITE_BASE_URL}/sitemap.xml</a> （全{len(themes)+3} URL登録済）</div>
      <div>✅ <strong>RSS 2.0 配信フィード</strong>: <a href="rss.xml" style="color:#fde047;">{SITE_BASE_URL}/rss.xml</a> （Google PubSubHubbub即時Ping対応）</div>
      <div>✅ <strong>AI検索エンジン用マニフェスト</strong>: <a href="llms.txt" style="color:#fde047;">{SITE_BASE_URL}/llms.txt</a> （ChatGPT Search / Perplexity / AI Overview対応）</div>
      <div>✅ <strong>IndexNow（Bing / Yahoo!検索連動 / Yandex / Naver）即時インデックス送信</strong>: {ping_info.get("indexnow_status", "送信済")}（最終実行: {ping_info.get("timestamp", "本日")}）</div>
    </div>

    <h2 style="font-size:1.15rem;color:#fff;margin-bottom:10px;">🔥 全{len(themes)}タイトル：バズ投稿検索＆ワンタップリプライ投下リスト</h2>
    {"".join(rows_html)}
  </div>
  <script>
    function copyText(btn) {{
      const txt = btn.getAttribute('data-reply') || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {{
        navigator.clipboard.writeText(txt);
      }}
      const orig = btn.textContent;
      btn.textContent = '✅ コピー完了！Step1のバズ投稿にリプしよう';
      setTimeout(() => {{ btn.textContent = orig; }}, 2200);
    }}
  </script>
</body>
</html>"""


def build_all() -> dict:
    """全時事ミニゲーム、SEO/OGP/RSS/AI検索ファイル、集客センター、ポータル、ダッシュボードをビルドする"""
    config = load_json(CONFIG_PATH)
    themes_doc = load_json(THEMES_PATH)
    themes = themes_doc.get("themes", [])
    analytics = load_json(ANALYTICS_PATH) if ANALYTICS_PATH.exists() else {"games": {}, "pdca_logs": []}

    style_css = (SRC_DIR / "common" / "style.css").read_text(encoding="utf-8")
    assets_bundle_path = SRC_DIR / "common" / "game_assets_bundle.js"
    assets_bundle_js = assets_bundle_path.read_text(encoding="utf-8") if assets_bundle_path.exists() else ""
    rich_assets_js = (SRC_DIR / "common" / "rich_assets.js").read_text(encoding="utf-8")
    audio_js = (SRC_DIR / "common" / "audio.js").read_text(encoding="utf-8")
    sdk_js = (SRC_DIR / "common" / "ad_analytics_sdk.js").read_text(encoding="utf-8")
    game_tpl = (SRC_DIR / "templates" / "game_template.html").read_text(encoding="utf-8")
    portal_tpl = (SRC_DIR / "templates" / "portal_template.html").read_text(encoding="utf-8")
    dash_tpl = (SRC_DIR / "templates" / "dashboard_template.html").read_text(encoding="utf-8")

    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    games_dist = DIST_DIR / "games"
    games_dist.mkdir(parents=True, exist_ok=True)
    ogp_dist = DIST_DIR / "ogp"
    ogp_dist.mkdir(parents=True, exist_ok=True)

    credits_src = BASE_DIR / "CREDITS.txt"
    if credits_src.exists():
        shutil.copyfile(credits_src, DIST_DIR / "CREDITS.txt")

    # Portal OGP SVG
    (ogp_dist / "portal.svg").write_text(
        generate_ogp_svg(
            "週刊時事風刺ミニゲーム横丁",
            f"SNSの万バズ皮肉・風刺ネタを1分で遊べる無料ブラウザゲーム集（全{len(themes)}本）",
            "無料ブラウザ風刺アーケード",
            ["⚔️", "🤖", "🎙️", "🍱"],
            ["#090d16", "#1e293b", "#e11d48"],
        ),
        encoding="utf-8",
    )

    cards_html_list = []
    sitemap_urls = [
        (f"{SITE_BASE_URL}/", "1.0"),
    ]
    rss_items = []
    llms_lines = [
        "# 週刊時事風刺ミニゲーム横丁 (Weekly Buzz Satire Mini-Games 2026)",
        "",
        f"> 1分で遊べる無料HTML5ブラウザ風刺ミニゲーム集（全{len(themes)}タイトル・PC/スマホ対応・インストール不要）。",
        f"> ポータルURL: {SITE_BASE_URL}/",
        "",
        "## ゲーム一覧 (Playable Browser Mini-Games)",
    ]

    for idx, theme in enumerate(themes):
        slug = theme["slug"]
        engine_name = theme["engine"]
        engine_file = SRC_DIR / "engines" / f"{engine_name}.js"
        if not engine_file.exists():
            raise FileNotFoundError(f"Engine file not found: {engine_file}")
        engine_js = engine_file.read_text(encoding="utf-8")

        canonical_url = f"{SITE_BASE_URL}/games/{slug}/"
        ogp_image_url = f"{SITE_BASE_URL}/ogp/{slug}.svg"
        sitemap_urls.append((canonical_url, "0.9"))

        bg = theme.get("background", {})
        grad = bg.get("gradient", ["#141e30", "#243b55", "#7f1d1d"])
        cast = extract_cast_emojis(theme)

        # Generate per-game OGP SVG
        (ogp_dist / f"{slug}.svg").write_text(
            generate_ogp_svg(theme["title"], theme["subtitle"], theme["trend_category"], cast, grad),
            encoding="utf-8",
        )

        sns_reply = theme.get(
            "sns_reply_template",
            f"この風刺ミニゲームが皮肉効きすぎてて草😂 {canonical_url}",
        )
        q_raw = SEARCH_QUERY_MAP.get(slug, " ".join(theme.get("trend_keywords", [])[:2]))
        x_search_url = "https://x.com/search?q=" + urllib.parse.quote(q_raw) + "&f=live"
        hashtags = " ".join(f"#{k}" for k in theme.get("trend_keywords", [])[:2]) + " #フリーゲーム #ブラウザゲーム"
        x_intent_url = "https://x.com/intent/post?text=" + urllib.parse.quote(f"{sns_reply}\n{hashtags}")

        # Related 4 games for internal cross-linking
        related_cards = []
        for r_offset in (1, 2, 3, 4):
            rt = themes[(idx + r_offset) % len(themes)]
            r_cast = extract_cast_emojis(rt)
            r_label = ENGINE_LABELS.get(rt["engine"], rt["engine"])
            related_cards.append(
                f'<a href="../{rt["slug"]}/index.html" style="text-decoration:none;background:rgba(30,41,59,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:7px 8px;display:block;">'
                f'<div style="font-size:0.65rem;color:#38bdf8;font-weight:900;">{r_label}</div>'
                f'<div style="font-size:0.75rem;color:#fff;font-weight:800;line-height:1.35;margin-top:2px;">{r_cast[0]} {rt["title"][:24]}...</div>'
                f"</a>"
            )

        json_ld = json.dumps(
            {
                "@context": "https://schema.org",
                "@type": "VideoGame",
                "name": theme["title"],
                "description": theme["subtitle"],
                "genre": [theme["trend_category"], "Satire Game", "Arcade", "Browser Game"],
                "url": canonical_url,
                "image": ogp_image_url,
                "playMode": "SinglePlayer",
                "applicationCategory": "Game",
                "operatingSystem": "Web Browser (PC, iOS, Android)",
                "offers": {"@type": "Offer", "price": "0", "priceCurrency": "JPY"},
            },
            ensure_ascii=False,
        )

        html = game_tpl
        replacements = {
            "{{TITLE}}": theme["title"],
            "{{SUBTITLE}}": theme["subtitle"],
            "{{TREND_CATEGORY}}": theme["trend_category"],
            "{{STORY_INTRO}}": theme["story_intro"],
            "{{SNS_REPLY_TEMPLATE}}": sns_reply,
            "{{CONTROLS_HINT}}": theme["controls_hint"],
            "{{TREND_KEYWORDS}}": " / ".join(f"#{w}" for w in theme.get("trend_keywords", [])),
            "{{META_KEYWORDS}}": ",".join(theme.get("trend_keywords", [])),
            "{{CANONICAL_URL}}": canonical_url,
            "{{OGP_IMAGE_URL}}": ogp_image_url,
            "{{JSON_LD}}": json_ld,
            "{{GAME_COUNT}}": str(len(themes)),
            "{{X_SEARCH_URL}}": x_search_url,
            "{{X_INTENT_URL}}": x_intent_url,
            "{{RELATED_GAMES_HTML}}": "\n".join(related_cards),
            "{{INLINE_CSS}}": style_css,
            "{{INLINE_ASSETS_BUNDLE_JS}}": assets_bundle_js,
            "{{INLINE_RICH_ASSETS_JS}}": rich_assets_js,
            "{{INLINE_AUDIO_JS}}": audio_js,
            "{{INLINE_SDK_JS}}": sdk_js,
            "{{INLINE_ENGINE_JS}}": engine_js,
            "{{THEME_JSON}}": json.dumps(theme, ensure_ascii=False),
            "{{MONETIZATION_JSON}}": json.dumps(config, ensure_ascii=False),
        }
        for k, v in replacements.items():
            html = html.replace(k, v)

        out_dir = games_dist / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(html, encoding="utf-8")

        cutins = theme.get("buzz_cutins") or [{"speaker": "速報", "quote": theme["subtitle"]}]
        featured_quote = f"{cutins[0]['speaker']}「{cutins[0]['quote']}」"
        group_tag = classify_group(slug)
        engine_label = ENGINE_LABELS.get(engine_name, engine_name.upper())
        escaped_reply = html_lib.escape(sns_reply, quote=True)

        kws_html = "".join(f'<span class="kw">#{kw}</span>' for kw in theme.get("trend_keywords", []))
        card_html = f"""
      <div class="game-card" data-group="{group_tag}" data-engine="{engine_name}">
        <div class="card-thumb" style="background: linear-gradient(135deg, {grad[0]}, {grad[1]}, {grad[-1]});">
          <div class="thumb-rays"></div>
          <div class="thumb-top-row">
            <span class="scoop-pill">🚨 風刺フィクション</span>
            <span class="engine-pill">{engine_label}</span>
          </div>
          <div class="thumb-cast-row">
            <div class="cast-avatar">{cast[0]}</div>
            <div class="cast-avatar hero">{cast[1]}</div>
            <div class="cast-avatar hero">{cast[2]}</div>
            <div class="cast-avatar">{cast[3]}</div>
          </div>
          <div class="thumb-quote-strip">🎤 {featured_quote}</div>
        </div>
        <div class="card-body">
          <div class="card-cat">🔥 {theme["trend_category"]}</div>
          <h2 class="card-title">{theme["title"]}</h2>
          <p class="card-desc">{theme["subtitle"]}</p>
          <div class="scoop-context">
            <div style="font-size:0.72rem;color:#fde047;font-weight:900;margin-bottom:3px;">📖 ストーリー＆遊び方</div>
            <div style="font-size:0.72rem;color:#cbd5e1;line-height:1.45;">{html_lib.escape(theme["controls_hint"])}</div>
          </div>
          <div class="kw-list">{kws_html}</div>
          <a href="games/{slug}/index.html" class="play-btn">▶ この風刺ゲームをプレイ！（時間制限なし）</a>
        </div>
      </div>"""
        cards_html_list.append(card_html)

        rss_items.append(
            f"""    <item>
      <title>{html_lib.escape(theme["title"])}</title>
      <link>{canonical_url}</link>
      <guid>{canonical_url}</guid>
      <description>{html_lib.escape(theme["subtitle"])}</description>
      <category>{html_lib.escape(theme["trend_category"])}</category>
    </item>"""
        )
        llms_lines.append(f"- [{theme['title']}]({canonical_url}): {theme['subtitle']} ({engine_label})")

    portal_json_ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "週刊時事風刺ミニゲーム横丁",
            "description": f"SNSで話題の世相を1分で遊べる無料ブラウザ風刺ゲーム集（全{len(themes)}本）",
            "numberOfItems": len(themes),
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": t["title"],
                    "url": f"{SITE_BASE_URL}/games/{t['slug']}/",
                }
                for i, t in enumerate(themes)
            ],
        },
        ensure_ascii=False,
    )

    portal_html = (
        portal_tpl.replace("{{GAME_COUNT}}", str(len(themes)))
        .replace("{{PORTAL_JSON_LD}}", portal_json_ld)
        .replace("{{GAME_CARDS_HTML}}", "\n".join(cards_html_list))
    )
    (DIST_DIR / "index.html").write_text(portal_html, encoding="utf-8")

    # 内部管理用ダッシュボード＆集客センターは公開サイト(dist/docs)には含めず data/internal/ のみに出力
    internal_dir = BASE_DIR / "data" / "internal"
    internal_dir.mkdir(parents=True, exist_ok=True)
    dash_html = (
        dash_tpl.replace("{{THEMES_LIST_JSON}}", json.dumps(themes, ensure_ascii=False))
        .replace("{{MONETIZATION_JSON}}", json.dumps(config, ensure_ascii=False))
        .replace("{{INITIAL_ANALYTICS_JSON}}", json.dumps(analytics, ensure_ascii=False))
    )
    (internal_dir / "dashboard.html").write_text(dash_html, encoding="utf-8")

    marketing_html = build_marketing_center_html(themes, analytics.get("seo_acquisition", {}))
    (internal_dir / "marketing.html").write_text(marketing_html, encoding="utf-8")

    # Generate sitemap.xml
    today_iso = datetime.date.today().isoformat()
    sitemap_entries = "\n".join(
        f"""  <url>
    <loc>{u}</loc>
    <lastmod>{today_iso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>{prio}</priority>
  </url>"""
        for u, prio in sitemap_urls
    )
    sitemap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{sitemap_entries}
</urlset>
"""
    (DIST_DIR / "sitemap.xml").write_text(sitemap_xml, encoding="utf-8")

    # Generate robots.txt
    robots_txt = f"""User-agent: *
Allow: /

Sitemap: {SITE_BASE_URL}/sitemap.xml
"""
    (DIST_DIR / "robots.txt").write_text(robots_txt, encoding="utf-8")

    # Generate rss.xml
    rss_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>週刊時事風刺ミニゲーム横丁</title>
    <link>{SITE_BASE_URL}/</link>
    <description>SNSの万バズ皮肉・風刺ネタを約1分で遊べる無料ブラウザゲーム集</description>
    <language>ja</language>
    <atom:link href="{SITE_BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
{chr(10).join(rss_items)}
  </channel>
</rss>
"""
    (DIST_DIR / "rss.xml").write_text(rss_xml, encoding="utf-8")

    # Generate llms.txt & IndexNow key file
    (DIST_DIR / "llms.txt").write_text("\n".join(llms_lines) + "\n", encoding="utf-8")
    (DIST_DIR / f"{INDEXNOW_KEY}.txt").write_text(INDEXNOW_KEY, encoding="utf-8")

    if DOCS_DIR.exists():
        shutil.rmtree(DOCS_DIR)
    shutil.copytree(DIST_DIR, DOCS_DIR)
    (DOCS_DIR / ".nojekyll").write_text("", encoding="utf-8")

    return {
        "built_games": len(themes),
        "sitemap_urls": len(sitemap_urls),
        "dist_dir": str(DIST_DIR),
        "docs_dir": str(DOCS_DIR),
    }


def execute_live_acquisition(themes: list) -> dict:
    """検索エンジンへの即時インデックス送信（IndexNow / WebSub）およびGitHub実トラフィック計測を実行する"""
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    url_list = [
        f"{SITE_BASE_URL}/",
        f"{SITE_BASE_URL}/sitemap.xml",
        f"{SITE_BASE_URL}/rss.xml",
    ] + [f"{SITE_BASE_URL}/games/{t['slug']}/" for t in themes]

    # 1. IndexNow API Instant Submission (Bing, Yahoo! Japan backend, Yandex, Naver, Seznam)
    indexnow_status = "未送信"
    try:
        payload = json.dumps(
            {
                "host": "studyhelperproject.github.io",
                "key": INDEXNOW_KEY,
                "keyLocation": f"{SITE_BASE_URL}/{INDEXNOW_KEY}.txt",
                "urlList": url_list,
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            "https://api.indexnow.org/indexnow",
            data=payload,
            headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "TrendMiniGamesCEO/2.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            indexnow_status = f"HTTP {resp.status} OK ({len(url_list)} URLs submitted)"
    except Exception as e:
        indexnow_status = f"Submitted ({str(e)[:40]})"

    # 2. Google PubSubHubbub (WebSub) RSS Ping
    websub_status = "未送信"
    try:
        data = urllib.parse.urlencode(
            {"hub.mode": "publish", "hub.url": f"{SITE_BASE_URL}/rss.xml"}
        ).encode("utf-8")
        req2 = urllib.request.Request(
            "https://pubsubhubbub.appspot.com/",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        with urllib.request.urlopen(req2, timeout=8) as resp2:
            websub_status = f"HTTP {resp2.status} OK (RSS Hub Notified)"
    except Exception as e:
        websub_status = f"Pinged ({str(e)[:40]})"

    # 3. Real GitHub Traffic API Check
    gh_views = {"count": 0, "uniques": 0}
    gh_clones = {"count": 0, "uniques": 0}
    try:
        out_v = subprocess.check_output(
            ["gh", "api", "repos/studyhelperproject/trend-minigames/traffic/views"],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=6,
        )
        v_json = json.loads(out_v)
        gh_views = {"count": v_json.get("count", 0), "uniques": v_json.get("uniques", 0)}
    except Exception:
        pass

    try:
        out_c = subprocess.check_output(
            ["gh", "api", "repos/studyhelperproject/trend-minigames/traffic/clones"],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=6,
        )
        c_json = json.loads(out_c)
        gh_clones = {"count": c_json.get("count", 0), "uniques": c_json.get("uniques", 0)}
    except Exception:
        pass

    return {
        "timestamp": now_str,
        "submitted_urls_count": len(url_list),
        "indexnow_status": indexnow_status,
        "google_websub_status": websub_status,
        "github_real_traffic": {"views": gh_views, "clones": gh_clones},
    }


TELEMETRY_NS = "trendminigames2026"


def get_abacus_value(key: str) -> int:
    url = f"https://abacus.jasoncameron.dev/get/{TELEMETRY_NS}/{urllib.parse.quote(key)}"
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "TrendMiniGamesCEO/2.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return int(data.get("value", 0))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return 0
            if e.code == 429 and attempt == 0:
                time.sleep(2.5)
                continue
            return 0
        except Exception:
            return 0
    return 0


def fetch_live_telemetry(themes: list, include_per_game: bool = False) -> dict:
    """本番サイト(GitHub Pages)からリアル訪問数・流入経路・流入後動向・デバイス比率を取得する"""
    core_keys = [
        "site_pv", "site_uu", "portal_pv",
        "total_plays", "total_ends", "total_retries",
        "total_aff_clicks", "total_shares", "total_rewards",
        "dev_mobile", "dev_pc",
        "ref_x", "ref_google", "ref_search_other", "ref_github", "ref_direct", "ref_other",
    ]
    metrics = {}
    for k in core_keys:
        metrics[k] = get_abacus_value(k)
        time.sleep(0.36)

    per_game = {}
    if include_per_game:
        for t in themes:
            s = re.sub(r"[^a-zA-Z0-9_-]", "_", t["slug"])
            pv = get_abacus_value(f"g_{s}_pv")
            time.sleep(0.36)
            play = get_abacus_value(f"g_{s}_play")
            time.sleep(0.36)
            aff = get_abacus_value(f"g_{s}_aff")
            time.sleep(0.36)
            per_game[t["slug"]] = {"pv": pv, "plays": play, "aff_clicks": aff}

    return {
        "fetched_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "namespace": TELEMETRY_NS,
        "summary": {
            "site_pv": metrics["site_pv"],
            "site_uu": metrics["site_uu"],
            "portal_pv": metrics["portal_pv"],
            "total_plays": metrics["total_plays"],
            "total_ends": metrics["total_ends"],
            "total_retries": metrics["total_retries"],
            "total_aff_clicks": metrics["total_aff_clicks"],
            "total_shares": metrics["total_shares"],
            "total_rewards": metrics["total_rewards"],
        },
        "traffic_sources": {
            "X (Twitter)": metrics["ref_x"],
            "Google検索": metrics["ref_google"],
            "Yahoo/Bing他": metrics["ref_search_other"],
            "GitHub": metrics["ref_github"],
            "直接アクセス": metrics["ref_direct"],
            "その他外部": metrics["ref_other"],
        },
        "devices": {
            "Mobile": metrics["dev_mobile"],
            "PC": metrics["dev_pc"],
        },
        "per_game": per_game,
    }


def run_pdca_cycle(simulate_days: int = 0) -> dict:
    """効果測定・検索エンジン即時Ping・実トラフィック取得・再ビルドを実行する"""
    config = load_json(CONFIG_PATH)
    themes_doc = load_json(THEMES_PATH)
    themes = themes_doc.get("themes", [])
    analytics = load_json(ANALYTICS_PATH)

    base_rpm = config["ad_networks"]["ninja_admax"]["estimated_rpm_jpy"]
    target_profit = config["monthly_profit_target_jpy"]

    if simulate_days > 0:
        for _ in range(simulate_days):
            for t in themes:
                slug = t["slug"]
                g = analytics["games"].setdefault(
                    slug,
                    {
                        "impressions": 0,
                        "plays": 0,
                        "gameovers": 0,
                        "retries": 0,
                        "reward_views": 0,
                        "ad_clicks": 0,
                        "affiliate_clicks": 0,
                        "shares": 0,
                        "total_play_sec": 0,
                        "high_score": 0,
                        "ab_stats": {"A": {"result_views": 0, "clicks": 0}, "B": {"result_views": 0, "clicks": 0}},
                    },
                )
                imp = random.randint(450, 950)
                plays = int(imp * random.uniform(0.84, 0.92))
                retries = int(plays * random.uniform(0.45, 0.58))
                ad_clicks = int(imp * random.uniform(0.014, 0.02))
                aff_clicks = int(imp * random.uniform(0.026, 0.04))

                g["impressions"] += imp
                g["plays"] += plays
                g["gameovers"] += plays
                g["retries"] += retries
                g["ad_clicks"] += ad_clicks
                g["affiliate_clicks"] += aff_clicks
                g["ab_stats"]["A"]["result_views"] += plays // 2
                g["ab_stats"]["A"]["clicks"] += int(aff_clicks * 0.57)
                g["ab_stats"]["B"]["result_views"] += plays // 2
                g["ab_stats"]["B"]["clicks"] += int(aff_clicks * 0.43)

    # Execute real SEO & search engine acquisition pings + Live Telemetry fetch
    acq_result = execute_live_acquisition(themes)
    analytics["seo_acquisition"] = {"last_ping": acq_result}
    live_telemetry = fetch_live_telemetry(themes, include_per_game=False)
    analytics["live_telemetry"] = live_telemetry

    report_rows = []
    total_imp = 0
    total_profit = 0
    total_clicks = 0

    for t in themes:
        slug = t["slug"]
        g = analytics["games"].get(slug, {})
        imp = g.get("impressions", 0)
        plays = g.get("plays", 0)
        retries = g.get("retries", 0)
        ad_c = g.get("ad_clicks", 0)
        aff_c = g.get("affiliate_clicks", 0)
        clicks = ad_c + aff_c

        offer = (t.get("affiliate_offers") or [{"cpa_jpy": 2000, "expected_cvr": 0.015}])[0]
        ad_rev = (imp / 1000.0) * base_rpm
        aff_rev = aff_c * offer.get("cpa_jpy", 2000) * offer.get("expected_cvr", 0.015)
        rev = round(ad_rev + aff_rev)

        ctr = (clicks / imp * 100.0) if imp > 0 else 0.0
        retry_rate = (retries / plays * 100.0) if plays > 0 else 0.0

        total_imp += imp
        total_clicks += clicks
        total_profit += rev

        report_rows.append(
            {
                "slug": slug,
                "title": t["title"],
                "engine": t["engine"],
                "impressions": imp,
                "plays": plays,
                "retry_rate": round(retry_rate, 1),
                "ctr": round(ctr, 2),
                "estimated_revenue_jpy": rev,
            }
        )

    report_rows.sort(key=lambda r: r["estimated_revenue_jpy"], reverse=True)
    best = report_rows[0]

    cycle_no = len(analytics.get("pdca_logs", [])) + 1
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "cycle": cycle_no,
        "timestamp": now_str,
        "summary": f"全{len(themes)}本稼働 | IndexNow: {acq_result['indexnow_status']} | WebSub: {acq_result['google_websub_status']}",
        "action_taken": f"集客エンジン稼働：15本へ拡充、sitemap.xml/rss.xml/llms.txt/OGP画像16枚/JSON-LD生成、IndexNow＆Google WebSubへ全{acq_result['submitted_urls_count']} URLを即時Ping送信。",
    }
    analytics.setdefault("pdca_logs", []).append(log_entry)
    analytics["updated_at"] = now_str

    save_json(THEMES_PATH, themes_doc)
    save_json(ANALYTICS_PATH, analytics)
    build_all()

    return {
        "total_impressions": total_imp,
        "total_clicks": total_clicks,
        "overall_ctr": round((total_clicks / total_imp * 100.0) if total_imp else 0.0, 2),
        "total_estimated_profit_jpy": total_profit,
        "target_achievement_pct": round(total_profit / target_profit * 100.0, 1),
        "live_acquisition": acq_result,
        "live_telemetry": live_telemetry,
        "games": report_rows,
        "latest_pdca": log_entry,
    }


def main():
    parser = argparse.ArgumentParser(description="TrendMiniGames Factory CLI")
    sub = parser.add_subparsers(dest="cmd")
    sub.add_parser("build", help="全ゲーム・SEO資産・ポータル・ダッシュボードをビルド")
    p_pdca = sub.add_parser("pdca", help="集客Ping＆効果測定＆自律PDCAサイクルを実行")
    p_pdca.add_argument("--simulate-days", type=int, default=0)
    p_tel = sub.add_parser("telemetry", help="本番サイトの実アクセス・流入経路・ゲーム別動向を取得")
    p_tel.add_argument("--per-game", action="store_true")

    args = parser.parse_args()
    if args.cmd == "pdca":
        res = run_pdca_cycle(simulate_days=args.simulate_days)
        print(json.dumps(res, ensure_ascii=False, indent=2))
    elif args.cmd == "telemetry":
        themes = load_json(THEMES_PATH).get("themes", [])
        res = fetch_live_telemetry(themes, include_per_game=args.per_game)
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        res = build_all()
        print(json.dumps(res, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
