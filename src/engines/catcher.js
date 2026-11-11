/**
 * Engine 4: Catch-Drop (60秒ハイスピード収集＆罠回避エンジン)
 * 参照OSS: HTML5 Canvas Arcade Catcher (MIT/CC0)
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
    const goods = this.goodItems.map(g => `${g.emoji}+${g.score}`).join(' ');
    const bads = this.badItems.map(b => `${b.emoji}${b.score}`).join(' ');
    guide.innerHTML = `<strong>【獲得】</strong> ${goods} ｜ <strong>【危険】</strong> ${bads}`;
  }

  bindEvents() {
    const movePlayer = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      this.playerX = Math.max(36, Math.min(this.width - 36, x));
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
        this.playerX = Math.max(36, this.playerX - 28);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.playerX = Math.min(this.width - 36, this.playerX + 28);
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
    const spawnInterval = isFever ? 18 : 28;

    if (this.frameCount % spawnInterval === 0) {
      const isBad = Math.random() < 0.28;
      const pool = isBad ? this.badItems : this.goodItems;
      const spec = pool[Math.floor(Math.random() * pool.length)];
      if (spec) {
        this.falling.push({
          x: 28 + Math.random() * (this.width - 56),
          y: -20,
          vy: (spec.speed || 3.5) * (isFever ? 1.25 : 1.0),
          isBad,
          spec
        });
      }
    }

    const catcherY = this.height - 48;
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const item = this.falling[i];
      item.y += item.vy;

      const dist = Math.hypot(item.x - this.playerX, item.y - catcherY);
      if (dist < 38) {
        this.score = Math.max(0, this.score + item.spec.score);
        this.cb.onScoreChange(this.score);
        this.audio.playSE(item.isBad ? 'damage' : 'hit');
        this.popups.push({
          x: item.x,
          y: catcherY - 20,
          text: `${item.spec.score > 0 ? '+' : ''}${item.spec.score}`,
          color: item.isBad ? '#ff5252' : '#69f0ae',
          life: 1.0
        });
        this.falling.splice(i, 1);
      } else if (item.y > this.height + 30) {
        this.falling.splice(i, 1);
      }
    }

    this.popups.forEach(p => {
      p.y -= 1.3;
      p.life -= 0.04;
    });
    this.popups = this.popups.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.timeLeft <= 15) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 215, 0, 0.14)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ FEVER TIME! 落下スピード＆出現率UP! ⚡', this.width / 2, 26);
      ctx.restore();
    }

    // Draw falling items
    for (const item of this.falling) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(item.x, item.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = item.isBad ? 'rgba(244, 67, 54, 0.35)' : 'rgba(0, 230, 118, 0.25)';
      ctx.fill();
      ctx.font = '25px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.spec.emoji, item.x, item.y);
      ctx.restore();
    }

    // Draw player basket
    const catcherY = this.height - 48;
    ctx.save();
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.roundRect(this.playerX - 36, catcherY - 18, 72, 36, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.playerSpec.emoji, this.playerX, catcherY);
    ctx.restore();

    // Draw popups
    for (const p of this.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
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
