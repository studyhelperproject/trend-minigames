/**
 * Space Invaders / Alien Battle Engine (固定画面インベーダー迎撃 - インプレゾンビ・詐欺広告撃墜など)
 * PC矢印/A-D & スマホタッチドラッグ対応、自動連射ショットで爽快迎撃（タイマーなし）
 */
class SpaceInvadersGameEngine {
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

    this.player = { x: this.width / 2, y: this.height - 46, r: 22 };
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.enemyDir = 1;
    this.tick = 0;
    this.keys = { left: false, right: false };

    this.setupInput();
    this.renderBanner();
  }

  renderBanner() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const targets = this.theme.targets || [];
    guide.innerHTML = `<span style="color:#ffd700;margin-right:4px;">👾 迎撃ターゲット：</span>` +
      targets.map(t => `<span class="evo-step">${t.emoji} ${t.name}</span>`).join('<span class="evo-arrow">｜</span>');
  }

  setupInput() {
    const moveTo = (clientX) => {
      if (!this.running) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      this.player.x = Math.max(26, Math.min(this.width - 26, x));
    };
    this.canvas.addEventListener('mousemove', e => moveTo(e.clientX));
    this.canvas.addEventListener('touchmove', e => {
      if (e.touches.length > 0) { e.preventDefault(); moveTo(e.touches[0].clientX); }
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

  initEnemies() {
    this.enemies = [];
    const targets = this.theme.targets || [
      { emoji: '🧟‍♂️', name: 'インプレゾンビ', score: 180, color: '#ef4444' },
      { emoji: '👁️', name: '曲解拡散bot', score: 240, color: '#a855f7' },
      { emoji: '💀', name: '偽警告ポップ', score: 300, color: '#f59e0b' }
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        const spec = targets[r % targets.length];
        this.enemies.push({
          x: 56 + c * 56,
          y: 66 + r * 52,
          r: 19,
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
    this.tick = 0;
    this.bullets = [];
    this.enemyBullets = [];
    this.startTime = Date.now();
    this.initEnemies();

    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(0);
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`❤️×${this.lives}`);
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
    this.tick++;
    if (this.keys.left) this.player.x = Math.max(26, this.player.x - 5.5);
    if (this.keys.right) this.player.x = Math.min(this.width - 26, this.player.x + 5.5);

    if (this.tick % 16 === 0) {
      this.bullets.push({ x: this.player.x, y: this.player.y - 20, vy: -8 });
      this.audio.playSE('drop');
    }

    const alive = this.enemies.filter(e => e.alive);
    if (alive.length === 0) {
      this.score += 3000 + this.lives * 500;
      if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
      this.audio.playSE('milestone');
      this.finishGame();
      return;
    }

    let hitEdge = false;
    for (const en of alive) {
      en.x += this.enemyDir * 1.15;
      if (en.x > this.width - 28 || en.x < 28) hitEdge = true;
    }
    if (hitEdge) {
      this.enemyDir *= -1;
      for (const en of alive) {
        en.y += 14;
        if (en.y > this.player.y - 24) {
          this.finishGame();
          return;
        }
      }
    }

    if (this.tick % 42 === 0 && alive.length > 0) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      this.enemyBullets.push({ x: shooter.x, y: shooter.y + 18, vy: 4.2 });
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy;
      if (b.y < 0) { this.bullets.splice(i, 1); continue; }
      for (const en of alive) {
        if (Math.hypot(b.x - en.x, b.y - en.y) < en.r + 6) {
          en.alive = false;
          this.bullets.splice(i, 1);
          this.score += Math.abs(en.spec.score || 200);
          this.audio.playSE('hit');
          if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
          break;
        }
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.y += eb.vy;
      if (eb.y > this.height) { this.enemyBullets.splice(i, 1); continue; }
      if (Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < this.player.r + 4) {
        this.enemyBullets.splice(i, 1);
        this.lives--;
        this.audio.playSE('bad');
        this.visual.shakeAmount = 10;
        if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`❤️×${this.lives} 残${alive.length}`);
        if (this.lives <= 0) { this.finishGame(); return; }
      }
    }
    if (this.callbacks.onTimeChange) this.callbacks.onTimeChange(`❤️×${this.lives} 残${alive.length}`);
  }

  draw() {
    const ctx = this.ctx;
    this.visual.drawStageBackground(this.width, this.height);

    for (const en of this.enemies) {
      if (!en.alive) continue;
      this.visual.drawRichCharacter(en.x, en.y, en.r, en.spec);
    }

    const pSpec = this.theme.player || { emoji: '🛡️', name: '防衛機', color: '#00e5ff' };
    this.visual.drawRichCharacter(this.player.x, this.player.y, this.player.r, pSpec);

    ctx.fillStyle = '#00e5ff';
    for (const b of this.bullets) {
      ctx.fillRect(b.x - 3, b.y - 8, 6, 14);
    }
    ctx.fillStyle = '#ff1744';
    for (const eb of this.enemyBullets) {
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, 5, 0, Math.PI * 2);
      ctx.fill();
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

window.SpaceInvadersGameEngine = SpaceInvadersGameEngine;
