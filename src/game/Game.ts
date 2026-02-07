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
  dragon: Dragon;
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  score: number = 0;
  level: number = 1;
  gameOver: boolean = false;
  scoreElement: HTMLElement;
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

    this.scoreElement = document.getElementById('score')!;
    this.gameOverElement = document.getElementById('game-over')!;
    this.restartButton = document.getElementById('restart-btn')!;
    
    this.soundManager = new SoundManager();
    this.background = new Background(this.width, this.height);

    this.player = new Player(this);
    this.dragon = new Dragon(this);

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
    this.dragon = new Dragon(this);
    this.background = new Background(this.width, this.height); // Reset background too? or keep it
    this.gameOverElement.classList.add('hidden');
    this.soundManager.startBGM();
    this.animate(0);
  }

  start() {
    this.animate(0);
  }

  animate(timeStamp: number) {
    if (this.gameOver) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw Background
    this.background.update();
    this.background.draw(this.ctx);

    // Check Level Up
    if (this.dragon.headDead) {
        this.levelUp();
    }

    // Update and Draw Dragon
    this.dragon.update();
    this.dragon.draw(this.ctx);

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
    this.scoreElement.innerText = `Score: ${this.score} | Level: ${this.level}`;

    requestAnimationFrame((ts) => this.animate(ts));
  }

  levelUp() {
      this.level++;
      
      // Head Defeat Reward
      this.score += GameConfig.HEAD_HP_BASE * 5; // Big Score Bonus
      this.createExplosion(this.width/2, this.height/2, '#FFD700', 100); // Massive Gold Explosion
      
      // Guaranteed Upgrades for Killing Head
      this.player.increasePower();
      this.player.increaseAttackSpeed();
      // Also maybe heal player if we had HP? (Player currently has no HP, just 1-hit kill)

      // Absorb all remaining buffs from dragon body
      this.dragon.blocks.forEach(block => {
          if (!block.markedForDeletion && block.buff !== 'NONE') {
              this.applyBuff(block.buff);
              // Visual effect for absorbed buff
              this.createExplosion(block.x, block.y, block.getColor(), 20); 
          }
      });

      this.dragon.init(this.level);
      // Maybe show level up text?
      this.soundManager.playPowerUp();
  }

  checkCollisions() {
    // Bullets vs Dragon Blocks
    this.bullets.forEach(bullet => {
        this.dragon.blocks.forEach(block => {
            if (!block.markedForDeletion && !bullet.markedForDeletion) {
                if (this.checkCollisionCircle(bullet.x, bullet.y, bullet.radius, block.x, block.y, block.radius)) {
                    // Check if bullet can hit this block (penetration logic inside onHit)
                    // Note: onHit returns true if bullet survives (penetrates), false if it dies
                    
                    // We need to apply damage first before checking if bullet dies, 
                    // BUT bullet.onHit modifies damage for NEXT hit.
                    // So we use current damage.
                    
                    if (!bullet.hitBlocks.has(block)) {
                        // Play hit sound
                        this.soundManager.playHit();
                        
                        if (block.takeDamage(bullet.damage)) {
                            this.score += block.maxHealth;
                            this.applyBuff(block.buff);
                            this.createExplosion(block.x, block.y, block.color);
                            this.soundManager.playExplosion();
                        }
                        
                        // Update bullet status
                        bullet.onHit(block);
                    }
                }
            }
        });
    });

    // Player vs Dragon Blocks
    this.dragon.blocks.forEach(block => {
        if (!block.markedForDeletion) {
             // Simple approximation: Player is roughly a circle of radius width/2
             if (this.checkCollisionCircle(this.player.x, this.player.y, this.player.width/2, block.x, block.y, block.radius)) {
                 this.triggerGameOver();
             }
        }
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
      }
      
      // Floating text or effect could be added here
  }
  
  triggerGameOver() {
      this.gameOver = true;
      this.gameOverElement.classList.remove('hidden');
      this.soundManager.stopBGM();
      this.soundManager.playExplosion(); // Game over sound
  }
}

