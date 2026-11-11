/**
 * Engine 5: Whack-Tap (60秒高速反射タップ撃退エンジン)
 * 参照OSS: wesbos/JavaScript30 Whack A Mole (MIT)
 */
class WhackGameEngine {
  constructor(canvas, theme, audio, sdk, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.audio = audio;
    this.sdk = sdk;
    this.cb = callbacks;

    this.width = 400;
    this.height = 440;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.targets = theme.targets || [];
    this.holes = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        this.holes.push({
          x: 72 + c * 128,
          y: 95 + r * 125,
          activeTarget: null,
          expiresAt: 0
        });
      }
    }

    this.popups = [];
    this.combo = 0;
    this.score = 0;
    this.timeLeft = 60;
    this.isRunning = false;
    this.timerInterval = null;
    this.animId = null;

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const info = this.targets.map(t => `${t.emoji}${t.name.slice(0, 6)}(${t.score > 0 ? '+' : ''}${t.score})`).join(' / ');
    guide.innerHTML = `<strong>【撃退ターゲット】</strong> ${info}`;
  }

  bindEvents() {
    const handleTap = (clientX, clientY) => {
      if (!this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      const y = (clientY - rect.top) * (this.height / rect.height);

      for (const h of this.holes) {
        if (!h.activeTarget) continue;
        const dist = Math.hypot(x - h.x, y - h.y);
        if (dist <= 48) {
          const t = h.activeTarget;
          h.activeTarget = null;
          if (t.score > 0) {
            this.combo++;
            const bonus = Math.round(t.score * (1 + Math.min(this.combo, 10) * 0.08));
            this.score += bonus;
            this.audio.playSE('hit');
            this.popups.push({
              x: h.x,
              y: h.y - 25,
              text: `💥 +${bonus} (${this.combo}Combo!)`,
              color: '#ffd700',
              life: 1.0
            });
          } else {
            this.combo = 0;
            this.score = Math.max(0, this.score + t.score);
            this.audio.playSE('damage');
            this.popups.push({
              x: h.x,
              y: h.y - 25,
              text: `💦 ${t.score} 誤爆!`,
              color: '#ff5252',
              life: 1.0
            });
          }
          this.cb.onScoreChange(this.score);
          break;
        }
      }
    };

    this.canvas.addEventListener('mousedown', (e) => handleTap(e.clientX, e.clientY));
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleTap(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  start() {
    this.holes.forEach(h => { h.activeTarget = null; });
    this.popups = [];
    this.combo = 0;
    this.score = 0;
    this.timeLeft = 60;
    this.isRunning = true;
    this.startTime = Date.now();

    this.cb.onScoreChange(this.score);
    this.cb.onTimeChange(this.timeLeft);

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
    const now = Date.now();
    let activeCount = 0;
    for (const h of this.holes) {
      if (h.activeTarget && now > h.expiresAt) {
        h.activeTarget = null;
      }
      if (h.activeTarget) activeCount++;
    }

    const maxSimultaneous = this.timeLeft <= 20 ? 4 : 3;
    if (activeCount < maxSimultaneous && Math.random() < 0.14) {
      const freeHoles = this.holes.filter(h => !h.activeTarget);
      if (freeHoles.length > 0) {
        const hole = freeHoles[Math.floor(Math.random() * freeHoles.length)];
        const spec = this.targets[Math.floor(Math.random() * this.targets.length)];
        hole.activeTarget = spec;
        hole.expiresAt = now + (spec.duration_ms || 850);
      }
    }

    this.popups.forEach(p => {
      p.y -= 1.2;
      p.life -= 0.04;
    });
    this.popups = this.popups.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (const h of this.holes) {
      // Hole shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 18, 44, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (h.activeTarget) {
        const isEnemy = h.activeTarget.score > 0;
        ctx.fillStyle = isEnemy ? 'rgba(255, 82, 82, 0.85)' : 'rgba(0, 230, 118, 0.85)';
        ctx.beginPath();
        ctx.arc(h.x, h.y - 4, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(h.activeTarget.emoji, h.x, h.y - 6);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(h.activeTarget.name.slice(0, 6), h.x, h.y + 22);
      }
    }

    for (const p of this.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
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

window.WhackGameEngine = WhackGameEngine;
