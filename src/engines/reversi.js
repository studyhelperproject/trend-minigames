/**
 * Reversi / Othello AI Engine (6x6高速1分リバーシ - 世論・派閥の陣取り対決など)
 * プレイヤー(先手) vs 簡易評価関数AI(後手)。石を挟んでひっくり返せ！
 */
class ReversiGameEngine {
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
    this.boardY = 78;

    this.board = [];
    this.turn = 1; // 1 = Player, 2 = AI
    this.running = false;
    this.score = 0;
    this.startTime = 0;

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">⚫⚪ 6×6高速リバーシ：</span>` +
      `<span class="evo-step">光るマスをタップして相手の石を挟み、世論をひっくり返せ！</span>`;
  }

  setupInput() {
    this.canvas.addEventListener('click', e => {
      if (!this.running || this.turn !== 1) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      const c = Math.floor((x - this.boardX) / this.cell);
      const r = Math.floor((y - this.boardY) / this.cell);
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) return;

      const flips = this.getFlips(r, c, 1);
      if (flips.length === 0) return;
      this.applyMove(r, c, 1, flips);
      this.audio.playSE('hit');
      this.turn = 2;
      this.nextTurn();
    });
  }

  getFlips(r, c, player) {
    if (this.board[r][c] !== 0) return [];
    const opp = player === 1 ? 2 : 1;
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    const totalFlips = [];
    for (const [dr, dc] of dirs) {
      const line = [];
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && this.board[nr][nc] === opp) {
        line.push([nr, nc]);
        nr += dr;
        nc += dc;
      }
      if (line.length > 0 && nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && this.board[nr][nc] === player) {
        totalFlips.push(...line);
      }
    }
    return totalFlips;
  }

  getValidMoves(player) {
    const moves = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const f = this.getFlips(r, c, player);
        if (f.length > 0) moves.push({ r, c, flips: f });
      }
    }
    return moves;
  }

  applyMove(r, c, player, flips) {
    this.board[r][c] = player;
    for (const [fr, fc] of flips) this.board[fr][fc] = player;
    const counts = this.countStones();
    this.score = counts.p1 * 180;
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`自${counts.p1} vs 敵${counts.p2}`);
  }

  countStones() {
    let p1 = 0, p2 = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 1) p1++;
        if (this.board[r][c] === 2) p2++;
      }
    }
    return { p1, p2 };
  }

  nextTurn() {
    const m1 = this.getValidMoves(1);
    const m2 = this.getValidMoves(2);
    if (m1.length === 0 && m2.length === 0) {
      const { p1, p2 } = this.countStones();
      if (p1 > p2) this.score += 2500;
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      this.audio.playSE('milestone');
      setTimeout(() => this.finishGame(), 600);
      return;
    }

    if (this.turn === 2) {
      if (m2.length === 0) {
        this.turn = 1;
        return;
      }
      setTimeout(() => {
        if (!this.running) return;
        // 角優先のAI選択
        m2.sort((a, b) => {
          const ca = ((a.r === 0 || a.r === 5) && (a.c === 0 || a.c === 5)) ? 10 : 0;
          const cb = ((b.r === 0 || b.r === 5) && (b.c === 0 || b.c === 5)) ? 10 : 0;
          return (cb + b.flips.length) - (ca + a.flips.length);
        });
        const pick = m2[0];
        this.applyMove(pick.r, pick.c, 2, pick.flips);
        this.audio.playSE('drop');
        this.turn = 1;
        if (this.getValidMoves(1).length === 0) {
          this.turn = 2;
          this.nextTurn();
        }
      }, 360);
    }
  }

  start() {
    this.running = true;
    this.score = 360;
    this.turn = 1;
    this.startTime = Date.now();
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.board[2][2] = 2; this.board[2][3] = 1;
    this.board[3][2] = 1; this.board[3][3] = 2;

    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(360);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`自2 vs 敵2`);
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

    const { p1, p2 } = this.countStones();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(16, 18, this.width - 32, 44);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`あなた: ${p1} vs AI: ${p2} ｜ ${this.turn === 1 ? 'あなたの番（光るマスをタップ）' : 'AI思考中...'}`, this.width / 2, 45);

    const validSet = new Set(this.turn === 1 ? this.getValidMoves(1).map(m => `${m.r},${m.c}`) : []);
    const p1Em = (this.theme.player && this.theme.player.emoji) || '🛡️';
    const p2Em = '🤖';

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = this.boardX + c * this.cell;
        const y = this.boardY + r * this.cell;
        const isValid = validSet.has(`${r},${c}`);
        ctx.fillStyle = isValid ? 'rgba(56, 189, 248, 0.28)' : 'rgba(6, 78, 59, 0.85)';
        ctx.fillRect(x + 2, y + 2, this.cell - 4, this.cell - 4);
        ctx.strokeStyle = isValid ? '#fde047' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = isValid ? 2.5 : 1;
        ctx.strokeRect(x + 2, y + 2, this.cell - 4, this.cell - 4);

        const v = this.board[r][c];
        if (v === 1 || v === 2) {
          this.visual.drawRichCharacter(
            x + this.cell / 2,
            y + this.cell / 2,
            20,
            { emoji: v === 1 ? p1Em : p2Em, color: v === 1 ? '#0ea5e9' : '#e11d48' }
          );
        } else if (isValid) {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.7)';
          ctx.beginPath();
          ctx.arc(x + this.cell / 2, y + this.cell / 2, 6, 0, Math.PI * 2);
          ctx.fill();
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

window.ReversiGameEngine = ReversiGameEngine;
