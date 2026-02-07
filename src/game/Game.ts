import { Player } from './Player';
import { Bullet } from './Bullet';
import { Dragon } from './Dragon';
import { type BuffType } from './Block';
import { SoundManager } from './SoundManager';
import { Particle } from './Particle';
import { Background } from './Background';
import { GameConfig } from './Config';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  player: Player;
  dragons: Dragon[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  score: number = 0;
  level: number = 1;
  gameOver: boolean = false;
  
  scoreElement: HTMLElement;
  scoreDisplay: HTMLElement;
  levelDisplay: HTMLElement;
  hpBar: HTMLElement;
  hpText: HTMLElement;
  gameOverElement: HTMLElement;
  restartButton: HTMLElement;
  
  soundManager: SoundManager;
  background: Background;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.width = GameConfig.GAME_WIDTH;
    this.height = GameConfig.GAME_HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // UI Elements
    this.scoreDisplay = document.getElementById('score-display')!;
    this.levelDisplay = document.getElementById('level-display')!;
    this.hpBar = document.getElementById('hp-bar')!;
    this.hpText = document.getElementById('hp-text')!;
    // Legacy/Fallback
    this.scoreElement = this.scoreDisplay || document.getElementById('score')!;
    
    this.gameOverElement = document.getElementById('game-over')!;
    this.restartButton = document.getElementById('restart-btn')!;
    
    this.soundManager = new SoundManager();
    this.background = new Background(this.width, this.height);

    this.player = new Player(this);
    this.initDragons(1);

    // Event listeners
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.handleInput(e.clientX, e.clientY));
    this.canvas.addEventListener('mousedown', () => {
        // Ensure AudioContext starts on user interaction
        if (this.soundManager.ctx.state === 'suspended') {
            this.soundManager.ctx.resume();
        }
        this.soundManager.startBGM();
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleInput(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    this.canvas.addEventListener('touchstart', () => {
         if (this.soundManager.ctx.state === 'suspended') {
            this.soundManager.ctx.resume();
        }
        this.soundManager.startBGM();
    });
    
    this.restartButton.addEventListener('click', () => this.restart());

    this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    // Note: Background might need resize logic, but for now simple recreation or just tolerance is ok
    // ideally: this.background.width = this.width; this.background.height = this.height;
  }

  handleInput(x: number, y: number) {
    if (!this.gameOver) {
      this.player.x = x;
      this.player.y = y - 50; // Offset slightly above finger
    }
  }

  restart() {
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.bullets = [];
    this.particles = [];
    this.player = new Player(this);
    this.initDragons(1);
    this.background = new Background(this.width, this.height); // Reset background too? or keep it
    this.gameOverElement.classList.add('hidden');
    this.soundManager.startBGM();
    this.animate(0);
  }

  initDragons(level: number) {
      this.dragons = [];
      // Calculate how many dragons based on level
      const dragonCount = 1 + Math.floor((level - 1) / GameConfig.DRAGON_SPAWN_INTERVAL_LEVELS);
      
      const segmentWidth = this.width / dragonCount;

      for(let i=0; i<dragonCount; i++) {
          const dragon = new Dragon(this);
          
          // Set center X for this dragon to oscillate around
          dragon.centerX = (i * segmentWidth) + (segmentWidth / 2);
          
          dragon.init(level);
          
          // Offset oscillation phase so they don't move in sync
          if (dragonCount > 1) {
              dragon.angle += i * Math.PI;
          }
          
          this.dragons.push(dragon);
      }
  }

  start() {
    this.animate(0);
  }

  levelUp() {
      this.level++;
      this.soundManager.playPowerUp(); 
      
      if (this.level > GameConfig.GAME_WIN_LEVEL) {
          this.triggerVictory();
          return;
      }
      
      this.initDragons(this.level);
  }

  handleDragonEscape(dragon: Dragon) {
      // Get all blocks that are not marked for deletion AND are still alive (value > 0)
      const remainingBlocks = dragon.blocks.filter(b => !b.markedForDeletion && b.value > 0).length;
      
      if (remainingBlocks > 0) {
          const damage = remainingBlocks * GameConfig.BLOCK_DAMAGE_TO_PLAYER;
          this.player.takeDamage(damage);
          this.soundManager.playHit(); 
          this.createExplosion(this.player.x, this.player.y, 'red', 10);
      }
      
      const index = this.dragons.indexOf(dragon);
      if (index > -1) {
          this.dragons.splice(index, 1);
      }
      
      // If player died from this damage, game loop will catch it in animate()
      // If player survived, check if we need to level up (if all dragons gone)
      if (this.dragons.length === 0 && this.player.hp > 0) {
          this.levelUp();
      }
  }

  triggerVictory() {
      this.gameOver = true;
      this.gameOverElement.classList.remove('hidden');
      this.gameOverElement.innerHTML = `<h1>VICTORY!</h1><p>Score: ${this.score}</p><button id="restart-btn">Play Again</button>`;
      
      // Re-bind restart button for victory screen
      const newBtn = this.gameOverElement.querySelector('#restart-btn');
      if (newBtn) newBtn.addEventListener('click', () => this.restart());

      this.soundManager.stopBGM();
      this.soundManager.playLevelUp();
  }
  
  triggerGameOver() {
      this.gameOver = true;
      this.gameOverElement.classList.remove('hidden');
      this.gameOverElement.innerHTML = `<h1>CHALLENGE FAILED</h1><p>Score: ${this.score}</p><button id="restart-btn">Try Again</button>`;
      
      // Re-bind restart button
      const newBtn = this.gameOverElement.querySelector('#restart-btn');
      if (newBtn) newBtn.addEventListener('click', () => this.restart());

      this.soundManager.stopBGM();
      this.soundManager.playExplosion(); 
  }

  animate(timeStamp: number) {
    if (this.gameOver) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw Background
    this.background.update();
    this.background.draw(this.ctx);

    // Check Level Up
    if (this.dragons.length === 0) {
        this.levelUp();
    }
    
    // Check Player HP
    if (this.player.hp <= 0) {
        this.triggerGameOver();
        return;
    }

    // Update and Draw Dragons
    // Iterate backwards for safe removal
    for (let i = this.dragons.length - 1; i >= 0; i--) {
        const dragon = this.dragons[i];
        dragon.update();
        dragon.draw(this.ctx);
        
        // Check if dragon head is dead (Killed by player)
        if (dragon.headDead) {
             // Reward logic
             this.score += GameConfig.HEAD_HP_BASE * 5; 
             this.createExplosion(dragon.blocks[0].x, dragon.blocks[0].y, '#FFD700', 50); // Massive Gold Explosion
             this.soundManager.playExplosion();
             
             // Absorb buffs
             dragon.blocks.forEach(block => {
                  if (!block.markedForDeletion && block.buff !== 'NONE') {
                      this.applyBuff(block.buff);
                      this.createExplosion(block.x, block.y, block.getColor(), 20); 
                  }
             });
             
             // Remove dragon
             this.dragons.splice(i, 1);
             continue; // Skip rest of loop for this dragon
        }
        
        // Check if dragon reached bottom
        if (!dragon.headDead) {
             const head = dragon.blocks[0];
             if (head && head.y > this.height + 50) {
                 this.handleDragonEscape(dragon);
             }
        }
    }

    // Update and Draw Player
    this.player.update(timeStamp);
    this.player.draw(this.ctx);

    // Update and Draw Bullets
    this.bullets.forEach(bullet => {
        bullet.update();
        bullet.draw(this.ctx);
    });
    this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);
    
    // Update and Draw Particles
    this.particles.forEach(p => {
        p.update();
        p.draw(this.ctx);
    });
    this.particles = this.particles.filter(p => p.life > 0);

    // Check Collisions
    this.checkCollisions();

    // UI Update
    if (this.scoreDisplay) this.scoreDisplay.innerText = `Score: ${this.score}`;
    if (this.levelDisplay) this.levelDisplay.innerText = `Level: ${this.level}`;
    
    // Update HP Bar
    if (this.hpBar && this.hpText) {
        const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        this.hpBar.style.height = `${hpPercent}%`; // Vertical bar uses height
        this.hpText.innerText = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
        
        // Color change based on HP
        if (hpPercent < 20) {
            this.hpBar.style.background = 'linear-gradient(0deg, #ff4d4d, #ff0000)';
            this.hpBar.style.boxShadow = '0 0 10px #ff0000';
        } else if (hpPercent < 50) {
             this.hpBar.style.background = 'linear-gradient(0deg, #ffd700, #ffa500)';
             this.hpBar.style.boxShadow = '0 0 10px #ffa500';
        } else {
             this.hpBar.style.background = 'linear-gradient(0deg, #90ee90, #32cd32)';
             this.hpBar.style.boxShadow = '0 0 10px #32cd32';
        }
    }

    if (this.player.slowDebuffTimer > 0) {
        if (this.scoreDisplay) {
            this.scoreDisplay.innerText += " [SLOWED]";
            this.scoreDisplay.style.color = 'orange';
        }
    } else {
        if (this.scoreDisplay) {
            this.scoreDisplay.style.color = 'white';
        }
    }

    requestAnimationFrame((ts) => this.animate(ts));
  }

  checkCollisions() {
    // Bullets vs Dragon Blocks
    this.bullets.forEach(bullet => {
        this.dragons.forEach(dragon => {
             dragon.blocks.forEach(block => {
                if (!block.markedForDeletion && !bullet.markedForDeletion) {
                    if (this.checkCollisionCircle(bullet.x, bullet.y, bullet.radius, block.x, block.y, block.radius)) {
                        
                        if (!bullet.hitBlocks.has(block)) {
                            // Play hit sound
                            if (block.isHead) {
                                this.soundManager.playMetalHit();
                            } else {
                                this.soundManager.playHit();
                            }
                            
                            if (block.takeDamage(bullet.damage)) {
                                this.score += block.maxHealth;
                                this.applyBuff(block.buff);
                                this.createExplosion(block.x, block.y, block.color);
                                this.soundManager.playExplosion();
                                
                                if (block.isHead) {
                                    dragon.headDead = true;
                                    // Golden Huge Explosion for Head
                                    this.createExplosion(block.x, block.y, '#FFD700', 50);
                                    this.soundManager.playExplosion(); // Maybe louder?
                                }
                            }
                            
                            // Update bullet status
                            bullet.onHit(block);
                        }
                    }
                }
            });
        });
    });

    // Player vs Dragon Blocks
    this.dragons.forEach(dragon => {
        dragon.blocks.forEach(block => {
            if (!block.markedForDeletion) {
                 // Simple approximation: Player is roughly a circle of radius width/2
                 if (this.checkCollisionCircle(this.player.x, this.player.y, this.player.width/2, block.x, block.y, block.radius)) {
                     // Direct collision with dragon body/head is instant death as per user request
                     // "但是玩家接触到龙直接判定为输"
                     this.triggerGameOver();
                 }
            }
        });
    });
  }

  createExplosion(x: number, y: number, color: string, count: number = 10) {
      for(let i=0; i<count; i++) {
          this.particles.push(new Particle(x, y, color));
      }
  }

  checkCollisionCircle(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
      const dx = x1 - x2;
      const dy = y1 - y2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < r1 + r2;
  }

  applyBuff(buff: BuffType) {
      if (buff === 'NONE') return;

      if (buff === 'ADD_PLANE') {
          this.player.addPlane();
          this.soundManager.playBuffAddPlane();
      } else if (buff === 'ATTACK_SPEED') {
          this.player.increaseAttackSpeed();
          this.soundManager.playBuffAttackSpeed();
      } else if (buff === 'ATTACK_POWER') {
          this.player.increasePower();
          this.soundManager.playBuffAttackPower();
      } else if (buff === 'HEAL') {
          this.player.heal(GameConfig.HEAL_AMOUNT);
          this.soundManager.playPowerUp(); // Reuse sound or new one
          this.createHealingEffect(this.player.x, this.player.y);
      } else if (buff === 'DEBUFF_SLOW') {
          this.player.applySlowDebuff(300); // 5 seconds (60fps)
          this.soundManager.playHit(); // Negative sound
          this.createExplosion(this.player.x, this.player.y, '#808080', 15);
      }
      
      // Floating text or effect could be added here
  }
  
  createHealingEffect(x: number, y: number) {
      // Create green '+' particles that float up
      for(let i=0; i<5; i++) {
          const p = new Particle(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, '#32cd32');
          p.speedY = -2 - Math.random(); // Float up
          p.speedX = (Math.random() - 0.5) * 1;
          p.life = 60; // Last 1 second
          // We could add a custom draw method for '+' shape if we extend Particle, 
          // but for now simple green particles are okay, or we can add text.
      }
      
      // Add floating text
      // Ideally we need a floating text system, but let's just use particles for now
  }
}

