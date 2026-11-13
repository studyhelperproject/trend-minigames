/**
 * Frogger Engine (道路横断アクション - インバウンド観光地＆円安ぼったくり回避など)
 * 上下左右スワイプ/タップ/矢印キーで1マスずつ進み、車線を横切って対岸のゴールへ3回到達せよ！
 */
class FroggerGameEngine {
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
    this.cols = 8;
    this.rows = 8;
    this.cellW = this.width / this.cols;
    this.cellH = 48;
    this.topY = 56;

    this.running = false;
    this.score = 0;
    this.lives = 3;
    this.goals = 0;
    this.startTime = 0;
    this.player = { col: 3, row: 7 };
    this.lanes = [];

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const bads = this.theme.bad_items || [];
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">🏃 横断アクション：</span>` +
      bads.map(b => `<span class="evo-step">避ける:${b.emoji}${b.name}</span>`).join('<span class="evo-arrow">｜</span>');
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
        this.movePlayer(0, -1); // タップで前進
      } else if (Math.abs(dx) > Math.abs(dy)) {
        this.movePlayer(dx > 0 ? 1 : -1, 0);
      } else {
        this.movePlayer(0, dy > 0 ? 1 : -1);
      }
    });
    window.addEventListener('keydown', e => {
      if (!this.running) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowUp') this.movePlayer(0, -1);
      if (e.key === 'ArrowDown') this.movePlayer(0, 1);
      if (e.key === 'ArrowLeft') this.movePlayer(-1, 0);
      if (e.key === 'ArrowRight') this.movePlayer(1, 0);
    });
  }

  movePlayer(dc, dr) {
    const nc = Math.max(0, Math.min(this.cols - 1, this.player.col + dc));
    const nr = Math.max(0, Math.min(this.rows - 1, this.player.row + dr));
    if (nr < this.player.row) this.score += 50;
    this.player.col = nc;
    this.player.row = nr;
    this.audio.playSE('jump');
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);

    if (this.player.row === 0) {
      this.goals++;
      this.score += 1200;
      this.audio.playSE('milestone');
      this.visual.triggerRandomBuzzCutin();
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      if (this.goals >= 3) {
        this.score += this.lives * 500;
        this.finishGame();
        return;
      }
      this.player = { col: 3, row: 7 };
    }
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`🏁${this.goals}/3 ❤️×${this.lives}`);
  }

  initLanes() {
    const bads = this.theme.bad_items || [
      { emoji: '💸', name: '1万8千円ウニ丼', color: '#ef4444' },
      { emoji: '🚌', name: '観光バス渋滞', color: '#f59e0b' }
    ];
    this.lanes = [];
    for (let r = 1; r <= 6; r++) {
      if (r === 4) continue; // 中央安全地帯
      const dir = r % 2 === 0 ? 1 : -1;
      const speed = (1.3 + (r % 3) * 0.65) * dir;
      const cars = [];
      const spec = bads[r % bads.length];
      for (let i = 0; i < 2; i++) {
        cars.push({ x: i * 195 + Math.random() * 40, w: 66, spec });
      }
      this.lanes.push({ row: r, speed, cars });
    }
  }

  start() {
    this.running = true;
    this.score = 0;
    this.lives = 3;
    this.goals = 0;
    this.startTime = Date.now();
    this.player = { col: 3, row: 7 };
    this.initLanes();

    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`🏁0/3 ❤️×3`);
    this.visual.triggerRandomBuzzCutin();

    const loop = () => {
      if (!this.running) return;
      this.update();
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  update() {
    const px = this.player.col * this.cellW + this.cellW / 2;
    const py = this.topY + this.player.row * this.cellH + this.cellH / 2;

    for (const lane of this.lanes) {
      const ly = this.topY + lane.row * this.cellH + this.cellH / 2;
      for (const car of lane.cars) {
        car.x += lane.speed;
        if (lane.speed > 0 && car.x > this.width + 40) car.x = -car.w - 20;
        if (lane.speed < 0 && car.x < -car.w - 40) car.x = this.width + 20;

        if (this.player.row === lane.row && px + 12 > car.x && px - 12 < car.x + car.w) {
          this.lives--;
          this.audio.playSE('bad');
          this.visual.shakeAmount = 10;
          this.player = { col: 3, row: 7 };
          if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`🏁${this.goals}/3 ❤️×${this.lives}`);
          if (this.lives <= 0) { this.finishGame(); return; }
        }
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    this.visual.drawStageBackground(this.width, this.height);

    // Goal zone & safe zone
    ctx.fillStyle = 'rgba(0, 230, 118, 0.25)';
    ctx.fillRect(0, this.topY, this.width, this.cellH);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🏁 庶民価格ゴール (${this.goals}/3 回到達でクリア！)`, this.width / 2, this.topY + 28);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.fillRect(0, this.topY + 4 * this.cellH, this.width, this.cellH);

    for (const lane of this.lanes) {
      const y = this.topY + lane.row * this.cellH;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, y + 2, this.width, this.cellH - 4);
      for (const car of lane.cars) {
        ctx.fillStyle = car.spec.color || '#ef4444';
        ctx.beginPath();
        ctx.roundRect(car.x, y + 6, car.w, this.cellH - 12, 8);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        this.visual.drawVectorSprite(car.spec.emoji || '💸', car.x + car.w / 2, y + this.cellH / 2, 24, false);
      }
    }

    const px = this.player.col * this.cellW + this.cellW / 2;
    const py = this.topY + this.player.row * this.cellH + this.cellH / 2;
    const pSpec = this.theme.player || { emoji: '🍣', name: '庶民', color: '#00e5ff' };
    this.visual.drawRichCharacter(px, py, 18, pSpec);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 11px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('タップで前進 / スワイプ・矢印キーで4方向移動', this.width / 2, this.height - 14);
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

window.FroggerGameEngine = FroggerGameEngine;
