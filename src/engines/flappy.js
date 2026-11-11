/**
 * Engine 3: Flappy-Dodge (1タップ障害物回避＆アイテム収集エンジン)
 * 参照OSS: pyforgedev/flappy-bird, nebez/floppybird (MIT)
 */
class FlappyGameEngine {
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

    this.playerSpec = theme.player || { emoji: '🐣', name: 'プレイヤー', jump_quotes: ['JUMP!'] };
    this.obstacleWords = theme.obstacles || ['炎上', '罠', 'トラブル'];
    this.collectibles = theme.collectibles || [{ emoji: '🍵', name: 'ボーナス', score: 150 }];

    this.isRunning = false;
    this.score = 0;
    this.timeLeft = 60;
    this.timerInterval = null;
    this.animId = null;

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const bonusText = this.collectibles.map(c => `${c.emoji}${c.name}(+${c.score})`).join(' / ');
    guide.innerHTML = `<strong>【回避ルール】</strong> 地雷ワードの柱を避けて進もう！ ボーナス: ${bonusText}`;
  }

  bindEvents() {
    const doJump = (e) => {
      if (!this.isRunning) return;
      if (e && e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
      if (e && e.preventDefault) e.preventDefault();
      this.bird.vy = -6.8;
      const quotes = this.playerSpec.jump_quotes || ['スルースキル!'];
      this.activeQuote = {
        text: quotes[Math.floor(Math.random() * quotes.length)],
        life: 1.0
      };
      this.audio.playSE('jump');
    };

    this.canvas.addEventListener('mousedown', doJump);
    this.canvas.addEventListener('touchstart', doJump, { passive: false });
    window.addEventListener('keydown', doJump);
  }

  start() {
    this.bird = { x: 90, y: 220, vy: 0, radius: 18 };
    this.pipes = [];
    this.bonuses = [];
    this.frameCount = 0;
    this.score = 0;
    this.timeLeft = 60;
    this.isRunning = true;
    this.activeQuote = null;
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
    this.bird.vy += 0.34;
    this.bird.y += this.bird.vy;

    if (this.bird.y - this.bird.radius < 0) {
      this.bird.y = this.bird.radius;
      this.bird.vy = 0;
    }
    if (this.bird.y + this.bird.radius > this.height) {
      this.finishGame();
      return;
    }

    if (this.frameCount % 85 === 1) {
      const gap = 142;
      const topH = 55 + Math.random() * (this.height - gap - 120);
      const word = this.obstacleWords[Math.floor(Math.random() * this.obstacleWords.length)];
      this.pipes.push({
        x: this.width + 10,
        w: 58,
        topH,
        bottomY: topH + gap,
        word,
        passed: false
      });

      if (Math.random() < 0.65) {
        const spec = this.collectibles[Math.floor(Math.random() * this.collectibles.length)];
        this.bonuses.push({
          x: this.width + 38,
          y: topH + gap / 2,
          radius: 16,
          spec
        });
      }
    }

    for (const p of this.pipes) {
      p.x -= 2.7;

      if (!p.passed && p.x + p.w < this.bird.x) {
        p.passed = true;
        this.score += 120;
        this.cb.onScoreChange(this.score);
        this.audio.playSE('hit');
      }

      // Collision check
      const inX = this.bird.x + this.bird.radius - 4 > p.x && this.bird.x - this.bird.radius + 4 < p.x + p.w;
      const hitTop = this.bird.y - this.bird.radius + 4 < p.topH;
      const hitBottom = this.bird.y + this.bird.radius - 4 > p.bottomY;
      if (inX && (hitTop || hitBottom)) {
        this.finishGame();
        return;
      }
    }
    this.pipes = this.pipes.filter(p => p.x + p.w > -20);

    for (let i = this.bonuses.length - 1; i >= 0; i--) {
      const b = this.bonuses[i];
      b.x -= 2.7;
      const dist = Math.hypot(this.bird.x - b.x, this.bird.y - b.y);
      if (dist < this.bird.radius + b.radius) {
        this.score += b.spec.score;
        this.cb.onScoreChange(this.score);
        this.audio.playSE('merge', 4);
        this.bonuses.splice(i, 1);
      } else if (b.x < -30) {
        this.bonuses.splice(i, 1);
      }
    }

    if (this.activeQuote) {
      this.activeQuote.life -= 0.035;
      if (this.activeQuote.life <= 0) this.activeQuote = null;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw pipes
    for (const p of this.pipes) {
      ctx.fillStyle = '#e53935';
      ctx.strokeStyle = '#ffcdd2';
      ctx.lineWidth = 2;

      ctx.fillRect(p.x, 0, p.w, p.topH);
      ctx.strokeRect(p.x, 0, p.w, p.topH);

      ctx.fillRect(p.x, p.bottomY, p.w, this.height - p.bottomY);
      ctx.strokeRect(p.x, p.bottomY, p.w, this.height - p.bottomY);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.word.slice(0, 5), p.x + p.w / 2, Math.max(18, p.topH - 12));
      ctx.fillText(p.word.slice(0, 5), p.x + p.w / 2, Math.min(this.height - 10, p.bottomY + 20));
    }

    // Draw bonuses
    for (const b of this.bonuses) {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.spec.emoji, b.x, b.y);
    }

    // Draw bird
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd54f';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.playerSpec.emoji, this.bird.x, this.bird.y);
    ctx.restore();

    if (this.activeQuote) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.activeQuote.life);
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(this.activeQuote.text, this.bird.x + 15, this.bird.y - 26);
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

window.FlappyGameEngine = FlappyGameEngine;
