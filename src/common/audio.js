/**
 * Web Audio API Procedural BGM & Sound Effects Synthesizer
 * 外部MP3ファイル不要・著作権完全フリー・容量0KBでテーマ別BGMと効果音を自動生成
 */
class ProceduralAudioEngine {
  constructor(preset = 'upbeat_pop') {
    this.preset = preset;
    this.ctx = null;
    this.isMuted = false;
    this.isPlayingBgm = false;
    this.bgmTimer = null;
    this.stepIndex = 0;

    this.presets = {
      upbeat_pop: {
        tempoMs: 190,
        wave: 'triangle',
        notes: [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33]
      },
      cyber_tension: {
        tempoMs: 165,
        wave: 'sawtooth',
        notes: [220.0, 261.63, 329.63, 220.0, 293.66, 349.23, 329.63, 196.0]
      },
      retro_8bit: {
        tempoMs: 180,
        wave: 'square',
        notes: [392.0, 440.0, 493.88, 523.25, 587.33, 523.25, 493.88, 440.0]
      },
      panic_rush: {
        tempoMs: 145,
        wave: 'square',
        notes: [329.63, 392.0, 493.88, 659.25, 587.33, 493.88, 392.0, 329.63]
      },
      chill_melody: {
        tempoMs: 240,
        wave: 'sine',
        notes: [261.63, 329.63, 392.0, 493.88, 440.0, 392.0, 329.63, 293.66]
      }
    };
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }

  startBgm() {
    if (this.isMuted || this.isPlayingBgm) return;
    this.initContext();
    if (!this.ctx) return;

    this.isPlayingBgm = true;
    const cfg = this.presets[this.preset] || this.presets.upbeat_pop;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.isPlayingBgm) return;
      const freq = cfg.notes[this.stepIndex % cfg.notes.length];
      this.playTone(freq, cfg.tempoMs / 1000 * 0.75, cfg.wave, 0.045);
      if (this.stepIndex % 2 === 0) {
        this.playTone(freq / 2, cfg.tempoMs / 1000 * 0.85, 'sine', 0.035);
      }
      this.stepIndex++;
    }, cfg.tempoMs);
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playTone(freq, durationSec, type = 'sine', volume = 0.08, slideToFreq = null) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + durationSec);
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec);
  }

  playSE(type, level = 1) {
    if (this.isMuted) return;
    switch (type) {
      case 'drop':
        this.playTone(300, 0.09, 'sine', 0.08, 180);
        break;
      case 'merge':
        const baseFreq = 330 + (level * 55);
        this.playTone(baseFreq, 0.14, 'triangle', 0.12, baseFreq * 1.35);
        break;
      case 'jump':
        this.playTone(280, 0.12, 'square', 0.07, 560);
        break;
      case 'hit':
        this.playTone(520, 0.1, 'triangle', 0.1, 880);
        break;
      case 'damage':
        this.playTone(190, 0.22, 'sawtooth', 0.11, 95);
        break;
      case 'reward':
        this.playTone(523.25, 0.12, 'triangle', 0.12, 659.25);
        setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.14, 1046.5), 110);
        break;
      case 'gameover':
        this.playTone(392.0, 0.18, 'sawtooth', 0.1, 329.63);
        setTimeout(() => this.playTone(293.66, 0.35, 'sawtooth', 0.1, 196.0), 180);
        break;
    }
  }
}

window.ProceduralAudioEngine = ProceduralAudioEngine;
