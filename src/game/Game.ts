import { Player } from './Player';
import { Bullet } from './Bullet';
import { Dragon } from './Dragon';
import { type BuffType } from './Block';
import { SoundManager } from './SoundManager';
import { Particle } from './Particle';
import { Background } from './Background';
import { GameConfig } from './Config';
import { Item, ItemType } from './Item';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  player: Player;
  dragons: Dragon[] = [];
  items: Item[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  score: number = 0;
  level: number = 1;
  gameOver: boolean = false;
  
  itemSpawnTimer: number = 0;
  
  scoreElement: HTMLElement;
  scoreDisplay: HTMLElement;
  levelDisplay: HTMLElement;
  hpBar: HTMLElement;
  hpText: HTMLElement;
  statusContainer: HTMLElement;
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
    this.statusContainer = document.getElementById('status-container')!;
    // Legacy/Fallback
    this.scoreElement = this.scoreDisplay || document.getElementById('score')!;
    
    this.gameOverElement = document.getElementById('game-over')!;
    this.restartButton = document.getElementById('restart-btn')!;
    
    this.soundManager = new SoundManager();
    this.background = new Background(this.width, this.height);

    this.player = new Player(this);
    this.initDragons(1);
    this.itemSpawnTimer = Math.random() * 600 + 600; // 10-20 seconds (60fps)

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
          // Use random offset instead of regular intervals to avoid symmetry
          dragon.angle = Math.random() * Math.PI * 2;
          
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
      const survivingBlocks = dragon.blocks.filter(b => !b.markedForDeletion && b.value > 0);
      
      if (survivingBlocks.length > 0) {
          let damage = 0;
          survivingBlocks.forEach(block => {
              if (block.isHead) {
                  damage += GameConfig.DAMAGE_FROM_HEAD_COLLISION;
              } else {
                  damage += GameConfig.DAMAGE_FROM_BODY_COLLISION;
              }
          });

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
    
    // Spawn Items
    if (this.itemSpawnTimer <= 0) {
      const type = [ItemType.BOMB, ItemType.SHIELD, ItemType.WEAPON_BOOST][Math.floor(Math.random() * 3)];
      const x = Math.random() * (this.width - 50) + 25;
      this.items.push(new Item(this, x, -50, type));
      this.itemSpawnTimer = Math.random() * (GameConfig.ITEM_SPAWN_INTERVAL_MAX - GameConfig.ITEM_SPAWN_INTERVAL_MIN) + GameConfig.ITEM_SPAWN_INTERVAL_MIN;
    } else {
      this.itemSpawnTimer--;
    }

    // Update Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update();
      if (item.markedForDeletion) {
        this.items.splice(i, 1);
        continue;
      }
      // Check collision with player
      if (
        this.player.x < item.x + item.width &&
        this.player.x + this.player.width > item.x &&
        this.player.y < item.y + item.height &&
        this.player.y + this.player.height > item.y
      ) {
        this.activateItem(item);
        this.items.splice(i, 1);
      }
    }

    // Check Player HP
    if (this.player.hp <= 0 && !this.gameOver) {
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

    // Draw Items
    this.items.forEach(item => {
        item.draw(this.ctx);
    });
    
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

    // Update Status Icons
    if (this.statusContainer) {
        let statusHtml = '';
        
        // Shield
        if (this.player.shieldCount > 0) {
            statusHtml += `
                <div class="status-item" style="border-color: #00FFFF; color: #00FFFF; position: relative;">
                    <div class="status-icon" style="background: rgba(0, 255, 255, 0.2);">🛡️</div>
                    <span>SHIELD</span>
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #00FFFF; color: #000; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        ${this.player.shieldCount}
                    </div>
                </div>
            `;
        }
        
        // Invincible
        if (this.player.invincibleTimer > 0) {
            const seconds = Math.ceil(this.player.invincibleTimer / 60);
            statusHtml += `
                <div class="status-item" style="border-color: #FFD700; color: #FFD700;">
                    <div class="status-icon" style="background: rgba(255, 215, 0, 0.2);">🌟</div>
                    <span>INVINCIBLE ${seconds}s</span>
                </div>
            `;
        }
        
        // Weapon Boost
        if (this.player.weaponBoostTimer > 0) {
            const seconds = Math.ceil(this.player.weaponBoostTimer / 60);
            statusHtml += `
                <div class="status-item" style="border-color: #FF00FF; color: #FF00FF;">
                    <div class="status-icon" style="background: rgba(255, 0, 255, 0.2);">🚀</div>
                    <span>BOOST ${seconds}s</span>
                </div>
            `;
        }

        // Slow Debuff
        if (this.player.slowDebuffTimer > 0) {
            const seconds = Math.ceil(this.player.slowDebuffTimer / 60);
            statusHtml += `
                <div class="status-item" style="border-color: #FFA500; color: #FFA500;">
                    <div class="status-icon" style="background: rgba(255, 165, 0, 0.2);">🐌</div>
                    <span>SLOWED ${seconds}s</span>
                </div>
            `;
        }
        
        this.statusContainer.innerHTML = statusHtml;
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
                                    this.soundManager.playExplosion();
                                    
                                    // Full Heal Reward
                                    this.player.hp = this.player.maxHp;
                                    this.createHealingEffect(this.player.x, this.player.y);
                                    
                                    // Spawn Random Item Reward
                                    this.spawnReward(block.x, block.y);
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
    let maxDamage = 0;
    let hasCollision = false;

    this.dragons.forEach(dragon => {
        dragon.blocks.forEach(block => {
            if (!block.markedForDeletion) {
                 // Simple approximation: Player is roughly a circle of radius width/2
                 if (this.checkCollisionCircle(this.player.x, this.player.y, this.player.width/2, block.x, block.y, block.radius)) {
                     hasCollision = true;
                     let damage = GameConfig.DAMAGE_FROM_BODY_COLLISION;
                     if (block.isHead) {
                         damage = GameConfig.DAMAGE_FROM_HEAD_COLLISION;
                     }
                     if (damage > maxDamage) {
                         maxDamage = damage;
                     }
                 }
            }
        });
    });

    if (hasCollision) {
         // Check Shield first
         if (this.player.shieldCount > 0) {
             this.player.shieldCount--;
             this.player.activateInvincibility(GameConfig.ITEM_DURATION_INVINCIBLE); // 5s invincibility
             this.soundManager.playShieldBreak(); 
             
             // Visual effect
             this.createExplosion(this.player.x, this.player.y, '#00FFFF', 20); 
             return; 
         }

         // If invincible (shield broken), skip collision effects (visual/sound) but apply damage
         if (this.player.invincibleTimer > 0) {
             // Apply damage periodically
             // User requested HP deduction during this phase
             // Deduct damage every 20 frames (approx 3 times/sec)
             if (this.player.invincibleTimer % 20 === 0) {
                 this.player.takeDamage(maxDamage);
             }
             return;
         }

         // Check hit cooldown (iframes)
         if (this.player.hitCooldown > 0) return;

         // Apply Max Damage found in this frame
         this.player.takeDamage(maxDamage);
         this.player.hitCooldown = 30; // 0.5s invulnerability
         this.soundManager.playHit();
         this.createExplosion(this.player.x, this.player.y, 'red', 10);
    }
  }

  spawnReward(x: number, y: number) {
       // Chance to drop item
       if (Math.random() < GameConfig.ITEM_DROP_CHANCE_FROM_HEAD) {
           const type = [ItemType.BOMB, ItemType.SHIELD, ItemType.WEAPON_BOOST][Math.floor(Math.random() * 3)];
           this.items.push(new Item(this, x, y, type));
       }
   }

   activateItem(item: Item) {
     this.soundManager.playPowerUp();
     
     switch (item.type) {
       case ItemType.BOMB:
         this.triggerBombEffect();
         break;
       case ItemType.SHIELD:
         this.player.activateShield();
         break;
       case ItemType.WEAPON_BOOST:
         this.player.activateWeaponBoost();
         break;
     }
   }

   triggerBombEffect() {
     this.soundManager.playBomb();
     
     // Visual Flash
     const flash = document.createElement('div');
     flash.style.position = 'absolute';
     flash.style.top = '0';
     flash.style.left = '0';
     flash.style.width = '100%';
     flash.style.height = '100%';
     flash.style.backgroundColor = 'white';
     flash.style.opacity = '0.8';
     flash.style.pointerEvents = 'none';
     flash.style.transition = 'opacity 0.5s';
     flash.style.zIndex = '1000';
     document.body.appendChild(flash);
     setTimeout(() => {
       flash.style.opacity = '0';
       setTimeout(() => document.body.removeChild(flash), 500);
     }, 50);

     // Damage Dragons
     this.dragons.forEach(dragon => {
       dragon.blocks.forEach(block => {
         // Random 50-70% damage
         const percent = 0.5 + Math.random() * 0.2;
         const damage = Math.floor(block.value * percent);
         block.takeDamage(damage);
         
         if (Math.random() < 0.3) { 
              this.createExplosion(block.x, block.y, '#FF4500', 30);
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
          // Scaled Attack Power
          const powerIncrease = Math.floor(GameConfig.ATTACK_POWER_BASE * Math.pow(GameConfig.ATTACK_POWER_GROWTH_FACTOR, this.level - 1));
          this.player.increasePower(powerIncrease);
          this.soundManager.playBuffAttackPower();
      } else if (buff === 'HEAL') {
          // Scaled Heal
          const healAmount = Math.floor(GameConfig.HEAL_AMOUNT_BASE * Math.pow(GameConfig.HEAL_GROWTH_FACTOR, this.level - 1));
          this.player.heal(healAmount);
          this.soundManager.playPowerUp(); // Reuse sound or new one
          this.createHealingEffect(this.player.x, this.player.y);
      } else if (buff === 'DEBUFF_SLOW') {
          this.player.applySlowDebuff(GameConfig.ITEM_DURATION_SLOW); // 5 seconds (60fps)
          this.soundManager.playHit(); // Negative sound
          this.createExplosion(this.player.x, this.player.y, '#808080', 15);
      } else if (buff === 'CLEAR_SCREEN') {
          // Damage Dragons
          this.dragons.forEach(dragon => {
              dragon.blocks.forEach(block => {
                  // Random 50-70% damage
                  const percent = 0.5 + Math.random() * 0.2;
                  const damage = Math.floor(block.value * percent);
                  block.takeDamage(damage);
                  
                  // Visual explosion for feedback
                  if (Math.random() < 0.3) { 
                       this.createExplosion(block.x, block.y, '#FF4500', 30);
                  }
              });
          });
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

