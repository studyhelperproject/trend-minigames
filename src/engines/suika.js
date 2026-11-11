/**
 * Engine 1: Suika-Physics (落下＆合体物理パズルエンジン)
 * 参照OSS: sgbj/suika-clone, isobelmcrae/suika (MIT)
 * 1分で決着がつく「60秒スコアアタック＋デッドライン溢れ判定」ハイブリッド仕様
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

    this.items = theme.items || [];
    this.balls = [];
    this.particles = [];
    this.floatingTexts = [];

    this.score = 0;
    this.timeLeft = 60;
    this.isRunning = false;
    this.dropX = this.width / 2;
    this.currentLevel = 0;
    this.nextLevel = 1;
    this.canDrop = true;
    this.deadLineY = 85;
    this.timerInterval = null;
    this.animId = null;

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const chain = this.items.map(it => `${it.emoji}<span style="font-size:0.7rem">${it.name.slice(0, 4)}</span>`).join(' ➔ ');
    guide.innerHTML = `<strong>【進化図鑑】</strong> ${chain}`;
  }

  bindEvents() {
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
      updatePos(e.clientX);
      this.dropBall();
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.isRunning) return;
      if (e.touches.length > 0) updatePos(e.touches[0].clientX);
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
    this.timeLeft = 60;
    this.isRunning = true;
    this.canDrop = true;
    this.currentLevel = Math.floor(Math.random() * 3);
    this.nextLevel = Math.floor(Math.random() * 4);
    this.startTime = Date.now();

    this.cb.onScoreChange(this.score);
    this.cb.onTimeChange(this.timeLeft);

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.timeLeft--;
      this.cb.onTimeChange(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.finishGame();
      }
    }, 1000);

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
      y: 52,
      vx: 0,
      vy: 1.5,
      level: this.currentLevel,
      radius: spec.radius,
      bornAt: Date.now()
    });
    this.audio.playSE('drop');

    this.currentLevel = this.nextLevel;
    this.nextLevel = Math.floor(Math.random() * Math.min(4, this.items.length));

    setTimeout(() => {
      this.canDrop = true;
    }, 340);
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3.5;
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

    // Physics sub-steps & collision merge
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
              // Merge into next level!
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
                vy: -1.5,
                level: nextLv,
                radius: nextSpec.radius,
                bornAt: Date.now()
              });

              const gained = nextSpec.score || (nextLv + 1) * 30;
              this.score += gained;
              this.cb.onScoreChange(this.score);
              this.audio.playSE('merge', nextLv);
              this.spawnParticles(mx, my, nextSpec.color);
              this.floatingTexts.push({
                x: mx,
                y: my,
                text: `${nextSpec.emoji} +${gained}`,
                life: 1.0
              });
              break;
            } else {
              // Elastic separation
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

    // Check overflow above deadline
    const now = Date.now();
    for (const b of this.balls) {
      if (now - b.bornAt > 1800 && b.y - b.radius < this.deadLineY && Math.abs(b.vy) < 0.8) {
        this.finishGame();
        return;
      }
    }

    // Update particles & floating texts
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    this.floatingTexts.forEach(ft => {
      ft.y -= 1.2;
      ft.life -= 0.03;
    });
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deadline line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 82, 82, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, this.deadLineY);
    ctx.lineTo(this.width, this.deadLineY);
    ctx.stroke();
    ctx.restore();

    // Preview dropper & guide line
    if (this.canDrop) {
      const curSpec = this.items[this.currentLevel] || this.items[0];
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.moveTo(this.dropX, 45);
      ctx.lineTo(this.dropX, this.height);
      ctx.stroke();
      ctx.restore();

      this.drawBallItem(this.dropX, 42, curSpec, true);
    }

    // Next item badge
    const nextSpec = this.items[this.nextLevel] || this.items[0];
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(this.width - 105, 8, 97, 32);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`NEXT: ${nextSpec.emoji}`, this.width - 96, 29);
    ctx.restore();

    // Active balls
    for (const b of this.balls) {
      const spec = this.items[b.level] || this.items[0];
      this.drawBallItem(b.x, b.y, spec, false);
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  drawBallItem(x, y, spec, isPreview) {
    const ctx = this.ctx;
    ctx.save();
    if (isPreview) ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.arc(x, y, spec.radius, 0, Math.PI * 2);
    ctx.fillStyle = spec.color || '#ff80ab';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.font = `${Math.max(14, Math.floor(spec.radius * 0.95))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.emoji, x, y - 2);

    if (spec.radius >= 30) {
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillText(spec.name.slice(0, 6), x, y + spec.radius * 0.58);
    }
    ctx.restore();
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

window.SuikaGameEngine = SuikaGameEngine;
