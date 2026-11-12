/**
 * Engine 5: Whack-Tap (サーバー侵入ハッカー25波撃退エンジン - タイマー廃止・25撃退ウェーブ制)
 */
class WhackGameEngine {
  constructor(canvas, theme, audio, sdk, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.audio = audio;
    this.sdk = sdk;
    this.cb = callbacks;

    this.width = 400;
    this.height = 460;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.rich = new window.RichVisualRenderer(this.canvas, this.theme);
    this.targets = theme.targets || [];
    this.holes = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        this.holes.push({
          x: 72 + c * 128,
          y: 115 + r * 122,
          activeTarget: null,
          expiresAt: 0
        });
      }
    }

    this.popups = [];
    this.combo = 0;
    this.score = 0;
    this.defeatedCount = 0;
    this.firewallHp = 5;
    this.isRunning = false;
    this.animId = null;

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const info = this.targets.map(t => `<span class="evo-chip">${t.emoji}${t.name}(${t.score > 0 ? '+' : ''}${t.score})</span>`).join(' ');
    guide.innerHTML = `<div style="font-weight:900;color:#ff5252;margin-bottom:4px;">【撃退ターゲット一覧（25体撃退で完全防衛クリア！）】味方は叩くな！</div><div>${info}</div>`;
  }

  bindEvents() {
    const handleTap = (clientX, clientY) => {
      if (!this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      const y = (clientY - rect.top) * (this.height / rect.height);

      for (const h of this.holes) {
        if (!h.activeTarget) continue;
        const dist = Math.hypot(x - h.x, y - h.y);
        if (dist <= 50) {
          const t = h.activeTarget;
          h.activeTarget = null;
          if (t.score > 0) {
            this.combo++;
            this.defeatedCount++;
            const bonus = Math.round(t.score * (1 + Math.min(this.combo, 12) * 0.08));
            this.score += bonus;
            this.audio.playSE('hit');
            this.popups.push({
              x: h.x,
              y: h.y - 28,
              text: `💥 +${bonus} (${this.combo}連撃!)`,
              color: '#ffd700',
              life: 1.0
            });
            this.cb.onTimeChange(`撃退 ${this.defeatedCount}/25`);
            if (this.combo % 4 === 0 || t.score >= 400) {
              this.rich.triggerCutin(
                t.name,
                t.quote || `${t.name}を完全論破・撃退！！`,
                t.avatar || 'kumagaa_ceo',
                `🔥 ${this.combo} COMBO 撃退速報`
              );
            }
            if (this.defeatedCount >= 25) {
              this.score += 1800;
              this.cb.onScoreChange(this.score);
              this.finishGame();
              return;
            }
          } else {
            this.combo = 0;
            this.firewallHp--;
            this.score = Math.max(0, this.score + t.score);
            this.audio.playSE('damage');
            this.popups.push({
              x: h.x,
              y: h.y - 28,
              text: `💦 ${t.score} 味方誤爆!`,
              color: '#ff5252',
              life: 1.0
            });
            this.rich.triggerCutin(t.name, t.quote || '味方のホワイトハッカーを叩いてしまい大炎上！！', 'kumagaa_ceo', '🚨 誤爆アクシデント');
            if (this.firewallHp <= 0) {
              this.finishGame();
              return;
            }
          }
          this.cb.onScoreChange(this.score);
          break;
        }
      }
    };

    this.canvas.addEventListener('mousedown', (e) => handleTap(e.clientX, e.clientY));
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleTap(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  start() {
    this.holes.forEach(h => { h.activeTarget = null; });
    this.popups = [];
    this.combo = 0;
    this.score = 0;
    this.defeatedCount = 0;
    this.firewallHp = 5;
    this.isRunning = true;
    this.startTime = Date.now();

    this.cb.onScoreChange(this.score);
    this.cb.onTimeChange('撃退 0/25');
    this.rich.triggerRandomBuzzCutin();

    const loop = () => {
      if (!this.isRunning) return;
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  update() {
    const now = Date.now();
    let activeCount = 0;
    for (const h of this.holes) {
      if (h.activeTarget && now > h.expiresAt) {
        h.activeTarget = null;
      }
      if (h.activeTarget) activeCount++;
    }

    const maxSimultaneous = this.defeatedCount >= 15 ? 4 : 3;
    if (activeCount < maxSimultaneous && Math.random() < 0.16) {
      const freeHoles = this.holes.filter(h => !h.activeTarget);
      if (freeHoles.length > 0) {
        const hole = freeHoles[Math.floor(Math.random() * freeHoles.length)];
        const spec = this.targets[Math.floor(Math.random() * this.targets.length)];
        hole.activeTarget = spec;
        hole.expiresAt = now + (spec.duration_ms || 950);
      }
    }

    this.popups.forEach(p => {
      p.y -= 1.3;
      p.life -= 0.038;
    });
    this.popups = this.popups.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    this.rich.drawStageBackground(this.width, this.height);

    for (const h of this.holes) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 22, 46, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (h.activeTarget) {
        const isEnemy = h.activeTarget.score > 0;
        this.rich.drawRichCharacter(h.x, h.y - 4, 38, {
          emoji: h.activeTarget.emoji,
          name: h.activeTarget.name,
          color: isEnemy ? '#e11d48' : '#10b981',
          avatar: h.activeTarget.avatar || (isEnemy ? 'kumagaa_ceo' : 'kiritama_master')
        });
      }
    }

    for (const p of this.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 14px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }

    this.rich.drawCutinOverlay(this.width);
  }

  finishGame() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.audio.playSE('gameover');
    const durationSec = Math.max(5, Math.round((Date.now() - this.startTime) / 1000));
    this.cb.onGameOver(this.score, durationSec);
  }
}

window.WhackGameEngine = WhackGameEngine;
