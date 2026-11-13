/**
 * Snake / SnakeIt Engine (ヘビゲーム - 優待チャリ仙人はしご爆走など)
 * PC矢印キー & スマホ上下左右スワイプ/4方向タップ対応（タイマーなし）
 */
class SnakeGameEngine {
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
    this.gridSize = 16;
    this.cell = 22;
    this.offsetX = (this.width - this.gridSize * this.cell) / 2;
    this.offsetY = 58;

    this.running = false;
    this.score = 0;
    this.startTime = 0;
    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = { x: 10, y: 8, spec: null };
    this.stepTimer = 0;

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const items = this.theme.good_items || [];
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">🐍 スワイプ/矢印で回収：</span>` +
      items.map(i => `<span class="evo-step">${i.emoji} ${i.name}</span>`).join('<span class="evo-arrow">｜</span>');
  }

  setupInput() {
    let sx = 0, sy = 0;
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length > 0) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
    }, { passive: true });
    this.canvas.addEventListener('touchend', e => {
      if (!this.running || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        // Tap relative to head
        const rect = this.canvas.getBoundingClientRect();
        const tx = (e.changedTouches[0].clientX - rect.left) * (this.width / rect.width);
        const ty = (e.changedTouches[0].clientY - rect.top) * (this.height / rect.height);
        const hx = this.offsetX + this.snake[0].x * this.cell;
        const hy = this.offsetY + this.snake[0].y * this.cell;
        if (Math.abs(tx - hx) > Math.abs(ty - hy)) this.setDir(tx > hx ? 1 : -1, 0);
        else this.setDir(0, ty > hy ? 1 : -1);
      } else if (Math.abs(dx) > Math.abs(dy)) {
        this.setDir(dx > 0 ? 1 : -1, 0);
      } else {
        this.setDir(0, dy > 0 ? 1 : -1);
      }
    });
    window.addEventListener('keydown', e => {
      if (!this.running) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowUp') this.setDir(0, -1);
      if (e.key === 'ArrowDown') this.setDir(0, 1);
      if (e.key === 'ArrowLeft') this.setDir(-1, 0);
      if (e.key === 'ArrowRight') this.setDir(1, 0);
    });
  }

  setDir(dx, dy) {
    if (this.dir.x === -dx && this.dir.y === -dy) return;
    this.nextDir = { x: dx, y: dy };
  }

  spawnFood() {
    const goods = this.theme.good_items || [{ emoji: '🍱', name: '優待弁当', score: 250 }];
    const spec = goods[Math.floor(Math.random() * goods.length)];
    let fx, fy;
    do {
      fx = Math.floor(Math.random() * this.gridSize);
      fy = Math.floor(Math.random() * this.gridSize);
    } while (this.snake.some(s => s.x === fx && s.y === fy));
    this.food = { x: fx, y: fy, spec };
  }

  start() {
    this.running = true;
    this.score = 0;
    this.startTime = Date.now();
    this.snake = [{ x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.spawnFood();

    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`長さ ${this.snake.length}`);
    this.visual.triggerRandomBuzzCutin();

    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      if (now - last >= 155) {
        last = now;
        this.step();
      }
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  step() {
    this.dir = this.nextDir;
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize ||
        this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.audio.playSE('bad');
      this.finishGame();
      return;
    }
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += Math.abs(this.food.spec.score || 250);
      this.audio.playSE('merge', 2);
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`長さ ${this.snake.length}`);
      if (this.snake.length % 5 === 0) this.visual.triggerRandomBuzzCutin();
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  draw() {
    const ctx = this.ctx;
    this.visual.drawStageBackground(this.width, this.height);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(this.offsetX, this.offsetY, this.gridSize * this.cell, this.gridSize * this.cell);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.offsetX, this.offsetY, this.gridSize * this.cell, this.gridSize * this.cell);

    // Food
    const fx = this.offsetX + this.food.x * this.cell + this.cell / 2;
    const fy = this.offsetY + this.food.y * this.cell + this.cell / 2;
    this.visual.drawRichCharacter(fx, fy, 11, { emoji: this.food.spec.emoji, color: '#00e676' });

    // Snake
    const pEmoji = (this.theme.player && this.theme.player.emoji) || '🚲';
    this.snake.forEach((seg, idx) => {
      const sx = this.offsetX + seg.x * this.cell + this.cell / 2;
      const sy = this.offsetY + seg.y * this.cell + this.cell / 2;
      if (idx === 0) {
        this.visual.drawRichCharacter(sx, sy, 12, { emoji: pEmoji, color: '#38bdf8' });
      } else {
        ctx.fillStyle = idx % 2 === 0 ? '#0ea5e9' : '#0284c7';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 11px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('上下左右スワイプ / 矢印キーで操作（壁と自分に注意！）', this.width / 2, this.height - 22);
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

window.SnakeGameEngine = SnakeGameEngine;
