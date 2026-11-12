/**
 * Engine 4: Catch-Drop (東証大相場キャッチャー＆ウエダー総裁の利上げ雷撃レーザー回避エンジン - タイマー廃止・資産ライフ3制)
 */
class CatcherGameEngine {
  constructor(canvas, theme, audio, sdk, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.audio = audio;
    this.sdk = sdk;
    this.cb = callbacks;

    this.width = 400;
    this.height = 480;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.rich = new window.RichVisualRenderer(this.canvas, this.theme);
    this.playerSpec = theme.player || { emoji: '🚲', name: '優待チャリ仙人' };
    this.goodItems = theme.good_items || [];
    this.badItems = theme.bad_items || [];

    this.playerX = this.width / 2;
    this.falling = [];
    this.popups = [];
    this.score = 0;
    this.hp = 3;
    this.caughtCount = 0;
    this.laserWarning = null;
    this.isRunning = false;
    this.frameCount = 0;
    this.animId = null;

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const goods = this.goodItems.map(g => `<span class="evo-chip">${g.emoji}${g.name}(+${g.score})</span>`).join(' ');
    const bads = this.badItems.map(b => `<span class="evo-chip" style="border-color:#ff5252">${b.emoji}${b.name}(${b.score})</span>`).join(' ');
    guide.innerHTML = `<div style="margin-bottom:4px;"><strong style="color:#00e676">【獲得ターゲット（25個獲得で相場制覇）】</strong> ${goods}</div><div><strong style="color:#ff5252">【暴落トラップ（3回被弾で退場）】</strong> ${bads}</div>`;
  }

  bindEvents() {
    const movePlayer = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.width / rect.width);
      this.playerX = Math.max(40, Math.min(this.width - 40, x));
    };

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isRunning) movePlayer(e.clientX);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isRunning && e.touches.length > 0) movePlayer(e.touches[0].clientX);
    }, { passive: true });
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.isRunning && e.touches.length > 0) movePlayer(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.playerX = Math.max(40, this.playerX - 28);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.playerX = Math.min(this.width - 40, this.playerX + 28);
      }
    });
  }

  start() {
    this.falling = [];
    this.popups = [];
    this.score = 0;
    this.hp = 3;
    this.caughtCount = 0;
    this.laserWarning = null;
    this.frameCount = 0;
    this.isRunning = true;
    this.startTime = Date.now();

    this.cb.onScoreChange(this.score);
    this.cb.onTimeChange('💰💰💰');
    this.rich.triggerRandomBuzzCutin();

    const loop = () => {
      if (!this.isRunning) return;
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  update() {
    this.frameCount++;
    const isFever = this.caughtCount >= 15;
    const spawnInterval = isFever ? 19 : 26;

    // 定期的にウエダー魔導総裁の「利上げ雷撃レーザー」予告＆発射
    if (this.frameCount % 160 === 80) {
      this.laserWarning = {
        x: Math.max(50, Math.min(this.width - 50, this.playerX + (Math.random() - 0.5) * 60)),
        timer: 55
      };
    }
    if (this.laserWarning) {
      this.laserWarning.timer--;
      if (this.laserWarning.timer === 12) {
        this.audio.playSE('bad');
        this.rich.shakeAmount = 9;
        if (Math.abs(this.playerX - this.laserWarning.x) < 38) {
          this.hp--;
          this.cb.onTimeChange(this.hp > 0 ? '💰'.repeat(this.hp) : '💀退場');
          this.popups.push({
            x: this.playerX,
            y: this.height - 90,
            text: '⚡利上げ砲被弾！ -500',
            color: '#ff1744',
            life: 1.0
          });
          this.score = Math.max(0, this.score - 500);
          this.cb.onScoreChange(this.score);
          if (this.hp <= 0) {
            this.finishGame();
            return;
          }
        }
      }
      if (this.laserWarning.timer <= 0) {
        this.laserWarning = null;
      }
    }

    if (this.frameCount % spawnInterval === 0) {
      const isBad = Math.random() < 0.32;
      const pool = isBad ? this.badItems : this.goodItems;
      const spec = pool[Math.floor(Math.random() * pool.length)];
      if (spec) {
        this.falling.push({
          x: 32 + Math.random() * (this.width - 64),
          y: -25,
          vy: (spec.speed || 3.5) * (isFever ? 1.22 : 1.0),
          isBad,
          spec
        });
      }
    }

    const catcherY = this.height - 52;
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const item = this.falling[i];
      item.y += item.vy;

      const dist = Math.hypot(item.x - this.playerX, item.y - catcherY);
      if (dist < 42) {
        this.score = Math.max(0, this.score + item.spec.score);
        this.cb.onScoreChange(this.score);
        this.audio.playSE(item.isBad ? 'damage' : 'hit');
        this.popups.push({
          x: item.x,
          y: catcherY - 24,
          text: `${item.spec.name} ${item.spec.score > 0 ? '+' : ''}${item.spec.score}`,
          color: item.isBad ? '#ff5252' : '#69f0ae',
          life: 1.0
        });

        if (item.isBad) {
          this.hp--;
          this.cb.onTimeChange(this.hp > 0 ? '💰'.repeat(this.hp) : '💀退場');
          this.rich.triggerCutin(
            item.spec.name,
            item.spec.quote || '暴落トラップ被弾！強制ロスカット危機！',
            'uedaa_gov',
            '🚨 暴落被弾速報'
          );
          if (this.hp <= 0) {
            this.finishGame();
            return;
          }
        } else {
          this.caughtCount++;
          if (item.spec.score >= 400 || this.caughtCount % 5 === 0) {
            this.rich.triggerCutin(
              item.spec.name,
              item.spec.quote || '急騰銘柄ガチホ成功！！',
              'kiritama_master',
              '💰 大口利確速報'
            );
          }
          if (this.caughtCount >= 25) {
            this.score += 2000;
            this.cb.onScoreChange(this.score);
            this.finishGame();
            return;
          }
        }
        this.falling.splice(i, 1);
      } else if (item.y > this.height + 35) {
        this.falling.splice(i, 1);
      }
    }

    this.popups.forEach(p => {
      p.y -= 1.3;
      p.life -= 0.035;
    });
    this.popups = this.popups.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    this.rich.drawStageBackground(this.width, this.height);

    // 利上げレーザー予告＆照射描画
    if (this.laserWarning) {
      const lw = this.laserWarning;
      ctx.save();
      if (lw.timer > 15) {
        ctx.fillStyle = 'rgba(255, 23, 68, 0.22)';
        ctx.fillRect(lw.x - 28, 0, 56, this.height);
        ctx.strokeStyle = '#ff1744';
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(lw.x - 28, 0, 56, this.height);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️利上げ砲予告⚠️', lw.x, 32);
      } else {
        const beamGrad = ctx.createLinearGradient(lw.x - 30, 0, lw.x + 30, 0);
        beamGrad.addColorStop(0, '#ff1744');
        beamGrad.addColorStop(0.5, '#ffffff');
        beamGrad.addColorStop(1, '#ff1744');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(lw.x - 26, 0, 52, this.height);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡サプライズ利上げ砲！！⚡', lw.x, 120);
      }
      ctx.restore();
    }

    for (const item of this.falling) {
      this.rich.drawRichCharacter(item.x, item.y, 26, {
        emoji: item.spec.emoji,
        name: item.spec.name,
        color: item.isBad ? '#ef4444' : '#10b981',
        avatar: item.spec.avatar
      });
    }

    const catcherY = this.height - 52;
    this.rich.drawRichCharacter(this.playerX, catcherY, 34, {
      emoji: this.playerSpec.emoji,
      name: this.playerSpec.name,
      color: '#f59e0b',
      avatar: this.playerSpec.avatar || 'kiritama_master'
    });

    for (const p of this.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 13px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
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

window.CatcherGameEngine = CatcherGameEngine;
