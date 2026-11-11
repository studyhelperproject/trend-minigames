/**
 * Engine 2: 2048-Evolution (60秒スライド合体進化パズルエンジン)
 * 参照OSS: gabrielecirulli/2048 (MIT)
 * キーボード・タッチスワイプ・画面クリック4方向対応
 */
class Game2048Engine {
  constructor(canvas, theme, audio, sdk, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.audio = audio;
    this.sdk = sdk;
    this.cb = callbacks;

    this.width = 400;
    this.height = 460;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.itemMap = {};
    (theme.items || []).forEach(it => {
      this.itemMap[it.value] = it;
    });

    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.timeLeft = 60;
    this.isRunning = false;
    this.timerInterval = null;

    this.bindEvents();
    this.renderEvolutionGuide();
  }

  createEmptyGrid() {
    return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  }

  renderEvolutionGuide() {
    const guide = document.getElementById('evolutionGuide');
    if (!guide) return;
    const chain = (this.theme.items || []).slice(0, 8).map(it => `${it.emoji}${it.name.slice(0, 4)}`).join(' ➔ ');
    guide.innerHTML = `<strong>【防衛進化チャート】</strong> ${chain} ...`;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      const map = {
        ArrowUp: 'up', KeyW: 'up',
        ArrowDown: 'down', KeyS: 'down',
        ArrowLeft: 'left', KeyA: 'left',
        ArrowRight: 'right', KeyD: 'right'
      };
      if (map[e.code]) {
        e.preventDefault();
        this.move(map[e.code]);
      }
    });

    let startX = 0, startY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isRunning || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.hypot(dx, dy) < 15) {
        this.handleCanvasTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        this.move(dx > 0 ? 'right' : 'left');
      } else {
        this.move(dy > 0 ? 'down' : 'up');
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.isRunning) return;
      this.handleCanvasTap(e.clientX, e.clientY);
    });
  }

  handleCanvasTap(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (this.width / rect.width);
    const y = (clientY - rect.top) * (this.height / rect.height);

    // Bottom quick buttons area
    if (y > 395) {
      if (x < 100) this.move('left');
      else if (x < 200) this.move('up');
      else if (x < 300) this.move('down');
      else this.move('right');
      return;
    }

    // Relative to center of board
    const cx = 200, cy = 200;
    const dx = x - cx, dy = y - cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.move(dx > 0 ? 'right' : 'left');
    } else {
      this.move(dy > 0 ? 'down' : 'up');
    }
  }

  start() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.timeLeft = 60;
    this.isRunning = true;
    this.startTime = Date.now();

    this.spawnTile();
    this.spawnTile();
    this.cb.onScoreChange(this.score);
    this.cb.onTimeChange(this.timeLeft);
    this.draw();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.timeLeft--;
      this.cb.onTimeChange(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.finishGame();
      }
    }, 1000);
  }

  spawnTile() {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.85 ? 2 : 4;
  }

  slideRow(row) {
    let arr = row.filter(v => v !== 0);
    let gained = 0;
    let maxMerged = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gained += arr[i];
        maxMerged = Math.max(maxMerged, arr[i]);
        arr[i + 1] = 0;
      }
    }
    arr = arr.filter(v => v !== 0);
    while (arr.length < 4) arr.push(0);
    return { arr, gained, maxMerged };
  }

  move(dir) {
    if (!this.isRunning) return;
    const oldState = JSON.stringify(this.grid);
    let totalGained = 0;
    let highestMerge = 0;

    const rotateLeft = (m) => m[0].map((_, i) => m.map(row => row[3 - i]));
    const rotateRight = (m) => m[0].map((_, i) => m.map(row => row[i]).reverse());

    let work = this.grid.map(r => [...r]);
    if (dir === 'up') work = rotateLeft(work);
    if (dir === 'right') work = rotateRight(rotateRight(work));
    if (dir === 'down') work = rotateRight(work);

    work = work.map(row => {
      const res = this.slideRow(row);
      totalGained += res.gained;
      highestMerge = Math.max(highestMerge, res.maxMerged);
      return res.arr;
    });

    if (dir === 'up') work = rotateRight(work);
    if (dir === 'right') work = rotateRight(rotateRight(work));
    if (dir === 'down') work = rotateLeft(work);

    if (JSON.stringify(work) !== oldState) {
      this.grid = work;
      this.score += totalGained;
      this.cb.onScoreChange(this.score);
      if (highestMerge > 0) {
        const lv = Math.log2(highestMerge);
        this.audio.playSE('merge', lv);
      } else {
        this.audio.playSE('drop');
      }
      this.spawnTile();
      this.draw();

      if (!this.canMoveAny()) {
        this.finishGame();
      }
    }
  }

  canMoveAny() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) return true;
        if (c < 3 && this.grid[r][c] === this.grid[r][c + 1]) return true;
        if (r < 3 && this.grid[r][c] === this.grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const pad = 12;
    const cellSize = 85;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        const x = pad + c * (cellSize + 8);
        const y = pad + r * (cellSize + 8);

        const spec = this.itemMap[val] || {
          color: 'rgba(255,255,255,0.08)',
          text_color: '#fff',
          emoji: '',
          name: ''
        };

        ctx.fillStyle = val === 0 ? 'rgba(255,255,255,0.08)' : spec.color;
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 10);
        ctx.fill();

        if (val > 0) {
          ctx.fillStyle = spec.text_color || '#fff';
          ctx.textAlign = 'center';
          ctx.font = '26px sans-serif';
          ctx.fillText(spec.emoji || '🛡️', x + cellSize / 2, y + 34);

          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(val.toString(), x + cellSize / 2, y + 54);

          ctx.font = 'bold 10px sans-serif';
          ctx.fillText((spec.name || '').slice(0, 7), x + cellSize / 2, y + 72);
        }
      }
    }

    // Draw touch buttons at bottom
    const btns = [
      { label: '⬅ 左', x: 12 },
      { label: '⬆ 上', x: 108 },
      { label: '⬇ 下', x: 204 },
      { label: '➡ 右', x: 300 }
    ];
    btns.forEach(b => {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(b.x, 400, 88, 46, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x + 44, 428);
    });
  }

  finishGame() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.audio.playSE('gameover');
    const durationSec = Math.max(5, Math.round((Date.now() - this.startTime) / 1000));
    this.cb.onGameOver(this.score, durationSec);
  }
}

window.Game2048Engine = Game2048Engine;
