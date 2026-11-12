/**
 * Rich Visual Assets, Parody Character Renderer, Live Stage Backgrounds & Buzz Cut-in System
 * 1. 実在ニュース・謝罪会見・バズりミームのパロディ人物＆アイテムを高精細ベクター描画
 * 2. 記者会見フラッシュ・東証アローズ電光掲示板・回転寿司レーン・SNS弾幕コメントの動的背景
 * 3. プレイ中にバズった名言・炎上発言が飛び出す「緊急速報カットイン」演出
 */
class RichVisualRenderer {
  constructor(canvas, theme) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.tick = 0;
    this.cutin = null;
    this.flashes = [];
    this.danmaku = [];
    this.shakeAmount = 0;

    this.initDanmaku();
  }

  initDanmaku() {
    const comments = this.theme.buzz_comments || [
      '命の砂時計きたwww',
      '2年前のイエラエ指摘放置は草',
      'スライド係の社員かわいそうw',
      'スーツのボタン留めろ会見w',
      '店員がメルカリ横流しはアカン',
      'なぜ庶民がAIの電気代払うのか',
      '新NISA損切り民息してるかー？',
      '桐谷さんチャリ爆走www',
      'ガチでメロい尊い…',
      '完全にドパガキの症状で草'
    ];
    for (let i = 0; i < 9; i++) {
      this.danmaku.push({
        text: comments[i % comments.length],
        x: Math.random() * 400,
        y: 65 + (i * 42) % 360,
        speed: 0.9 + Math.random() * 1.4,
        alpha: 0.18 + Math.random() * 0.18
      });
    }
  }

  triggerCutin(speaker, quote, avatarType = 'kumagai', badge = '🚨 緊急会見速報') {
    this.cutin = {
      speaker,
      quote,
      avatarType,
      badge,
      life: 1.0,
      maxLife: 1.0
    };
    this.shakeAmount = 6;
    // Camera flash effect
    for (let i = 0; i < 4; i++) {
      this.flashes.push({
        x: 40 + Math.random() * 320,
        y: 60 + Math.random() * 360,
        radius: 50 + Math.random() * 80,
        alpha: 0.75
      });
    }
  }

  triggerRandomBuzzCutin() {
    const list = this.theme.buzz_cutins || [];
    if (list.length === 0) return;
    const item = list[Math.floor(Math.random() * list.length)];
    this.triggerCutin(item.speaker, item.quote, item.avatar || 'kumagai', item.badge || '🔥 バズり速報');
  }

  drawStageBackground(width, height) {
    const ctx = this.ctx;
    this.tick++;

    ctx.save();
    if (this.shakeAmount > 0.2) {
      const dx = (Math.random() - 0.5) * this.shakeAmount;
      const dy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(dx, dy);
      this.shakeAmount *= 0.85;
    }

    const stageType = this.theme.stage_style || 'press_conference';

    if (stageType === 'press_conference') {
      // 謝罪会見場（金屏風格子＋記者席シルエット＋カメラフラッシュ）
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.6, '#1e293b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // パネル背景の市松模様（記者会見バックパネル風）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const size = 40;
      for (let r = 0; r < height / size; r++) {
        for (let c = 0; c < width / size; c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(c * size, r * size, size, size);
          }
        }
      }

      // ランダム記者カメラフラッシュ
      if (this.tick % 45 === 0) {
        this.flashes.push({
          x: 30 + Math.random() * (width - 60),
          y: height - 40 - Math.random() * 80,
          radius: 70,
          alpha: 0.55
        });
      }
    } else if (stageType === 'stock_exchange') {
      // 東証アローズ風（ローソク足グリッド＋回転株価ティッカー）
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#041410');
      grad.addColorStop(1, '#07221b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 230, 118, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // 背景ローソク足アニメーション
      for (let i = 0; i < 10; i++) {
        const cx = 24 + i * 38;
        const wave = Math.sin((this.tick * 0.03) + i * 0.7) * 55;
        const cy = 220 + wave;
        const isUp = Math.cos((this.tick * 0.03) + i) >= 0;
        ctx.fillStyle = isUp ? 'rgba(255, 23, 68, 0.16)' : 'rgba(0, 230, 118, 0.16)';
        ctx.fillRect(cx - 8, cy - 22, 16, 44);
        ctx.fillRect(cx - 1.5, cy - 36, 3, 72);
      }
    } else if (stageType === 'sushi_lane') {
      // 回転寿司レーン＆フリマ出品風背景
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#2a1215');
      grad.addColorStop(1, '#14080a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 回転レーンベルト
      ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.fillRect(0, 140, width, 28);
      ctx.fillRect(0, 310, width, 28);
      const offset = (this.tick * 1.5) % 60;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let x = -60 + offset; x < width; x += 60) {
        ctx.fillRect(x, 146, 36, 16);
        ctx.fillRect(width - x, 316, 36, 16);
      }
    } else {
      // ネオンSNS＆ドパガキ2分割風ステージ
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1a0b2e');
      grad.addColorStop(0.5, '#2d114d');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 集中線・ネオンサークル
      ctx.strokeStyle = 'rgba(255, 64, 129, 0.1)';
      ctx.lineWidth = 2;
      const r = (this.tick * 1.2) % 240;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 流れるSNS弾幕コメント
    ctx.font = 'bold 12px "Hiragino Kaku Gothic ProN", sans-serif';
    for (const d of this.danmaku) {
      d.x -= d.speed;
      if (d.x < -220) d.x = width + 20;
      ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha})`;
      ctx.fillText(d.text, d.x, d.y);
    }

    // カメラフラッシュ発光描画
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      const radGrad = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, f.radius);
      radGrad.addColorStop(0, `rgba(255, 255, 255, ${f.alpha})`);
      radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
      f.alpha -= 0.06;
      if (f.alpha <= 0) this.flashes.splice(i, 1);
    }

    ctx.restore();
  }

  /**
   * キャラクター・パロディ人物のリッチベクター描画（立体メダル＋似顔絵パーツ＋ラベルリボン）
   */
  drawRichCharacter(x, y, radius, spec, isPreview = false) {
    const ctx = this.ctx;
    ctx.save();
    if (isPreview) ctx.globalAlpha = 0.85;

    // 外周ドロップシャドウ＆オーラ
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // ベース立体球体グラデーション
    const baseColor = spec.color || '#ff4081';
    const sphereGrad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.25, baseColor);
    sphereGrad.addColorStop(1, '#111827');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // メタリックゴールド/ネオン枠線
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = radius >= 45 ? 3.5 : 2.2;
    ctx.strokeStyle = radius >= 55 ? '#ffd700' : 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();

    // パロディ人物イラストレイヤー（avatar属性がある場合、似顔絵ベクターパーツを重ねる）
    const avatar = spec.avatar || '';
    if (avatar === 'kumagai_ceo' && radius >= 26) {
      // クマガイ社長風：紺スーツ襟＋赤ネクタイ＋黒髪七三＋涙＋砂時計バッジ
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x, y + radius * 0.55, radius * 0.42, Math.PI, 0, false);
      ctx.fill();
      ctx.fillStyle = '#e11d48'; // 赤ネクタイ＆チーフ
      ctx.fillRect(x - 3, y + radius * 0.25, 6, radius * 0.35);
    } else if (avatar === 'kiritani_master' && radius >= 26) {
      // 桐谷名人風：メガネフレーム＋自転車ヘルメット風アクセント
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - radius * 0.42, y - radius * 0.22, radius * 0.35, radius * 0.22);
      ctx.strokeRect(x + radius * 0.07, y - radius * 0.22, radius * 0.35, radius * 0.22);
    } else if (avatar === 'ueda_gov' && radius >= 26) {
      // 植田総裁風：黒縁メガネ＋日銀バッジ
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - radius * 0.42, y - radius * 0.2, radius * 0.36, radius * 0.22);
      ctx.strokeRect(x + radius * 0.06, y - radius * 0.2, radius * 0.36, radius * 0.22);
    }

    // メイン絵文字/シンボル
    const fontSize = Math.max(15, Math.floor(radius * 0.88));
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.emoji || '🔥', x, y - (radius >= 28 ? 3 : 0));

    // 上部ハイライトグロス（ツヤ感）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.22, y - radius * 0.48, radius * 0.38, radius * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 名前リボンプレート（半径24以上）
    if (radius >= 24 && spec.name) {
      const label = spec.name.slice(0, 8);
      const pillW = Math.min(radius * 1.9, Math.max(48, label.length * 9.5));
      const pillH = radius >= 48 ? 16 : 13;
      const py = y + radius * 0.58;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.beginPath();
      ctx.roundRect(x - pillW / 2, py - pillH / 2, pillW, pillH, 6);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${radius >= 48 ? 10 : 8.5}px "Hiragino Kaku Gothic ProN", sans-serif`;
      ctx.fillText(label, x, py + 0.5);
    }

    ctx.restore();
  }

  /**
   * 画面上部に飛び出す「週刊誌スクープ／謝罪会見テロップ風カットイン」描画
   */
  drawCutinOverlay(width) {
    if (!this.cutin) return;
    const c = this.cutin;
    const ctx = this.ctx;

    ctx.save();
    const alpha = Math.min(1, c.life * 2.2);
    ctx.globalAlpha = alpha;

    // ニュース速報テロップ枠
    const boxX = 10;
    const boxY = 46;
    const boxW = width - 20;
    const boxH = 54;

    const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY);
    grad.addColorStop(0, 'rgba(185, 28, 28, 0.96)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.96)');
    grad.addColorStop(1, 'rgba(30, 41, 59, 0.96)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();

    // バッジ
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${c.badge} ｜ ${c.speaker}`, boxX + 12, boxY + 17);

    // セリフ本文
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillText(`「${c.quote.slice(0, 25)}」`, boxX + 12, boxY + 39);

    ctx.restore();

    c.life -= 0.015;
    if (c.life <= 0) {
      this.cutin = null;
    }
  }
}

window.RichVisualRenderer = RichVisualRenderer;
