/**
 * Breakout / BrickIt Engine (ブロック崩し - ステルス値上げ底上げ容器破壊など)
 * PCマウス/キーボード & スマホタッチドラッグ対応、ライフ3制（タイマーなし）
 */
class BreakoutGameEngine {
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
    this.lives = 3;
    this.startTime = 0;
    this.popups = [];

    this.paddle = { w: 86, h: 14, x: (this.width - 86) / 2, y: this.height - 38 };
    this.ball = { x: this.width / 2, y: this.height - 60, r: 8, vx: 3.4, vy: -3.8 };
    this.bricks = [];
    this.keys = { left: false, right: false };

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const targets = this.theme.targets || [];
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">🧱 ブロック崩しターゲット：</span>` +
      targets.map(t => `<span class="evo-step">${t.emoji} ${t.name}</span>`).join('<span class="evo-arrow">｜</span>');
  }

  setupInput() {
    const moveTo = (clientX) => {
      if (!this.running) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      this.paddle.x = Math.max(8, Math.min(this.width - this.paddle.w - 8, x - this.paddle.w / 2));
    };
    this.canvas.addEventListener('mousemove', e => moveTo(e.clientX));
    this.canvas.addEventListener('touchmove', e => {
      if (e.touches.length > 0) {
        e.preventDefault();
        moveTo(e.touches[0].clientX);
      }
    }, { passive: false });
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length > 0) moveTo(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
    });
    window.addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
    });
  }

  initBricks() {
    this.bricks = [];
    const targets = this.theme.targets || [
      { emoji: '🍱', name: '底上げ容器', score: 150, color: '#ef4444' },
      { emoji: '📉', name: '内容量20%減', score: 200, color: '#f59e0b' },
      { emoji: '🗯️', name: '謎ポエム', score: 250, color: '#ec4899' }
    ];
    const cols = 5;
    const rows = 4;
    const bw = 68;
    const bh = 28;
    const gap = 7;
    const offsetX = (this.width - (cols * bw + (cols - 1) * gap)) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spec = targets[(r + c) % targets.length];
        this.bricks.push({
          x: offsetX + c * (bw + gap),
          y: 56 + r * (bh + gap),
          w: bw,
          h: bh,
          alive: true,
          spec
        });
      }
    }
  }

  start() {
    this.running = true;
    this.score = 0;
    this.lives = 3;
    this.startTime = Date.now();
    this.popups = [];
    this.paddle.x = (this.width - this.paddle.w) / 2;
    this.resetBall();
    this.initBricks();

    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`❤️×${this.lives} 残${this.bricks.length}`);
    this.visual.triggerRandomBuzzCutin();

    const loop = () => {
      if (!this.running) return;
      this.update();
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  resetBall() {
    this.ball.x = this.width / 2;
    this.ball.y = this.height - 62;
    this.ball.vx = (Math.random() < 0.5 ? -1 : 1) * (3.1 + Math.random() * 0.8);
    this.ball.vy = -4.0;
  }

  update() {
    if (this.keys.left) this.paddle.x = Math.max(8, this.paddle.x - 6);
    if (this.keys.right) this.paddle.x = Math.min(this.width - this.paddle.w - 8, this.paddle.x + 6);

    const b = this.ball;
    b.x += b.vx;
    b.y += b.vy;

    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); this.audio.playSE('drop'); }
    if (b.x + b.r > this.width) { b.x = this.width - b.r; b.vx = -Math.abs(b.vx); this.audio.playSE('drop'); }
    if (b.y - b.r < 36) { b.y = 36 + b.r; b.vy = Math.abs(b.vy); this.audio.playSE('drop'); }

    // Paddle collision
    if (b.vy > 0 && b.y + b.r >= this.paddle.y && b.y - b.r <= this.paddle.y + this.paddle.h &&
        b.x >= this.paddle.x - 4 && b.x <= this.paddle.x + this.paddle.w + 4) {
      const hitPos = (b.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
      b.vx = hitPos * 4.8;
      b.vy = -Math.min(6.2, Math.abs(b.vy) * 1.03);
      b.y = this.paddle.y - b.r;
      this.audio.playSE('jump');
    }

    // Brick collision
    let aliveCount = 0;
    for (const br of this.bricks) {
      if (!br.alive) continue;
      aliveCount++;
      if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
        br.alive = false;
        aliveCount--;
        b.vy = -b.vy;
        const pts = Math.abs(br.spec.score || 200);
        this.score += pts;
        this.audio.playSE('hit');
        this.visual.shakeAmount = 4;
        this.popups.push({ x: br.x + br.w / 2, y: br.y, text: `+${pts} ${br.spec.name}`, color: '#fde047', life: 36 });
        if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
        if (aliveCount % 6 === 0) this.visual.triggerRandomBuzzCutin();
        break;
      }
    }

    if (aliveCount === 0) {
      this.score += 3000 + this.lives * 500;
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      this.audio.playSE('milestone');
      this.finishGame();
      return;
    }

    // Miss
    if (b.y - b.r > this.height) {
      this.lives--;
      this.audio.playSE('bad');
      this.visual.shakeAmount = 8;
      if (this.lives <= 0) {
        this.finishGame();
        return;
      }
      this.resetBall();
    }

    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`❤️×${this.lives} 残${aliveCount}`);
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].y -= 1.1;
      this.popups[i].life--;
      if (this.popups[i].life <= 0) this.popups.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    this.visual.drawStageBackground(this.width, this.height);

    // Top status bar
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, this.width, 34);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🧱 残りブロック: ${this.bricks.filter(b => b.alive).length}個`, 12, 22);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff80ab';
    ctx.fillText(`❤️ ライフ: ${'❤️'.repeat(this.lives)}`, this.width - 12, 22);

    // Bricks
    for (const br of this.bricks) {
      if (!br.alive) continue;
      ctx.fillStyle = br.spec.color || '#ef4444';
      ctx.beginPath();
      ctx.roundRect(br.x, br.y, br.w, br.h, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (!this.visual.drawVectorSprite(br.spec.emoji || '🍱', br.x + 16, br.y + br.h / 2, 18, false)) {
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(br.spec.emoji || '🍱', br.x + 16, br.y + br.h / 2 + 5);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8.5px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText((br.spec.name || '').slice(0, 5), br.x + 27, br.y + 18);
    }

    // Paddle
    const pGrad = ctx.createLinearGradient(this.paddle.x, this.paddle.y, this.paddle.x + this.paddle.w, this.paddle.y);
    pGrad.addColorStop(0, '#00e5ff');
    pGrad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, 7);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ball
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    for (const p of this.popups) {
      ctx.fillStyle = p.color;
      ctx.font = 'bold 12px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
    }

    this.visual.drawCutinOverlay(this.width);
  }

  finishGame() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
    const sec = Math.max(10, Math.round((Date.now() - this.startTime) / 1000));
    this.audio.playSE('gameover');
    if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score, sec);
  }
}

window.BreakoutGameEngine = BreakoutGameEngine;
