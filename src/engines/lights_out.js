/**
 * Lights Out Engine (全灯消去論理パズル - SNS炎上鎮火・電力節電など)
 * 4x4盤面、タップしたマスと上下左右が反転。すべて消灯（鎮火）させるとクリア！
 */
class LightsOutGameEngine {
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
    this.size = 4;
    this.cell = 78;
    this.boardX = (this.width - this.size * this.cell) / 2;
    this.boardY = 86;

    this.grid = [];
    this.moves = 0;
    this.score = 0;
    this.running = false;
    this.startTime = 0;

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">💡 論理反転パズル：</span>` +
      `<span class="evo-step">タップしたマスと上下左右が反転！すべて消灯で完全クリア</span>`;
  }

  setupInput() {
    this.canvas.addEventListener('click', e => {
      if (!this.running) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      const c = Math.floor((x - this.boardX) / this.cell);
      const r = Math.floor((y - this.boardY) / this.cell);
      if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
        this.toggle(r, c, true);
      }
    });
  }

  toggle(r, c, countMove = false) {
    const dirs = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
        this.grid[nr][nc] = !this.grid[nr][nc];
      }
    }
    if (!countMove) return;

    this.moves++;
    this.audio.playSE('jump');
    const litCount = this.grid.flat().filter(Boolean).length;
    this.score = Math.max(200, (16 - litCount) * 200 - this.moves * 30);
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`手数 ${this.moves} 残${litCount}`);

    if (litCount === 0) {
      this.score += Math.max(1000, 4000 - this.moves * 150);
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      this.audio.playSE('milestone');
      setTimeout(() => this.finishGame(), 500);
    }
  }

  start() {
    this.running = true;
    this.moves = 0;
    this.score = 0;
    this.startTime = Date.now();
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    // 必ず解ける初期配置を生成（ランダムに5〜6回反転）
    for (let i = 0; i < 6; i++) {
      this.toggle(Math.floor(Math.random() * this.size), Math.floor(Math.random() * this.size), false);
    }
    if (this.grid.flat().filter(Boolean).length === 0) {
      this.toggle(1, 1, false);
    }

    const litCount = this.grid.flat().filter(Boolean).length;
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`手数 0 残${litCount}`);
    this.visual.triggerRandomBuzzCutin();

    const loop = () => {
      if (!this.running) return;
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    this.visual.drawStageBackground(this.width, this.height);

    const litCount = this.grid.flat().filter(Boolean).length;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(16, 20, this.width - 32, 46);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 残り炎上/点灯マス: ${litCount}個 ｜ 手数: ${this.moves}`, this.width / 2, 48);

    const onEmoji = (this.theme.player && this.theme.player.emoji) || '🔥';
    const offEmoji = '✅';
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = this.boardX + c * this.cell;
        const y = this.boardY + r * this.cell;
        const isLit = this.grid[r][c];
        ctx.fillStyle = isLit ? '#dc2626' : '#0f172a';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, this.cell - 8, this.cell - 8, 12);
        ctx.fill();
        ctx.strokeStyle = isLit ? '#fde047' : '#334155';
        ctx.lineWidth = isLit ? 2.5 : 1.5;
        ctx.stroke();

        const em = isLit ? onEmoji : offEmoji;
        if (!this.visual.drawVectorSprite(em, x + this.cell / 2, y + this.cell / 2, 34, false)) {
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(em, x + this.cell / 2, y + this.cell / 2 + 10);
        }
      }
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

window.LightsOutGameEngine = LightsOutGameEngine;
