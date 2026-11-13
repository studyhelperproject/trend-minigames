/**
 * Minesweeper / SweepIt Engine (地雷除去パズル - 2ヶ月半侵入ログ＆脆弱性ポート特定など)
 * 6x6 盤面、PC右クリック & スマホ用「🚩フラグ切替」ボタン搭載（タイマーなし）
 */
class MinesweeperGameEngine {
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
    this.rows = 6;
    this.cols = 6;
    this.mineCount = 6;
    this.grid = [];
    this.flagMode = false;
    this.running = false;
    this.score = 0;
    this.startTime = 0;
    this.openedSafe = 0;

    this.cellSize = 54;
    this.boardX = (this.width - this.cols * this.cellSize) / 2;
    this.boardY = 82;
    this.toggleBtn = { x: 18, y: 422, w: this.width - 36, h: 44 };

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">💣 脆弱性スキャン（地雷${this.mineCount}個）：</span>` +
      `<span class="evo-step">数字＝周囲8マスの危険ポート数</span><span class="evo-arrow">｜</span>` +
      `<span class="evo-step">安全マス全開放で完全防衛！</span>`;
  }

  setupInput() {
    const handlePointer = (clientX, clientY, isRightClick = false) => {
      if (!this.running) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      const y = (clientY - rect.top) * (this.height / rect.height);

      // Flag mode toggle button
      if (x >= this.toggleBtn.x && x <= this.toggleBtn.x + this.toggleBtn.w &&
          y >= this.toggleBtn.y && y <= this.toggleBtn.y + this.toggleBtn.h) {
        this.flagMode = !this.flagMode;
        this.audio.playSE('drop');
        return;
      }

      const c = Math.floor((x - this.boardX) / this.cellSize);
      const r = Math.floor((y - this.boardY) / this.cellSize);
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;

      const cell = this.grid[r][c];
      if (cell.open) return;

      if (isRightClick || this.flagMode) {
        cell.flag = !cell.flag;
        this.audio.playSE('jump');
        return;
      }

      if (cell.flag) return;
      this.revealCell(r, c);
    };

    this.canvas.addEventListener('click', e => handlePointer(e.clientX, e.clientY, false));
    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      handlePointer(e.clientX, e.clientY, true);
    });
  }

  initGrid() {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({ mine: false, open: false, flag: false, adj: 0 }))
    );
    let placed = 0;
    while (placed < this.mineCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (!this.grid[r][c].mine) {
        this.grid[r][c].mine = true;
        placed++;
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) continue;
        let cnt = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc].mine) cnt++;
          }
        }
        this.grid[r][c].adj = cnt;
      }
    }
  }

  revealCell(r, c) {
    const cell = this.grid[r][c];
    if (cell.open || cell.flag) return;
    cell.open = true;

    if (cell.mine) {
      this.audio.playSE('bad');
      this.visual.shakeAmount = 12;
      // Reveal all mines
      for (let rr = 0; rr < this.rows; rr++) {
        for (let cc = 0; cc < this.cols; cc++) {
          if (this.grid[rr][cc].mine) this.grid[rr][cc].open = true;
        }
      }
      this.draw();
      setTimeout(() => this.finishGame(), 700);
      return;
    }

    this.openedSafe++;
    this.score += 180;
    this.audio.playSE('hit');
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);

    if (cell.adj === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            this.revealCell(nr, nc);
          }
        }
      }
    }

    const totalSafe = this.rows * this.cols - this.mineCount;
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`安全 ${this.openedSafe}/${totalSafe}`);
    if (this.openedSafe >= totalSafe) {
      this.score += 3500;
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      this.audio.playSE('milestone');
      setTimeout(() => this.finishGame(), 500);
    }
  }

  start() {
    this.running = true;
    this.score = 0;
    this.openedSafe = 0;
    this.flagMode = false;
    this.startTime = Date.now();
    this.initGrid();
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`安全 0/30`);
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

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(14, 16, this.width - 28, 50);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 16, this.width - 28, 50);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔍 侵入ログ調査：安全マス ${this.openedSafe}/30 開放 (地雷${this.mineCount}個)`, this.width / 2, 46);

    const numColors = ['', '#38bdf8', '#4ade80', '#facc15', '#fb923c', '#f43f5e', '#c084fc'];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const x = this.boardX + c * this.cellSize;
        const y = this.boardY + r * this.cellSize;
        ctx.fillStyle = cell.open ? (cell.mine ? '#991b1b' : '#0f172a') : '#1e293b';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 8);
        ctx.fill();
        ctx.strokeStyle = cell.open ? 'rgba(255,255,255,0.2)' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (cell.open) {
          if (cell.mine) {
            if (!this.visual.drawVectorSprite('💀', x + this.cellSize / 2, y + this.cellSize / 2, 28, false)) {
              ctx.font = '24px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('💀', x + this.cellSize / 2, y + this.cellSize / 2 + 8);
            }
          } else if (cell.adj > 0) {
            ctx.fillStyle = numColors[cell.adj] || '#fff';
            ctx.font = 'bold 22px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(String(cell.adj), x + this.cellSize / 2, y + this.cellSize / 2 + 8);
          }
        } else if (cell.flag) {
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚩', x + this.cellSize / 2, y + this.cellSize / 2 + 8);
        }
      }
    }

    // Mode toggle button
    ctx.fillStyle = this.flagMode ? '#e11d48' : '#0284c7';
    ctx.beginPath();
    ctx.roundRect(this.toggleBtn.x, this.toggleBtn.y, this.toggleBtn.w, this.toggleBtn.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.flagMode ? '🚩 現在：危険フラグ設置モード（タップで調査に戻す）' : '🔍 現在：安全マス調査モード（タップで🚩フラグ切替）',
      this.width / 2,
      this.toggleBtn.y + 27
    );

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

window.MinesweeperGameEngine = MinesweeperGameEngine;
