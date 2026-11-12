/**
 * Engine 4: Catch-Drop (60秒ハイスピード収集＆罠回避エンジン - Rich Parody Edition)
 */
class CatcherGameEngine {
  constructor(canvas, theme, audio, sdk, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.audio = audio;
    this.sdk = sdk;
    this.cb = callbacks;

    this.width = 400;
    this.height = 480;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.rich = new window.RichVisualRenderer(this.canvas, this.theme);
    this.playerSpec = theme.player || { emoji: '🔋', name: 'キャッチャー' };
    this.goodItems = theme.good_items || [];
    this.badItems = theme.bad_items || [];

    this.playerX = this.width / 2;
    this.falling = [];
    this.popups = [];
    this.score = 0;
    this.timeLeft = 60;
    this.isRunning = false;
    this.frameCount = 0;
    this.timerInterval = null;
    this.animId = null;

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const goods = this.goodItems.map(g => `<span class="evo-chip">${g.emoji}${g.name}(+${g.score})</span>`).join(' ');
    const bads = this.badItems.map(b => `<span class="evo-chip" style="border-color:#ff5252">${b.emoji}${b.name}(${b.score})</span>`).join(' ');
    guide.innerHTML = `<div style="margin-bottom:4px;"><strong style="color:#00e676">【獲得ターゲット】</strong> ${goods}</div><div><strong style="color:#ff5252">【炎上トラップ】</strong> ${bads}</div>`;
  }

  bindEvents() {
    const movePlayer = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      this.playerX = Math.max(40, Math.min(this.width - 40, x));
    };

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isRunning) movePlayer(e.clientX);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isRunning && e.touches.length > 0) movePlayer(e.touches[0].clientX);
    }, { passive: true });
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.isRunning && e.touches.length > 0) movePlayer(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.playerX = Math.max(40, this.playerX - 28);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.playerX = Math.min(this.width - 40, this.playerX + 28);
      }
    });
  }

  start() {
    this.falling = [];
    this.popups = [];
    this.score = 0;
    this.timeLeft = 60;
    this.frameCount = 0;
    this.isRunning = true;
    this.startTime = Date.now();

    this.cb.onScoreChange(this.score);
    this.cb.onTimeChange(this.timeLeft);
    this.rich.triggerRandomBuzzCutin();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.timeLeft--;
      this.cb.onTimeChange(this.timeLeft);
      if (this.timeLeft <= 0) this.finishGame();
    }, 1000);

    const loop = () => {
      if (!this.isRunning) return;
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  update() {
    this.frameCount++;
    const isFever = this.timeLeft <= 15;
    const spawnInterval = isFever ? 18 : 27;

    if (this.frameCount % spawnInterval === 0) {
      const isBad = Math.random() < 0.3;
      const pool = isBad ? this.badItems : this.goodItems;
      const spec = pool[Math.floor(Math.random() * pool.length)];
      if (spec) {
        this.falling.push({
          x: 32 + Math.random() * (this.width - 64),
          y: -25,
          vy: (spec.speed || 3.5) * (isFever ? 1.25 : 1.0),
          isBad,
          spec
        });
      }
    }

    const catcherY = this.height - 52;
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const item = this.falling[i];
      item.y += item.vy;

      const dist = Math.hypot(item.x - this.playerX, item.y - catcherY);
      if (dist < 42) {
        this.score = Math.max(0, this.score + item.spec.score);
        this.cb.onScoreChange(this.score);
        this.audio.playSE(item.isBad ? 'damage' : 'hit');
        this.popups.push({
          x: item.x,
          y: catcherY - 24,
          text: `${item.spec.name} ${item.spec.score > 0 ? '+' : ''}${item.spec.score}`,
          color: item.isBad ? '#ff5252' : '#69f0ae',
          life: 1.0
        });
        if (item.isBad || item.spec.score >= 400) {
          this.rich.triggerCutin(
            item.spec.name,
            item.spec.quote || (item.isBad ? 'うわぁぁ！直撃ダメージ！！' : '神アイテム大量確保！！'),
            'kumagai',
            item.isBad ? '🚨 炎上被害発生' : '💰 大口獲得速報'
          );
        }
        this.falling.splice(i, 1);
      } else if (item.y > this.height + 35) {
        this.falling.splice(i, 1);
      }
    }

    this.popups.forEach(p => {
      p.y -= 1.3;
      p.life -= 0.035;
    });
    this.popups = this.popups.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    this.rich.drawStageBackground(this.width, this.height);

    if (this.timeLeft <= 15) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 215, 0, 0.14)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ ラスト15秒！大相場フィーバータイム突入！ ⚡', this.width / 2, 26);
      ctx.restore();
    }

    for (const item of this.falling) {
      this.rich.drawRichCharacter(item.x, item.y, 26, {
        emoji: item.spec.emoji,
        name: item.spec.name,
        color: item.isBad ? '#ef4444' : '#10b981',
        avatar: item.spec.avatar
      });
    }

    const catcherY = this.height - 52;
    this.rich.drawRichCharacter(this.playerX, catcherY, 34, {
      emoji: this.playerSpec.emoji,
      name: this.playerSpec.name,
      color: '#f59e0b',
      avatar: this.playerSpec.avatar || 'kiritani_master'
    });

    for (const p of this.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
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
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.animId) cancelAnimationFrame(this.animId);
    this.audio.playSE('gameover');
    const durationSec = Math.max(5, Math.round((Date.now() - this.startTime) / 1000));
    this.cb.onGameOver(this.score, durationSec);
  }
}

window.CatcherGameEngine = CatcherGameEngine;
