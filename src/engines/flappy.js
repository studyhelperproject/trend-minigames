/**
 * Engine 3: Flappy-Dodge (1タップ障害物回避＆アイテム収集エンジン - Rich Parody Edition)
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

    this.rich = new window.RichVisualRenderer(this.canvas, this.theme);
    this.playerSpec = theme.player || { emoji: '🐣', name: 'プレイヤー', color: '#ffd54f', jump_quotes: ['JUMP!'] };
    this.obstacleWords = theme.obstacles || ['炎上', '罠', 'トラブル'];
    this.collectibles = theme.collectibles || [{ emoji: '🍵', name: 'ボーナス', score: 150, color: '#00e676' }];

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
    const bonusText = this.collectibles.map(c => `<span class="evo-chip">${c.emoji}${c.name}(+${c.score})</span>`).join(' ');
    guide.innerHTML = `<div style="font-weight:900;color:#ffca28;margin-bottom:4px;">【バズり地雷回避ルール】</div><div>炎上柱をかわして進もう！ 獲得アイテム: ${bonusText}</div>`;
  }

  bindEvents() {
    const doJump = (e) => {
      if (!this.isRunning) return;
      if (e && e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
      if (e && e.preventDefault) e.preventDefault();
      this.bird.vy = -6.6;
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
    this.bird = { x: 92, y: 220, vy: 0, radius: 22 };
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
    this.bird.vy += 0.33;
    this.bird.y += this.bird.vy;

    if (this.bird.y - this.bird.radius < 0) {
      this.bird.y = this.bird.radius;
      this.bird.vy = 0;
    }
    if (this.bird.y + this.bird.radius > this.height) {
      this.finishGame();
      return;
    }

    if (this.frameCount % 88 === 1) {
      const gap = 148;
      const topH = 60 + Math.random() * (this.height - gap - 125);
      const word = this.obstacleWords[Math.floor(Math.random() * this.obstacleWords.length)];
      this.pipes.push({
        x: this.width + 10,
        w: 66,
        topH,
        bottomY: topH + gap,
        word,
        passed: false
      });

      if (Math.random() < 0.72) {
        const spec = this.collectibles[Math.floor(Math.random() * this.collectibles.length)];
        this.bonuses.push({
          x: this.width + 42,
          y: topH + gap / 2,
          radius: 20,
          spec
        });
      }
    }

    for (const p of this.pipes) {
      p.x -= 2.65;

      if (!p.passed && p.x + p.w < this.bird.x) {
        p.passed = true;
        this.score += 140;
        this.cb.onScoreChange(this.score);
        this.audio.playSE('hit');
        if (this.score % 420 === 0) {
          this.rich.triggerRandomBuzzCutin();
        }
      }

      const inX = this.bird.x + this.bird.radius - 5 > p.x && this.bird.x - this.bird.radius + 5 < p.x + p.w;
      const hitTop = this.bird.y - this.bird.radius + 5 < p.topH;
      const hitBottom = this.bird.y + this.bird.radius - 5 > p.bottomY;
      if (inX && (hitTop || hitBottom)) {
        this.finishGame();
        return;
      }
    }
    this.pipes = this.pipes.filter(p => p.x + p.w > -20);

    for (let i = this.bonuses.length - 1; i >= 0; i--) {
      const b = this.bonuses[i];
      b.x -= 2.65;
      const dist = Math.hypot(this.bird.x - b.x, this.bird.y - b.y);
      if (dist < this.bird.radius + b.radius) {
        this.score += b.spec.score;
        this.cb.onScoreChange(this.score);
        this.audio.playSE('merge', 4);
        this.rich.triggerCutin(b.spec.name, b.spec.quote || `${b.spec.name}を無事確保！`, 'fan', '✨ 神アイテム確保');
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
    this.rich.drawStageBackground(this.width, this.height);

    for (const p of this.pipes) {
      const grad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      grad.addColorStop(0, '#991b1b');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;

      ctx.fillRect(p.x, 0, p.w, p.topH);
      ctx.strokeRect(p.x, 0, p.w, p.topH);

      ctx.fillRect(p.x, p.bottomY, p.w, this.height - p.bottomY);
      ctx.strokeRect(p.x, p.bottomY, p.w, this.height - p.bottomY);

      // 炎上ワードプレート
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(p.x - 6, Math.max(8, p.topH - 28), p.w + 12, 22);
      ctx.fillRect(p.x - 6, Math.min(this.height - 28, p.bottomY + 6), p.w + 12, 22);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 10px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.word.slice(0, 7), p.x + p.w / 2, Math.max(22, p.topH - 14));
      ctx.fillText(p.word.slice(0, 7), p.x + p.w / 2, Math.min(this.height - 14, p.bottomY + 20));
    }

    for (const b of this.bonuses) {
      this.rich.drawRichCharacter(b.x, b.y, b.radius, {
        emoji: b.spec.emoji,
        name: b.spec.name,
        color: '#00e676'
      });
    }

    this.rich.drawRichCharacter(this.bird.x, this.bird.y, this.bird.radius, {
      emoji: this.playerSpec.emoji,
      name: this.playerSpec.name,
      color: this.playerSpec.color || '#f59e0b'
    });

    if (this.activeQuote) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.activeQuote.life);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(this.bird.x + 18, this.bird.y - 42, 130, 24, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 11px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.activeQuote.text, this.bird.x + 83, this.bird.y - 26);
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

window.FlappyGameEngine = FlappyGameEngine;
