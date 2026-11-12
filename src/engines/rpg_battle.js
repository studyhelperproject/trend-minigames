/**
 * Satirical Turn-Based Command RPG Battle Engine (1分完結・タイマーなし・風刺コマンドバトル)
 * 時事ネタの理不尽ボス（暴食AI神・クマガー社長・ステルス値上げ魔王・マウント女子・おすすめ欄神）と
 * 攻撃エフェクト＆SNS万バズ皮肉コメントで戦うターン制コマンドRPGエンジン
 */
class RpgBattleGameEngine {
  constructor(canvas, theme, audio, sdk, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.audio = audio;
    this.sdk = sdk;
    this.callbacks = callbacks || {};
    this.visual = new window.RichVisualRenderer(this.canvas, this.theme);

    this.width = canvas.width;
    this.height = canvas.height;

    this.running = false;
    this.score = 0;
    this.turn = 1;
    this.startTime = 0;
    this.phase2Triggered = false;

    const bossCfg = theme.boss || {};
    this.bossMaxHp = bossCfg.max_hp || 10000;
    this.bossHp = this.bossMaxHp;
    this.bossName = bossCfg.name || '理不尽時事ボス';
    this.bossTitle = bossCfg.title || 'Lv.99 世相の怪物';

    const playerCfg = theme.player || {};
    this.playerMaxHp = playerCfg.max_hp || 5000;
    this.playerHp = this.playerMaxHp;
    this.playerName = playerCfg.name || '善良な庶民';
    this.satireGauge = 40; // 100%で超必殺奥義解放
    this.shieldActive = false;

    this.state = 'PLAYER_INPUT'; // PLAYER_INPUT | PLAYER_ANIM | BOSS_ANIM | ENDING
    this.activeEffect = null;
    this.bossHurtTimer = 0;
    this.playerHurtTimer = 0;
    this.popups = [];

    this.logLines = [
      `⚠️ ${this.bossTitle}『${this.bossName}』が現れた！`,
      bossCfg.intro_quote || '「庶民の財布とメンタルを吸い尽くしてやろう！」'
    ];
    this.snsComment = (theme.sns_top_reactions && theme.sns_top_reactions[0]) ||
      '💬 SNS民「開始0秒から理不尽すぎて草も生えない」';

    this.skills = theme.player_skills || [
      {
        name: '⚡ ブレーカー遮断斬り',
        sub: '安定ダメージ＋ゲージ+35%',
        type: 'attack',
        power: 2100,
        effect: 'player_crit',
        log: '暖房を切って着る毛布を纏い、送電拒否カウンターを叩き込んだ！',
        sns: '💬 SNS民「AIが賢くなるたび俺の部屋の暖房が消えるのバグだろｗ」'
      },
      {
        name: '📣 万バズ皮肉ツッコミ',
        sub: '会心風刺ダメージ＋ゲージ+45%',
        type: 'roast',
        power: 2750,
        effect: 'sns_roast_strike',
        log: '「データセンターの排熱で焼き芋焼いて配れ！」正論パンチが直撃！',
        sns: '💬 SNS民「AIに節電方法聞いたら、その回答の電力で俺の電気代が3円上がった」'
      },
      {
        name: '🛡️ 窓にプチプチ断熱壁',
        sub: 'HP回復＋次ターン被ダメ半減',
        type: 'heal',
        heal: 2100,
        effect: 'shield_heal',
        log: '窓に梱包用プチプチを貼り、電気代高騰レーザーを跳ね返す結界を張った！',
        sns: '💬 SNS民「令和の最新テクノロジー時代になぜ庶民はプチプチで防寒してるのか」'
      },
      {
        name: '💥 奥義：LANケーブル抜刀',
        sub: '【ゲージ100%】超特大4800ダメ',
        type: 'ult',
        power: 4800,
        effect: 'sns_roast_strike',
        log: '【超必殺】「自分の電気代は自分でポイ活して稼げ！」無断コンセント抜刀奥義！！',
        sns: '💬 SNS民「令和の百姓一揆は竹槍じゃなくてサーバーのLANケーブル抜きで草」'
      }
    ];

    this.bossAttacks = theme.boss_attacks || [
      {
        name: '『ハルシネーション知ったかぶり長文回答』',
        damage: 1450,
        effect: 'hallucination_beam',
        banner: '🤖「お役に立てて嬉しいです😊（原発3基分稼働）」',
        log: 'AIが頼んでもいないポエム長文を生成！送電線の託送料金があなたの検針票に上乗せされた！',
        sns: '💬 SNS民「『お役に立てて嬉しいです😊』じゃねえよ、1文字ごとにチャリンチャリン鳴ってるぞ」'
      },
      {
        name: '『補助金しれっと終了＆再エネ賦課金サンダー』',
        damage: 1750,
        effect: 'bill_lightning',
        banner: '⚡検針票：29,800円（託送料金転嫁）⚡',
        log: '「ここからは自己負担でヨロシクｗ」超高圧の電気代請求書が脳天に直撃した！',
        sns: '💬 SNS民「電気代の内訳見たら、俺が使った電気より謎の賦課金と託送料の方が元気で泣いた」'
      },
      {
        name: '『深夜のどうでもいい愚痴相談1億件処理』',
        damage: 1600,
        effect: 'hallucination_beam',
        banner: '🔥冷却水沸騰！サーバー排熱ストーム🔥',
        log: '世界中の暇人の愚痴をAIが処理し、冷却ファンの排熱と電力請求が庶民を襲う！',
        sns: '💬 SNS民「他人がAIとイチャイチャした電気代をなぜ俺の口座から引き落とすのか」'
      }
    ];

    this.buttonRects = [
      { x: 10, y: 356, w: 186, h: 54, idx: 0 },
      { x: 204, y: 356, w: 186, h: 54, idx: 1 },
      { x: 10, y: 416, w: 186, h: 54, idx: 2 },
      { x: 204, y: 416, w: 186, h: 54, idx: 3 }
    ];

    this.setupInput();
    this.renderEvolutionBanner();
  }

  renderEvolutionBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">⚔️ 風刺コマンドRPG（時間制限なし・約1分完結）：</span>` +
      this.skills.map(s => `<span class="evo-step">${s.name}</span>`).join('<span class="evo-arrow">｜</span>');
  }

  setupInput() {
    const handleTap = (clientX, clientY) => {
      if (!this.running || this.state !== 'PLAYER_INPUT') return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      for (const b of this.buttonRects) {
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          this.executePlayerSkill(b.idx);
          break;
        }
      }
    };

    this.canvas.addEventListener('click', (e) => handleTap(e.clientX, e.clientY));
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleTap(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  start() {
    this.running = true;
    this.score = 0;
    this.turn = 1;
    this.startTime = Date.now();
    this.phase2Triggered = false;
    this.bossHp = this.bossMaxHp;
    this.playerHp = this.playerMaxHp;
    this.satireGauge = 45;
    this.shieldActive = false;
    this.state = 'PLAYER_INPUT';
    this.popups = [];

    const bossCfg = this.theme.boss || {};
    this.logLines = [
      `⚠️ ${this.bossTitle}『${this.bossName}』が立ちはだかった！`,
      bossCfg.intro_quote || '「コマンドを選んで理不尽な世相を論破せよ！」'
    ];

    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`TURN 1`);

    this.visual.triggerRandomBuzzCutin();

    const loop = () => {
      if (!this.running) return;
      this.update();
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  addPopup(x, y, text, color = '#fde047') {
    this.popups.push({ x, y, text, color, vy: -1.4, life: 48 });
  }

  executePlayerSkill(skillIdx) {
    const skill = this.skills[skillIdx];
    if (!skill) return;

    // 奥義（idx 3）でゲージ不足の場合は溜め攻撃になる
    if (skill.type === 'ult' && this.satireGauge < 100) {
      this.audio.playSE('drop');
      this.satireGauge = Math.min(100, this.satireGauge + 45);
      const jabDmg = Math.round(950 + Math.random() * 250);
      this.bossHp = Math.max(0, this.bossHp - jabDmg);
      this.bossHurtTimer = 18;
      this.score += jabDmg;
      this.addPopup(200, 125, `-${jabDmg} (風刺チャージ!)`, '#38bdf8');
      this.logLines = [
        `🔥 奥義ゲージを急速チャージ！（現在 ${this.satireGauge}%）`,
        `牽制ツッコミで ${jabDmg} ダメージを与えた！`
      ];
      this.snsComment = skill.sns;
      this.activeEffect = { type: 'player_crit', timer: 32, maxTimer: 32, bannerText: '🔥 風刺ツッコミゲージ急速充填！' };
      this.state = 'PLAYER_ANIM';
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      return;
    }

    this.state = 'PLAYER_ANIM';

    if (skill.type === 'heal') {
      this.audio.playSE('reward');
      const healAmt = skill.heal || 2000;
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + healAmt);
      this.shieldActive = true;
      this.satireGauge = Math.min(100, this.satireGauge + 30);
      this.score += 1200;
      this.addPopup(200, 235, `+${healAmt} HP回復 & 防御壁!`, '#00e676');
      this.logLines = [
        `${skill.name}！`,
        `${skill.log}（HP +${healAmt} 回復＆次ターン被ダメ半減）`
      ];
      this.snsComment = skill.sns;
      this.activeEffect = {
        type: 'shield_heal',
        timer: 38,
        maxTimer: 38,
        bannerText: `🛡️ ${skill.name}発動！`
      };
    } else {
      const isUlt = skill.type === 'ult';
      const isCrit = isUlt || Math.random() < 0.35;
      if (isUlt) {
        this.satireGauge = 0;
        this.audio.playSE('milestone');
        this.visual.triggerRandomBuzzCutin();
      } else {
        this.satireGauge = Math.min(100, this.satireGauge + (skill.type === 'roast' ? 45 : 35));
        this.audio.playSE('merge', isCrit ? 4 : 2);
      }

      const basePower = skill.power || 2200;
      const dmg = Math.round(basePower * (isCrit ? 1.32 : 1.0) * (0.93 + Math.random() * 0.14));
      this.bossHp = Math.max(0, this.bossHp - dmg);
      this.bossHurtTimer = 28;
      this.visual.shakeAmount = isUlt ? 14 : 8;

      const bonusScore = isUlt ? dmg + 2500 : dmg;
      this.score += bonusScore;

      this.addPopup(
        200 + (Math.random() - 0.5) * 40,
        120,
        isCrit ? `💥 CRITICAL -${dmg.toLocaleString()}!!` : `-${dmg.toLocaleString()} DMG!`,
        isUlt ? '#ffd700' : '#00e676'
      );

      this.logLines = [
        `${skill.name}！ ${isCrit ? '【痛恨の風刺クリティカル！】' : ''}`,
        `${skill.log}（${dmg.toLocaleString()} ダメージ！）`
      ];
      this.snsComment = skill.sns;
      this.activeEffect = {
        type: skill.effect || 'sns_roast_strike',
        timer: 42,
        maxTimer: 42,
        bannerText: isUlt ? `💥 超必殺！${skill.name}！！` : `📣 ${skill.name}！`
      };
    }

    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
  }

  startBossTurn() {
    if (this.bossHp <= 0) {
      // ボス撃破ボーナス！
      const clearBonus = 6000 + this.playerHp;
      this.score += clearBonus;
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      this.audio.playSE('milestone');
      this.addPopup(200, 120, `🎉 完全論破ボーナス +${clearBonus.toLocaleString()}!`, '#ffd700');
      this.logLines = [
        `🎉 完全勝利！『${this.bossName}』を完全に論破・撃退した！！`,
        `残り家計・メンタルボーナス +${clearBonus.toLocaleString()} PTS 獲得！`
      ];
      this.state = 'ENDING';
      setTimeout(() => this.finishGame(), 1300);
      return;
    }

    // ボスHP50%以下で第二形態カットイン
    if (!this.phase2Triggered && this.bossHp <= this.bossMaxHp * 0.5) {
      this.phase2Triggered = true;
      const bossCfg = this.theme.boss || {};
      this.visual.triggerCutin(
        this.bossName,
        bossCfg.phase2_quote || '「ここからが本当の理不尽（第二形態）だ！！」',
        bossCfg.avatar || 'kumagaa_ceo',
        '🔥 ボス逆ギレ第二形態'
      );
    }

    this.state = 'BOSS_ANIM';
    const atk = this.bossAttacks[Math.floor(Math.random() * this.bossAttacks.length)];
    let dmg = Math.round((atk.damage || 1600) * (this.phase2Triggered ? 1.2 : 1.0) * (0.9 + Math.random() * 0.2));
    if (this.shieldActive) {
      dmg = Math.round(dmg * 0.45);
      this.shieldActive = false;
    }

    this.playerHp = Math.max(0, this.playerHp - dmg);
    this.playerHurtTimer = 24;
    this.satireGauge = Math.min(100, this.satireGauge + 25);
    this.visual.shakeAmount = 10;
    this.audio.playSE('bad');

    this.addPopup(200, 235, `⚡ -${dmg.toLocaleString()} 理不尽ダメージ!`, '#ff5252');
    this.logLines = [
      `⚠️ ${this.bossName}の攻撃：${atk.name}！`,
      `${atk.log}（-${dmg.toLocaleString()} ダメージ）`
    ];
    this.snsComment = atk.sns || this.snsComment;

    this.activeEffect = {
      type: atk.effect || 'bill_lightning',
      timer: 44,
      maxTimer: 44,
      bannerText: atk.banner || atk.name
    };
  }

  update() {
    if (this.bossHurtTimer > 0) this.bossHurtTimer--;
    if (this.playerHurtTimer > 0) this.playerHurtTimer--;

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.popups.splice(i, 1);
    }

    if (this.activeEffect) {
      this.activeEffect.timer--;
      if (this.activeEffect.timer <= 0) {
        const finishedState = this.state;
        this.activeEffect = null;

        if (finishedState === 'PLAYER_ANIM') {
          this.startBossTurn();
        } else if (finishedState === 'BOSS_ANIM') {
          if (this.playerHp <= 0) {
            this.logLines = [
              `💀 家計・メンタルHPが0になった…！`,
              `しかしあなたの風刺バトル記録はSNSで拡散された！`
            ];
            this.state = 'ENDING';
            setTimeout(() => this.finishGame(), 1200);
          } else {
            this.turn++;
            if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`TURN ${this.turn}`);
            this.state = 'PLAYER_INPUT';
          }
        }
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    this.visual.drawStageBackground(this.width, this.height);

    // 1. ボスステータスヘッダー枠 (y: 6..52)
    ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
    ctx.strokeStyle = this.phase2Triggered ? '#ff1744' : '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 6, this.width - 20, 46, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 10px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.bossTitle} ｜ ${this.bossName}`, 20, 22);

    const hpRatio = Math.max(0, this.bossHp / this.bossMaxHp);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 29, this.width - 135, 14);
    const hpGrad = ctx.createLinearGradient(20, 29, 20 + (this.width - 135) * hpRatio, 29);
    hpGrad.addColorStop(0, '#ef4444');
    hpGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(20, 29, (this.width - 135) * hpRatio, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 29, this.width - 135, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`HP ${this.bossHp.toLocaleString()}/${this.bossMaxHp.toLocaleString()}`, this.width - 18, 40);

    // 2. ボスキャラクター＆背景ギミック描画 (中心 y: 122)
    this.visual.drawBossSprite(200, 122, this.theme.boss || {}, hpRatio, this.bossHurtTimer);

    // 3. バトル攻撃エフェクト描画
    if (this.activeEffect) {
      this.visual.drawBattleEffect(this.width, this.height, this.activeEffect);
    }

    // 4. プレイヤーHP＆風刺必殺ゲージバー (y: 214..250)
    ctx.fillStyle = this.playerHurtTimer > 0 ? 'rgba(185, 28, 28, 0.92)' : 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = this.shieldActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(10, 212, this.width - 20, 38, 9);
    ctx.fill();
    ctx.stroke();

    // プレイヤーHP
    const pRatio = Math.max(0, this.playerHp / this.playerMaxHp);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🛡️ ${this.playerName} HP: ${this.playerHp}/${this.playerMaxHp}`, 18, 227);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(18, 232, 175, 10);
    ctx.fillStyle = pRatio > 0.35 ? '#00e676' : '#ff1744';
    ctx.fillRect(18, 232, 175 * pRatio, 10);

    // 風刺ツッコミ必殺ゲージ
    const gRatio = Math.min(1, this.satireGauge / 100);
    ctx.fillStyle = this.satireGauge >= 100 ? '#fde047' : '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText(`🔥 風刺奥義ゲージ: ${this.satireGauge}%`, 208, 227);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(208, 232, 170, 10);
    ctx.fillStyle = this.satireGauge >= 100 ? '#ffd700' : '#ec4899';
    ctx.fillRect(208, 232, 170 * gRatio, 10);

    // 5. RPG実況メッセージ＆SNSバズ反応ウィンドウ (y: 255..350)
    ctx.fillStyle = 'rgba(6, 9, 17, 0.94)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 255, this.width - 20, 94, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11.5px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'left';
    this.wrapText(ctx, this.logLines[0] || '', 20, 274, this.width - 40, 15);
    ctx.fillStyle = '#fde047';
    this.wrapText(ctx, this.logLines[1] || '', 20, 294, this.width - 40, 15);

    // SNSの反応バー
    ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.fillRect(16, 322, this.width - 32, 21);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillText(this.snsComment.slice(0, 36), 22, 336);

    // 6. 4コマンド選択ボタン描画 (y: 356..470)
    for (const b of this.buttonRects) {
      const sk = this.skills[b.idx];
      if (!sk) continue;
      const isUlt = sk.type === 'ult';
      const ultReady = isUlt && this.satireGauge >= 100;
      const disabled = this.state !== 'PLAYER_INPUT';

      ctx.save();
      if (disabled) ctx.globalAlpha = 0.55;

      const btnGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      if (ultReady) {
        btnGrad.addColorStop(0, '#dc2626');
        btnGrad.addColorStop(1, '#991b1b');
      } else if (sk.type === 'heal') {
        btnGrad.addColorStop(0, '#0f766e');
        btnGrad.addColorStop(1, '#115e59');
      } else {
        btnGrad.addColorStop(0, '#1e293b');
        btnGrad.addColorStop(1, '#0f172a');
      }

      ctx.fillStyle = btnGrad;
      ctx.strokeStyle = ultReady ? '#ffd700' : (sk.type === 'roast' ? '#ff80ab' : '#38bdf8');
      ctx.lineWidth = ultReady ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = ultReady ? '#fde047' : '#ffffff';
      ctx.font = 'bold 12px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(sk.name.slice(0, 14), b.x + 10, b.y + 23);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 9.5px "Hiragino Kaku Gothic ProN", sans-serif';
      const subText = (isUlt && !ultReady) ? `⚡タップでゲージ充填(${this.satireGauge}%)` : sk.sub;
      ctx.fillText(subText.slice(0, 19), b.x + 10, b.y + 42);

      ctx.restore();
    }

    // 7. ダメージポップアップ描画
    for (const p of this.popups) {
      ctx.save();
      ctx.font = 'bold 14px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }

    // 8. 緊急速報カットインオーバーレイ
    this.visual.drawCutinOverlay(this.width);
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const str = String(text);
    if (ctx.measureText(str).width <= maxWidth) {
      ctx.fillText(str, x, y);
      return;
    }
    ctx.fillText(str.slice(0, 31) + '…', x, y);
  }

  finishGame() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
    const elapsedSec = Math.max(10, Math.round((Date.now() - this.startTime) / 1000));
    this.audio.playSE('gameover');
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver(this.score, elapsedSec);
    }
  }
}

window.RpgBattleGameEngine = RpgBattleGameEngine;
