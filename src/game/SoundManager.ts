export class SoundManager {
  ctx: AudioContext;
  masterGain: GainNode;
  bgmOscillators: OscillatorNode[] = [];
  isPlayingBgm: boolean = false;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Master volume
    this.masterGain.connect(this.ctx.destination);
  }

  lastHitTime: number = 0;
  lastShootTime: number = 0;

  playShoot() {
    const now = this.ctx.currentTime;
    // Limit shoot sound to 15 times per second (approx every 60ms)
    // Prevents audio tearing at very high attack speeds
    if (now - this.lastShootTime < 0.06) return;
    this.lastShootTime = now;

    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'triangle'; // Softer than square
    osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playExplosion() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playPowerUp() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playBuffAddPlane() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    // Major chord arpeggio fast
    osc.type = 'square';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playBuffAttackSpeed() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    // Rising slide
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime); 
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playBuffAttackPower() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    // Low powerful thud/rise
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime); 
    osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playHit() {
    const now = this.ctx.currentTime;
    // Limit hit sound to 10 times per second (every 100ms)
    // Crucial for penetrating bullets hitting many blocks
    if (now - this.lastHitTime < 0.1) return;
    this.lastHitTime = now;

    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime); // Lower volume for hits
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playMetalHit() {
    // Metal clang sound for Head
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    // Multiple oscillators for metallic ring
    const freqs = [800, 1200, 1500];
    
    freqs.forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'triangle'; // Triangle is good for metal
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        // Slight detune for dissonance
        osc.detune.value = Math.random() * 50; 
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    });
  }

  playLevelUp() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    
    notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.4);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
    });
  }
  
  startBGM() {
      if (this.isPlayingBgm) return;
      this.isPlayingBgm = true;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      
      // Simple looped arpeggio
      const notes = [220, 261.63, 329.63, 392]; // Am7
      let noteIndex = 0;
      
      const playNextNote = () => {
          if (!this.isPlayingBgm) return;
          
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.connect(gain);
          gain.connect(this.masterGain);
          
          osc.type = 'triangle';
          const freq = notes[noteIndex % notes.length];
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          
          // Soft pluck envelope
          gain.gain.setValueAtTime(0, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
          
          osc.start(this.ctx.currentTime);
          osc.stop(this.ctx.currentTime + 0.5);
          
          noteIndex++;
          
          setTimeout(playNextNote, 250); // 120 BPM eighth notes
      };
      
      playNextNote();
      
      // Add a bass line
      const playBass = () => {
         if (!this.isPlayingBgm) return;
         
         const osc = this.ctx.createOscillator();
         const gain = this.ctx.createGain();
         
         osc.connect(gain);
         gain.connect(this.masterGain);
         
         osc.type = 'sine';
         osc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1
         
         gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
         
         osc.start(this.ctx.currentTime);
         osc.stop(this.ctx.currentTime + 2);
         
         setTimeout(playBass, 2000); // Once every 2 seconds
      }
      playBass();
  }

  stopBGM() {
      this.isPlayingBgm = false;
  }
}
