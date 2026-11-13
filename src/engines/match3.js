/**
 * Match 3 / Bejeweled Engine (マッチ3パズル - 半導体サプライチェーン・推し活グッズ揃えなど)
 * 6x6盤面、隣り合う2ピースをタップで入れ替えて3つ以上揃えて連鎖消去！（15手制・タイマーなし）
 */
class Match3GameEngine {
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
    this.size = 6;
    this.cell = 56;
    this.boardX = (this.width - this.size * this.cell) / 2;
    this.boardY = 74;

    this.board = [];
    this.selected = null;
    this.movesLeft = 15;
    this.score = 0;
    this.running = false;
    this.startTime = 0;

    this.types = (this.theme.items && this.theme.items.length >= 5)
      ? this.theme.items.slice(0, 5)
      : [
        { emoji: '🧥', name: '革ジャン', color: '#16a34a' },
        { emoji: '💎', name: 'GPU', color: '#00e5ff' },
        { emoji: '⚡', name: '電力', color: '#eab308' },
        { emoji: '📈', name: '半導体株', color: '#3b82f6' },
        { emoji: '🔥', name: '炎上', color: '#ef4444' }
      ];

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">💎 マッチ3ピース：</span>` +
      this.types.map(t => `<span class="evo-step">${t.emoji} ${t.name}</span>`).join('<span class="evo-arrow">｜</span>');
  }

  setupInput() {
    this.canvas.addEventListener('click', e => {
      if (!this.running || this.movesLeft <= 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      const c = Math.floor((x - this.boardX) / this.cell);
      const r = Math.floor((y - this.boardY) / this.cell);
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) return;

      if (!this.selected) {
        this.selected = { r, c };
        this.audio.playSE('drop');
      } else {
        const dr = Math.abs(this.selected.r - r);
        const dc = Math.abs(this.selected.c - c);
        if (dr + dc === 1) {
          this.trySwap(this.selected.r, this.selected.c, r, c);
        }
        this.selected = null;
      }
    });
  }

  initBoard() {
    this.board = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => Math.floor(Math.random() * this.types.length))
    );
    while (this.findMatches().length > 0) {
      this.resolveMatches(true);
    }
  }

  trySwap(r1, c1, r2, c2) {
    const tmp = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = tmp;

    if (this.findMatches().length > 0) {
      this.movesLeft--;
      this.resolveMatches(false);
      if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`残${this.movesLeft}手`);
      if (this.movesLeft <= 0) {
        setTimeout(() => this.finishGame(), 600);
      }
    } else {
      // Revert invalid swap
      this.board[r2][c2] = this.board[r1][c1];
      this.board[r1][c1] = tmp;
      this.audio.playSE('bad');
    }
  }

  findMatches() {
    const matched = new Set();
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size - 2; c++) {
        const v = this.board[r][c];
        if (v >= 0 && v === this.board[r][c + 1] && v === this.board[r][c + 2]) {
          matched.add(`${r},${c}`); matched.add(`${r},${c + 1}`); matched.add(`${r},${c + 2}`);
        }
      }
    }
    for (let c = 0; c < this.size; c++) {
      for (let r = 0; r < this.size - 2; r++) {
        const v = this.board[r][c];
        if (v >= 0 && v === this.board[r + 1][c] && v === this.board[r + 2][c]) {
          matched.add(`${r},${c}`); matched.add(`${r + 1},${c}`); matched.add(`${r + 2},${c}`);
        }
      }
    }
    return Array.from(matched).map(s => s.split(',').map(Number));
  }

  resolveMatches(silent = false) {
    let combo = 1;
    let matches = this.findMatches();
    while (matches.length > 0) {
      if (!silent) {
        this.score += matches.length * 120 * combo;
        this.audio.playSE('merge', Math.min(4, combo));
        if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
        if (combo >= 2) this.visual.triggerRandomBuzzCutin();
      }
      for (const [r, c] of matches) this.board[r][c] = -1;
      for (let c = 0; c < this.size; c++) {
        let writeR = this.size - 1;
        for (let r = this.size - 1; r >= 0; r--) {
          if (this.board[r][c] !== -1) {
            this.board[writeR][c] = this.board[r][c];
            writeR--;
          }
        }
        while (writeR >= 0) {
          this.board[writeR][c] = Math.floor(Math.random() * this.types.length);
          writeR--;
        }
      }
      combo++;
      matches = this.findMatches();
    }
  }

  start() {
    this.running = true;
    this.score = 0;
    this.movesLeft = 15;
    this.selected = null;
    this.startTime = Date.now();
    this.initBoard();
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`残${this.movesLeft}手`);
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
    ctx.fillRect(16, 18, this.width - 32, 42);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💎 残り手数: ${this.movesLeft}手 ｜ 隣り合う2つをタップして3つ揃えよう！`, this.width / 2, 44);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = this.boardX + c * this.cell;
        const y = this.boardY + r * this.cell;
        const isSel = this.selected && this.selected.r === r && this.selected.c === c;
        ctx.fillStyle = isSel ? 'rgba(253, 224, 71, 0.25)' : 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, this.cell - 4, this.cell - 4, 10);
        ctx.fill();
        ctx.strokeStyle = isSel ? '#fde047' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isSel ? 3 : 1.5;
        ctx.stroke();

        const spec = this.types[this.board[r][c]];
        if (spec) {
          this.visual.drawRichCharacter(x + this.cell / 2, y + this.cell / 2, 20, spec);
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

window.Match3GameEngine = Match3GameEngine;
