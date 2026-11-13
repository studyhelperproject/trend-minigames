/**
 * Rich Visual Assets, Fictional Satire Character Renderer, Live Stage Backgrounds & RPG Visual Effects
 * ※登場するキャラクター・名称はすべて100%フィクションの風刺パロディであり、実在の人物・企業・商標とは一切関係ありません。
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
      'AIに節電聞いたら俺の電気代上がったｗ',
      'クマガー社長の命の砂時計ポエムきたwww',
      'スライド戻さなくていい！（秒速キレ）',
      'おいしくなって新登場（量20%減）は草',
      '弁当の底上げがエベレスト級すぎるｗ',
      '店員がフリマ横流しは資本主義のバグ',
      'シン・ニーサ損切り民息してるかー？',
      'キリタマ仙人のママチャリ爆走www',
      'おすすめ欄アルゴリズムの晒し上げ怖すぎ',
      '※この物語はフィクションです（迫真）'
    ];
    for (let i = 0; i < 9; i++) {
      this.danmaku.push({
        text: comments[i % comments.length],
        x: Math.random() * 400,
        y: 62 + (i * 42) % 350,
        speed: 0.85 + Math.random() * 1.25,
        alpha: 0.17 + Math.random() * 0.16
      });
    }
  }

  triggerCutin(speaker, quote, avatarType = 'kumagaa_ceo', badge = '🚨 風刺スクープ速報') {
    this.cutin = {
      speaker,
      quote,
      avatarType,
      badge,
      life: 1.0,
      maxLife: 1.0
    };
    this.shakeAmount = 7;
    for (let i = 0; i < 4; i++) {
      this.flashes.push({
        x: 40 + Math.random() * 320,
        y: 60 + Math.random() * 320,
        radius: 50 + Math.random() * 80,
        alpha: 0.7
      });
    }
  }

  triggerRandomBuzzCutin() {
    const list = this.theme.buzz_cutins || [];
    if (list.length === 0) return;
    const item = list[Math.floor(Math.random() * list.length)];
    this.triggerCutin(item.speaker, item.quote, item.avatar || 'kumagaa_ceo', item.badge || '🔥 SNS万バズ風刺');
  }

  drawStageBackground(width, height) {
    const ctx = this.ctx;
    this.tick++;

    ctx.save();
    if (this.shakeAmount > 0.2) {
      const dx = (Math.random() - 0.5) * this.shakeAmount;
      const dy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(dx, dy);
      this.shakeAmount *= 0.86;
    }

    const stageType = this.theme.stage_style || 'press_conference';

    if (stageType === 'press_conference') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.6, '#1e293b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const size = 40;
      for (let r = 0; r < height / size; r++) {
        for (let c = 0; c < width / size; c++) {
          if ((r + c) % 2 === 0) ctx.fillRect(c * size, r * size, size, size);
        }
      }

      if (this.tick % 50 === 0) {
        this.flashes.push({
          x: 30 + Math.random() * (width - 60),
          y: height - 50 - Math.random() * 120,
          radius: 70,
          alpha: 0.5
        });
      }
    } else if (stageType === 'stock_exchange') {
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
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#2a1215');
      grad.addColorStop(1, '#14080a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

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
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1a0b2e');
      grad.addColorStop(0.5, '#2d114d');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 64, 129, 0.1)';
      ctx.lineWidth = 2;
      const r = (this.tick * 1.2) % 240;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.font = 'bold 12px "Hiragino Kaku Gothic ProN", sans-serif';
    for (const d of this.danmaku) {
      d.x -= d.speed;
      if (d.x < -250) d.x = width + 20;
      ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha})`;
      ctx.fillText(d.text, d.x, d.y);
    }

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
   * Twemoji / Game-Icons のプリロード済みSVGベクター画像をCanvasへ描画するヘルパー
   */
  drawVectorSprite(emojiOrKey, x, y, size, isGameIcon = false) {
    const ctx = this.ctx;
    const cache = window.GAME_ASSET_CACHE;
    if (cache) {
      const img = isGameIcon ? (cache.icons && cache.icons[emojiOrKey]) : (cache.emojis && cache.emojis[emojiOrKey]);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        return true;
      }
    }
    return false;
  }

  /**
   * キャラクター・架空風刺人物のリッチベクター描画（Twemoji CC BY 4.0 + Game-Icons CC BY 3.0）
   */
  drawRichCharacter(x, y, radius, spec, isPreview = false) {
    const ctx = this.ctx;
    ctx.save();
    if (isPreview) ctx.globalAlpha = 0.85;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

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

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = radius >= 45 ? 3.5 : 2.2;
    ctx.strokeStyle = radius >= 55 ? '#ffd700' : 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();

    const avatar = spec.avatar || '';
    if ((avatar === 'kumagaa_ceo' || avatar === 'kumagai_ceo') && radius >= 26) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x, y + radius * 0.55, radius * 0.42, Math.PI, 0, false);
      ctx.fill();
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(x - 3, y + radius * 0.25, 6, radius * 0.35);
    } else if ((avatar === 'kiritama_master' || avatar === 'kiritani_master') && radius >= 26) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - radius * 0.42, y - radius * 0.22, radius * 0.35, radius * 0.22);
      ctx.strokeRect(x + radius * 0.07, y - radius * 0.22, radius * 0.35, radius * 0.22);
    } else if ((avatar === 'uedaa_gov' || avatar === 'ueda_gov') && radius >= 26) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - radius * 0.42, y - radius * 0.2, radius * 0.36, radius * 0.22);
      ctx.strokeRect(x + radius * 0.06, y - radius * 0.2, radius * 0.36, radius * 0.22);
    }

    const spriteSize = Math.max(18, Math.floor(radius * 1.15));
    const sy = y - (radius >= 28 ? 4 : 0);
    const drawn = this.drawVectorSprite(spec.emoji || '🔥', x, sy, spriteSize, false);
    if (!drawn) {
      const fontSize = Math.max(15, Math.floor(radius * 0.88));
      ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spec.emoji || '🔥', x, sy);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.22, y - radius * 0.48, radius * 0.38, radius * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();

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
   * RPGバトル用の巨大ボスキャラクター＆ギミック描画
   */
  drawBossSprite(cx, cy, bossSpec, hpRatio, hurtTimer = 0) {
    const ctx = this.ctx;
    ctx.save();

    const floatY = Math.sin(this.tick * 0.07) * 5;
    const shakeX = hurtTimer > 0 ? (Math.random() - 0.5) * 14 : 0;
    const x = cx + shakeX;
    const y = cy + floatY;
    const isPhase2 = hpRatio <= 0.5;
    const visualType = bossSpec.visual_type || 'ai_server_god';

    // 背後のオーラリング
    const auraRadius = 56 + Math.sin(this.tick * 0.1) * 5;
    const auraGrad = ctx.createRadialGradient(x, y, 10, x, y, auraRadius + 18);
    auraGrad.addColorStop(0, isPhase2 ? 'rgba(255, 23, 68, 0.55)' : 'rgba(0, 229, 255, 0.4)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(x, y, auraRadius + 18, 0, Math.PI * 2);
    ctx.fill();

    if (visualType === 'ai_server_god') {
      // 超電力暴食AIデータセンター神「チャッピー9000」
      // 左右の送電ケーブル（庶民の家から電気代を吸い上げる演出）
      ctx.strokeStyle = isPhase2 ? '#ff1744' : '#ffd700';
      ctx.lineWidth = 4;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + dir * 48, y);
        ctx.quadraticCurveTo(x + dir * 110, y - 25 + Math.sin(this.tick * 0.15) * 12, x + dir * 155, y + 32);
        ctx.stroke();

        // 吸い上げられる電気代コイン粒
        const p = (this.tick * 0.04) % 1;
        const px = (x + dir * 155) * (1 - p) + (x + dir * 48) * p;
        const py = (y + 32) * (1 - p) + y * p - Math.sin(p * Math.PI) * 18;
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡¥', px, py);
      }

      // サーバーラック本体
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isPhase2 ? '#ff1744' : '#00e5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - 48, y - 46, 96, 92, 12);
      ctx.fill();
      ctx.stroke();

      // モニター顔（Game-Icons SVGベクター描画）
      ctx.fillStyle = isPhase2 ? '#450a0a' : '#042f2e';
      ctx.fillRect(x - 38, y - 36, 76, 46);
      if (!this.drawVectorSprite('boss_ai_server', x, y - 13, 38, true)) {
        ctx.fillStyle = isPhase2 ? '#ff5252' : '#00e676';
        ctx.font = 'bold 24px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isPhase2 ? '😈⚡' : '😊⚡', x, y - 8);
      }

      // 冷却ファン回転＆消費電力メーター
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(isPhase2 ? '消費電力:原発5基分!!' : '消費電力:原発3基分', x, y + 26);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('託送料金：庶民へ自動転嫁中', x, y + 40);

    } else if (visualType === 'kumagaa_ceo') {
      // 架空・GN〇帝国クマガー社長（ボタン全留め＆命の砂時計＆スライド係）
      // 背後に浮かぶ巨大「命の砂時計」
      ctx.save();
      ctx.translate(x - 78, y - 8);
      ctx.rotate(Math.sin(this.tick * 0.05) * 0.25);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -28, 44, 56, 8);
      ctx.fill();
      ctx.stroke();
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏳', 0, 8);
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('命の砂時計', 0, 24);
      ctx.restore();

      // 右奥で震えるスライド操作係スタッフ
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('😰💻', x + 82, y + 6);
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('スライド係', x + 82, y + 22);

      // 会見演台＆社長アバター
      this.drawRichCharacter(x, y - 6, 44, {
        emoji: isPhase2 ? '🤬' : '🎙️',
        name: 'クマガー社長',
        color: isPhase2 ? '#dc2626' : '#1e3a8a',
        avatar: 'kumagaa_ceo'
      });

      // ボタン全留めスーツ＆会見マイク群
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.fillRect(x - 52, y + 28, 104, 24);
      ctx.strokeRect(x - 52, y + 28, 104, 24);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillText('🎤 GN〇緊急謝罪会見（ボタン全留め）', x, y + 43);

    } else if (visualType === 'shrink_demon') {
      // ステルス値上げ魔王シュリンクス（エベレスト底上げ弁当容器＆20%縮小銃）
      // エベレスト底上げ透明容器ドーム
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x - 58, y - 42, 116, 86, 16);
      ctx.fill();
      ctx.stroke();

      // 底上げの巨大な空洞アーチ描画
      ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
      ctx.beginPath();
      ctx.arc(x, y + 44, 46, Math.PI, 0, false);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.stroke();

      ctx.font = '34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isPhase2 ? '👹🍱' : '🦹‍♂️📉', x, y - 6);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillText('✨おいしくなって新登場(量20%減)✨', x, y + 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillText('【容器の85%がプラスチック底上げ】', x, y + 38);

    } else if (visualType === 'frenemy_queen') {
      // マウント女子四天王・マウンティング麗奈
      this.drawRichCharacter(x, y - 4, 45, {
        emoji: isPhase2 ? '😈📸' : '💅😊',
        name: 'マウント麗奈',
        color: isPhase2 ? '#9333ea' : '#ec4899'
      });
      // 周囲を回る毒セリフオーブ
      const orbAngle = this.tick * 0.05;
      for (let i = 0; i < 2; i++) {
        const ox = x + Math.cos(orbAngle + i * Math.PI) * 76;
        const oy = y + Math.sin(orbAngle + i * Math.PI) * 26;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeStyle = '#f472b6';
        ctx.beginPath();
        ctx.roundRect(ox - 42, oy - 11, 84, 22, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fbcfe8';
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i === 0 ? '個性的だね(笑)' : '半目タグ付け♡', ox, oy + 3);
      }
    } else if (visualType === 'gamer_doctor_god') {
      // 残機99・土管コンティニュー神社長
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.fillRect(x - 86, y - 8, 42, 46);
      ctx.strokeRect(x - 86, y - 8, 42, 46);
      ctx.fillRect(x - 92, y - 16, 54, 14);
      ctx.strokeRect(x - 92, y - 16, 54, 14);
      this.drawRichCharacter(x, y - 6, 44, {
        emoji: isPhase2 ? '👑' : '🩺',
        name: 'クロト神社長',
        color: isPhase2 ? '#9333ea' : '#059669'
      });
      this.drawVectorSprite('boss_gamer_god', x + 76, y - 4, 38, true);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('「ブハハハ！残機99＆土管コンティニュー神！」', x, y + 48);
    } else if (visualType === 'leather_jacket_ceo') {
      // 黒革ジャン社長＆ハニトラ危機
      this.drawRichCharacter(x, y - 6, 45, {
        emoji: isPhase2 ? '📉' : '🧥',
        name: '黒革ジャン社長',
        color: isPhase2 ? '#dc2626' : '#16a34a',
        avatar: 'kumagaa_ceo'
      });
      this.drawVectorSprite('boss_leather_ceo', x - 78, y - 6, 40, true);
      this.drawVectorSprite('boss_ai_core', x + 78, y - 6, 38, true);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('革ジャン辞任危機！？半導体株ナイアガラ警報', x, y + 48);
    } else {
      // SNSおすすめ欄アルゴリズム暴走神
      this.drawRichCharacter(x, y - 4, 45, {
        emoji: isPhase2 ? '👁️' : '🤖',
        name: 'おすすめ欄神',
        color: isPhase2 ? '#dc2626' : '#2563eb'
      });
      this.drawVectorSprite('boss_algo', x + 76, y - 6, 36, true);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('いいね3の身内ポストを1000万人に晒し上げ中', x, y + 48);
    }

    if (hurtTimer > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(x, y, 52, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * RPGバトル中の攻撃・必殺技ビジュアルエフェクト描画
   */
  drawBattleEffect(width, height, effect) {
    if (!effect || effect.timer <= 0) return;
    const ctx = this.ctx;
    const progress = 1 - (effect.timer / effect.maxTimer);
    ctx.save();

    const type = effect.type || 'lightning';

    if (type === 'bill_lightning' || type === 'lightning') {
      // 稲妻＋空から降ってくる高額電気代検針票スタンプ
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        const lx = 90 + i * 110 + (Math.random() - 0.5) * 20;
        ctx.beginPath();
        ctx.moveTo(lx, 40);
        ctx.lineTo(lx - 18, 110);
        ctx.lineTo(lx + 14, 150);
        ctx.lineTo(lx - 10, 230);
        ctx.stroke();
      }
      // 巨大検針票
      const stampY = 70 + progress * 95;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.94)';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(70, stampY, 260, 52, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ 検針票：AI託送料金＋賦課金転嫁 ⚡', 200, stampY + 21);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(effect.bannerText || '今月の請求額：29,800円 (庶民負担)', 200, stampY + 42);

    } else if (type === 'hallucination_beam' || type === 'laser') {
      // 極太レーザービーム演出
      const beamH = 26 + Math.sin(progress * Math.PI) * 24;
      const grad = ctx.createLinearGradient(0, 130, width, 130);
      grad.addColorStop(0, '#00e5ff');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#ff4081');
      ctx.fillStyle = grad;
      ctx.fillRect(20, 135 - beamH / 2, width - 40, beamH);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(effect.bannerText || '🤖「お役に立てて嬉しいです😊（300kW消費）」', 200, 139);

    } else if (type === 'sandglass_poem') {
      // クマガー社長『命の砂時計』黄金回転カットイン
      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.beginPath();
      ctx.arc(200, 140, 40 + progress * 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏳✨', 200, 145);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(effect.bannerText || '「人の一生は『命の砂時計』なのです…」', 200, 192);

    } else if (type === 'shrink_beam') {
      // ステルス値上げ『内容量20%縮小ビーム』
      const scale = Math.max(0.35, 1.1 - progress * 0.75);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(200, 140, 65 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `${Math.floor(48 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🍪🍱', 200, 148);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(effect.bannerText || '✨おいしくなって新登場（サイズ-20%縮小）✨', 200, 195);

    } else if (type === 'sns_roast_strike' || type === 'player_crit') {
      // プレイヤーの万バズ風刺ツッコミ大爆発
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + progress * 3;
        const rx = 200 + Math.cos(angle) * (25 + progress * 55);
        const ry = 135 + Math.sin(angle) * (15 + progress * 35);
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔥💥', rx, ry);
      }
      ctx.fillStyle = '#00e676';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(effect.bannerText || '📣 万バズ正論カウンター炸裂！！', 200, 192);
      ctx.fillText(effect.bannerText || '📣 万バズ正論カウンター炸裂！！', 200, 192);

    } else if (type === 'shield_heal') {
      // 防御・回復バリア
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(200, 155, 45 + Math.sin(progress * Math.PI) * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(effect.bannerText || '🛡️ 庶民の生活防衛バリア発動！', 200, 195);
    }

    ctx.restore();
  }

  drawCutinOverlay(width) {
    if (!this.cutin) return;
    const c = this.cutin;
    const ctx = this.ctx;

    ctx.save();
    const alpha = Math.min(1, c.life * 2.2);
    ctx.globalAlpha = alpha;

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

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${c.badge} ｜ ${c.speaker}`, boxX + 12, boxY + 17);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12.5px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillText(`「${c.quote.slice(0, 27)}」`, boxX + 12, boxY + 39);

    ctx.restore();

    c.life -= 0.015;
    if (c.life <= 0) {
      this.cutin = null;
    }
  }
}

window.RichVisualRenderer = RichVisualRenderer;
