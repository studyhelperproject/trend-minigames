/**
 * Engine 1: Suika-Physics (落下＆合体物理パズルエンジン - タイマー廃止・最終進化＆デッドライン制)
 * 動的ステージ背景＋パロディ似顔絵ベクター描画＋バズり名言カットイン搭載
 */
class SuikaGameEngine {
  constructor(canvas, theme, audio, sdk, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.audio = audio;
    this.sdk = sdk;
    this.cb = callbacks;

    this.width = 400;
    this.height = 500;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.rich = new window.RichVisualRenderer(this.canvas, this.theme);
    this.items = theme.items || [];
    this.balls = [];
    this.particles = [];
    this.floatingTexts = [];

    this.score = 0;
    this.maxReachedLevel = 0;
    this.isRunning = false;
    this.dropX = this.width / 2;
    this.currentLevel = 0;
    this.nextLevel = 1;
    this.canDrop = true;
    this.deadLineY = 92;
    this.animId = null;

    this.finishBtnRect = { x: 8, y: 6, w: 132, h: 32 };

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const chain = this.items.map(it => `<span class="evo-chip">${it.emoji} ${it.name}</span>`).join(' <span style="color:#ffd700">▸</span> ');
    guide.innerHTML = `<div style="font-weight:900;color:#ffd700;margin-bottom:4px;">【風刺進化ルート（時間制限なし）】同じキャラを合体させて最終形態を召喚せよ！</div><div>${chain}</div>`;
  }

  bindEvents() {
    const checkFinishBtn = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const b = this.finishBtnRect;
      return (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    };

    const updatePos = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const r = (this.items[this.currentLevel] && this.items[this.currentLevel].radius) || 20;
      let x = (clientX - rect.left) * scaleX;
      this.dropX = Math.max(r + 6, Math.min(this.width - r - 6, x));
    };

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isRunning) return;
      updatePos(e.clientX);
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.isRunning) return;
      if (checkFinishBtn(e.clientX, e.clientY)) {
        this.finishGame();
        return;
      }
      updatePos(e.clientX);
      this.dropBall();
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.isRunning) return;
      if (e.touches.length > 0) {
        if (checkFinishBtn(e.touches[0].clientX, e.touches[0].clientY)) {
          this.finishGame();
          return;
        }
        updatePos(e.touches[0].clientX);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isRunning) return;
      if (e.touches.length > 0) updatePos(e.touches[0].clientX);
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      if (!this.isRunning) return;
      this.dropBall();
    });
  }

  start() {
    this.balls = [];
    this.particles = [];
    this.floatingTexts = [];
    this.score = 0;
    this.maxReachedLevel = 0;
    this.isRunning = true;
    this.canDrop = true;
    this.currentLevel = Math.floor(Math.random() * 3);
    this.nextLevel = Math.floor(Math.random() * 4);
    this.startTime = Date.now();

    this.cb.onScoreChange(this.score);
    this.cb.onTimeChange(`Lv.1/${this.items.length}`);
    this.rich.triggerRandomBuzzCutin();

    const loop = () => {
      if (!this.isRunning) return;
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  dropBall() {
    if (!this.canDrop || !this.isRunning) return;
    this.canDrop = false;
    const spec = this.items[this.currentLevel] || this.items[0];
    this.balls.push({
      x: this.dropX + (Math.random() - 0.5) * 2,
      y: 54,
      vx: 0,
      vy: 2.0,
      level: this.currentLevel,
      radius: spec.radius,
      bornAt: Date.now()
    });
    this.audio.playSE('drop');

    this.currentLevel = this.nextLevel;
    this.nextLevel = Math.floor(Math.random() * Math.min(4, this.items.length));

    setTimeout(() => {
      this.canDrop = true;
    }, 290);
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 2.2 + Math.random() * 4.0;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color
      });
    }
  }

  update() {
    const gravity = 0.38;
    const bounce = 0.35;
    const friction = 0.985;

    for (const b of this.balls) {
      b.vy += gravity;
      b.vx *= friction;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x - b.radius < 4) {
        b.x = b.radius + 4;
        b.vx = Math.abs(b.vx) * bounce;
      } else if (b.x + b.radius > this.width - 4) {
        b.x = this.width - b.radius - 4;
        b.vx = -Math.abs(b.vx) * bounce;
      }

      if (b.y + b.radius > this.height - 6) {
        b.y = this.height - b.radius - 6;
        b.vy = -Math.abs(b.vy) * bounce;
        b.vx *= 0.92;
      }
    }

    for (let iter = 0; iter < 4; iter++) {
      for (let i = 0; i < this.balls.length; i++) {
        for (let j = i + 1; j < this.balls.length; j++) {
          const a = this.balls[i];
          const b = this.balls[j];
          if (!a || !b) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const minDist = a.radius + b.radius;

          if (dist < minDist) {
            if (a.level === b.level && a.level < this.items.length - 1) {
              const nextLv = a.level + 1;
              const nextSpec = this.items[nextLv];
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;

              this.balls.splice(j, 1);
              this.balls.splice(i, 1);
              this.balls.push({
                x: mx,
                y: my,
                vx: 0,
                vy: -1.6,
                level: nextLv,
                radius: nextSpec.radius,
                bornAt: Date.now()
              });

              const gained = nextSpec.score || (nextLv + 1) * 40;
              this.score += gained;
              if (nextLv > this.maxReachedLevel) {
                this.maxReachedLevel = nextLv;
                this.cb.onTimeChange(`Lv.${this.maxReachedLevel + 1}/${this.items.length}`);
              }
              this.cb.onScoreChange(this.score);
              this.audio.playSE('merge', nextLv);
              this.spawnParticles(mx, my, nextSpec.color);

              const quoteText = nextSpec.quote || `${nextSpec.name}に進化！`;
              this.floatingTexts.push({
                x: mx,
                y: my,
                text: `${nextSpec.emoji} +${gained} (${nextSpec.name})`,
                life: 1.0
              });

              if (nextLv >= 2) {
                this.rich.triggerCutin(
                  nextSpec.name,
                  quoteText,
                  nextSpec.avatar || 'kumagaa_ceo',
                  `🔥 Lv.${nextLv + 1} 進化達成！`
                );
              }
              break;
            } else {
              const overlap = (minDist - dist) * 0.52;
              const nx = dx / dist;
              const ny = dy / dist;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;
              if (velAlongNormal < 0) {
                const impulse = -(1 + 0.2) * velAlongNormal * 0.5;
                a.vx -= impulse * nx;
                a.vy -= impulse * ny;
                b.vx += impulse * nx;
                b.vy += impulse * ny;
              }
            }
          }
        }
      }
    }

    const now = Date.now();
    for (const b of this.balls) {
      if (now - b.bornAt > 1800 && b.y - b.radius < this.deadLineY && Math.abs(b.vy) < 0.8) {
        this.finishGame();
        return;
      }
    }

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    this.floatingTexts.forEach(ft => {
      ft.y -= 1.3;
      ft.life -= 0.028;
    });
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    this.rich.drawStageBackground(this.width, this.height);

    // 炎上デッドライン
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, this.deadLineY);
    ctx.lineTo(this.width, this.deadLineY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 23, 68, 0.85)';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('▲ 炎上デッドライン（超過で即結果判定）', 8, this.deadLineY - 5);
    ctx.restore();

    // 左上「結果判定へ」ボタン（タイマーなしでいつでもスコア確定可能）
    const fb = this.finishBtnRect;
    ctx.save();
    ctx.fillStyle = 'rgba(225, 29, 72, 0.88)';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(fb.x, fb.y, fb.w, fb.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 ここで結果発表へ', fb.x + fb.w / 2, fb.y + 20);
    ctx.restore();

    if (this.canDrop) {
      const curSpec = this.items[this.currentLevel] || this.items[0];
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.dropX, 42);
      ctx.lineTo(this.dropX, this.height);
      ctx.stroke();
      ctx.restore();

      this.rich.drawRichCharacter(this.dropX, 40, curSpec.radius, curSpec, true);
    }

    const nextSpec = this.items[this.nextLevel] || this.items[0];
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(this.width - 135, 6, 128, 32, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`NEXT: ${nextSpec.emoji} ${nextSpec.name.slice(0, 5)}`, this.width - 127, 26);
    ctx.restore();

    for (const b of this.balls) {
      const spec = this.items[b.level] || this.items[0];
      this.rich.drawRichCharacter(b.x, b.y, b.radius, spec, false);
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    this.rich.drawCutinOverlay(this.width);
  }

  finishGame() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.audio.playSE('gameover');
    const durationSec = Math.max(5, Math.round((Date.now() - this.startTime) / 1000));
    this.cb.onGameOver(this.score, durationSec);
  }
}

window.SuikaGameEngine = SuikaGameEngine;
