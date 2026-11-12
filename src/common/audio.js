/**
 * Rich Multi-Track Synth & Arcade Sound Engine (Web Audio API)
 * ドラムビート（Kick / Snare / Hi-Hat）＋重低音ベース＋コード和音＋リードメロディの4トラック同時演奏
 * ＆ 記者会見カメラシャッター連写音・爆発音・コイン音などのリアル効果音合成
 */
class ProceduralAudioEngine {
  constructor(preset = 'upbeat_pop') {
    this.preset = preset;
    this.ctx = null;
    this.isMuted = false;
    this.isPlayingBgm = false;
    this.bgmTimer = null;
    this.stepIndex = 0;

    // 16ステップのマルチトラックシーケンス定義
    this.presets = {
      upbeat_pop: {
        tempoMs: 135,
        leadWave: 'triangle',
        bassWave: 'sawtooth',
        lead: [523.25, 0, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 1046.5, 987.77, 783.99, 659.25, 587.33],
        bass: [130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.0, 196.0],
        chords: [
          [261.63, 329.63, 392.0],
          [220.0, 261.63, 329.63],
          [174.61, 220.0, 261.63],
          [196.0, 246.94, 293.66]
        ]
      },
      cyber_tension: {
        tempoMs: 125,
        leadWave: 'sawtooth',
        bassWave: 'sawtooth',
        lead: [220.0, 261.63, 329.63, 440.0, 392.0, 329.63, 293.66, 261.63, 220.0, 329.63, 440.0, 523.25, 493.88, 440.0, 329.63, 246.94],
        bass: [110.0, 110.0, 110.0, 130.81, 146.83, 146.83, 130.81, 98.0],
        chords: [
          [220.0, 261.63, 329.63],
          [174.61, 220.0, 261.63],
          [146.83, 174.61, 220.0],
          [164.81, 196.0, 246.94]
        ]
      },
      retro_8bit: {
        tempoMs: 130,
        leadWave: 'square',
        bassWave: 'triangle',
        lead: [392.0, 440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 440.0],
        bass: [196.0, 196.0, 146.83, 146.83, 164.81, 164.81, 130.81, 146.83],
        chords: [
          [196.0, 246.94, 293.66],
          [146.83, 185.0, 220.0],
          [164.81, 196.0, 246.94],
          [130.81, 164.81, 196.0]
        ]
      },
      panic_rush: {
        tempoMs: 115,
        leadWave: 'sawtooth',
        bassWave: 'square',
        lead: [329.63, 392.0, 493.88, 659.25, 698.46, 659.25, 493.88, 392.0, 329.63, 493.88, 659.25, 783.99, 739.99, 659.25, 493.88, 369.99],
        bass: [164.81, 164.81, 196.0, 196.0, 220.0, 220.0, 246.94, 196.0],
        chords: [
          [164.81, 196.0, 246.94],
          [196.0, 246.94, 293.66],
          [220.0, 261.63, 329.63],
          [246.94, 293.66, 369.99]
        ]
      },
      chill_melody: {
        tempoMs: 165,
        leadWave: 'sine',
        bassWave: 'triangle',
        lead: [261.63, 329.63, 392.0, 523.25, 493.88, 392.0, 329.63, 293.66, 261.63, 329.63, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0],
        bass: [130.81, 130.81, 98.0, 98.0, 110.0, 110.0, 87.31, 98.0],
        chords: [
          [261.63, 329.63, 392.0],
          [196.0, 246.94, 293.66],
          [220.0, 261.63, 329.63],
          [174.61, 220.0, 261.63]
        ]
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
      const step = this.stepIndex % 16;

      // 1. Drum Track (Kick on 0, 4, 8, 12 / Snare on 4, 12 / HiHat on every even step)
      if (step % 4 === 0) this.playDrumKick();
      if (step % 8 === 4) this.playNoiseBurst(0.08, 0.045, 1200); // Snare
      if (step % 2 === 1) this.playNoiseBurst(0.03, 0.02, 5000);  // Hi-Hat

      // 2. Bass Track
      const bassFreq = cfg.bass[Math.floor(step / 2) % cfg.bass.length];
      if (bassFreq) {
        this.playTone(bassFreq, cfg.tempoMs / 1000 * 0.85, cfg.bassWave, 0.042);
      }

      // 3. Chord Pad (on step 0, 4, 8, 12)
      if (step % 4 === 0 && cfg.chords) {
        const chord = cfg.chords[Math.floor(step / 4) % cfg.chords.length];
        chord.forEach(f => {
          this.playTone(f, (cfg.tempoMs * 3.8) / 1000, 'sine', 0.022);
        });
      }

      // 4. Lead Melody
      const leadFreq = cfg.lead[step % cfg.lead.length];
      if (leadFreq > 0) {
        this.playTone(leadFreq, cfg.tempoMs / 1000 * 0.78, cfg.leadWave, 0.048);
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

  playDrumKick() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.11);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playNoiseBurst(durationSec = 0.06, volume = 0.04, filterFreq = 2000) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
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
    this.initContext();
    switch (type) {
      case 'drop':
        this.playTone(340, 0.08, 'sine', 0.09, 170);
        break;
      case 'merge':
        // 進化音＋高ランク時は記者会見のカメラシャッター連写音
        const baseFreq = 350 + (level * 65);
        this.playTone(baseFreq, 0.14, 'triangle', 0.13, baseFreq * 1.4);
        this.playTone(baseFreq * 1.25, 0.18, 'sine', 0.09, baseFreq * 1.6);
        if (level >= 3) {
          this.playNoiseBurst(0.04, 0.06, 3500);
          setTimeout(() => this.playNoiseBurst(0.04, 0.06, 4200), 65);
        }
        break;
      case 'jump':
        this.playTone(300, 0.11, 'square', 0.075, 620);
        break;
      case 'hit':
        // 爽快チャリン＆パンチ音
        this.playTone(587.33, 0.08, 'triangle', 0.11, 880);
        setTimeout(() => this.playTone(1174.66, 0.12, 'sine', 0.11), 50);
        break;
      case 'damage':
        this.playNoiseBurst(0.14, 0.09, 600);
        this.playTone(180, 0.24, 'sawtooth', 0.12, 85);
        break;
      case 'reward':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          setTimeout(() => this.playTone(f, 0.2, 'triangle', 0.13), idx * 75);
        });
        break;
      case 'gameover':
        [392.0, 349.23, 329.63, 261.63].forEach((f, idx) => {
          setTimeout(() => this.playTone(f, 0.22, 'sawtooth', 0.1, f * 0.92), idx * 120);
        });
        break;
    }
  }
}

window.ProceduralAudioEngine = ProceduralAudioEngine;
