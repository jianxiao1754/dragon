import { Bullet } from './Bullet';
import { Game } from './Game';
import { GameConfig } from './Config';
import { Assets } from './Assets';

export class Player {
  game: Game;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speed: number;
  hp: number = GameConfig.PLAYER_MAX_HP;
  maxHp: number = GameConfig.PLAYER_MAX_HP;
  bullets: Bullet[] = [];
  fireTimer: number = 0;
  fireInterval: number = GameConfig.PLAYER_BASE_FIRE_INTERVAL;
  damage: number = GameConfig.PLAYER_BASE_DAMAGE;
  doubleShot: boolean = false; // Buff: Adds a second plane/gun
  attackSpeedBuff: number = 1;
  slowDebuffTimer: number = 0;
  
  // Item Effects
  shieldCount: number = 0;
  invincibleTimer: number = 0;
  weaponBoostTimer: number = 0;
  hitCooldown: number = 0; // Cooldown after taking damage (iframes)

  constructor(game: Game) {
    this.game = game;
    this.width = GameConfig.PLAYER_WIDTH;
    this.height = GameConfig.PLAYER_HEIGHT;
    this.x = this.game.width / 2;
    this.y = this.game.height - GameConfig.PLAYER_START_Y_OFFSET;
    this.color = GameConfig.PLAYER_COLOR;
    this.speed = GameConfig.PLAYER_SPEED;
    this.hp = this.maxHp;
  }

  update(_deltaTime: number) {
    // Movement is handled by mouse/touch in Game class, but we can clamp here
    if (this.x < this.width / 2) this.x = this.width / 2;
    if (this.x > this.game.width - this.width / 2) this.x = this.game.width - this.width / 2;
    if (this.y < 0) this.y = this.height / 2;
    if (this.y > this.game.height - this.height / 2) this.y = this.game.height - this.height / 2;

    // Handle Debuffs
    let currentFireInterval = this.fireInterval / this.attackSpeedBuff;
    if (this.slowDebuffTimer > 0) {
        this.slowDebuffTimer--;
        currentFireInterval *= 2; // Fire 2x slower
    }

    // Handle Item Buffs
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.hitCooldown > 0) this.hitCooldown--;
    if (this.weaponBoostTimer > 0) {
      this.weaponBoostTimer--;
      currentFireInterval /= 2; // 2x Fire Rate
    }

    // Auto shoot
    if (this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = currentFireInterval;
    } else {
      this.fireTimer--;
    }
  }

  takeDamage(amount: number) {
      // User requested HP deduction even during invincible state (which is now just collision immunity)
      // if (this.invincibleTimer > 0) return; 

      if (this.shieldCount > 0) {
        this.shieldCount--;
        this.activateInvincibility(GameConfig.ITEM_DURATION_INVINCIBLE); // 5 seconds invincibility after shield break
        this.game.soundManager.playShieldBreak(); 
        return;
      }

      this.hp -= amount;
      if (this.hp <= 0) {
          this.hp = 0;
      }
  }

  activateShield() {
    this.shieldCount++;
  }

  activateWeaponBoost() {
    this.weaponBoostTimer = GameConfig.ITEM_DURATION_WEAPON_BOOST; // 10 seconds at 60fps
  }

  activateInvincibility(frames: number) {
    this.invincibleTimer = frames;
  }

  heal(amount: number) {
      this.hp += amount;
      if (this.hp > this.maxHp) this.hp = this.maxHp;
  }

  applySlowDebuff(frames: number) {
      this.slowDebuffTimer = frames;
  }


  shoot() {
    this.game.soundManager.playShoot();
    
    // Weapon Boost: Spread Shot
    if (this.weaponBoostTimer > 0) {
       const boostDamage = this.damage * 2;
       // Center
       this.game.bullets.push(new Bullet(this.x, this.y - 20, boostDamage));
       // Left Spread
       const leftBullet = new Bullet(this.x - 10, this.y - 20, boostDamage);
       leftBullet.vx = -2; // Wider spread (was -1)
       this.game.bullets.push(leftBullet);
       // Right Spread
       const rightBullet = new Bullet(this.x + 10, this.y - 20, boostDamage);
       rightBullet.vx = 2; // Wider spread (was 1)
       this.game.bullets.push(rightBullet);
       
       if (this.doubleShot) {
         this.game.bullets.push(new Bullet(this.x - 20, this.y - 20, boostDamage));
         this.game.bullets.push(new Bullet(this.x + 20, this.y - 20, boostDamage));
       }
       return;
    }

    if (this.doubleShot) {
        this.game.bullets.push(new Bullet(this.x - 10, this.y - 20, this.damage));
        this.game.bullets.push(new Bullet(this.x + 10, this.y - 20, this.damage));
    } else {
        this.game.bullets.push(new Bullet(this.x, this.y - 20, this.damage));
    }
  }

  addPlane() {
    this.doubleShot = true;
  }

  increaseAttackSpeed() {
    this.attackSpeedBuff *= 1.2; // Increase speed by 20%
  }

  increasePower(amount: number = 2) {
    this.damage += amount; 
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Shield Visual
    if (this.shieldCount > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2 + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2 + (this.shieldCount - 1); // Thicker for more shields
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.fill();
    }

    // Invincible/Hit Visual (Blinking)
    if (this.invincibleTimer > 0 || this.hitCooldown > 0) {
       // Blink every 10 frames
       const timer = this.invincibleTimer > 0 ? this.invincibleTimer : this.hitCooldown;
       if (Math.floor(timer / 10) % 2 === 0) {
         ctx.globalAlpha = 0.5;
       }
    }

    if (this.invincibleTimer > 0) {
       // Golden glow
       ctx.shadowBlur = 20;
       ctx.shadowColor = '#FFD700';
    }

    // Debuff Visuals - Purple Fog
    if (this.slowDebuffTimer > 0) {
        // Draw purple fog/mist
        const time = Date.now() / 200;
        
        // Create 3 layers of fog puffs
        for(let i=0; i<3; i++) {
             ctx.save();
             // Orbiting movement
             const angle = time + i * (Math.PI * 2 / 3);
             const dist = 15 + Math.sin(time * 2 + i) * 5;
             const px = Math.cos(angle) * dist;
             const py = Math.sin(angle) * dist;
             
             ctx.translate(px, py);
             
             const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
             gradient.addColorStop(0, 'rgba(138, 43, 226, 0.6)'); // BlueViolet
             gradient.addColorStop(1, 'rgba(75, 0, 130, 0)'); // Indigo transparent
             
             ctx.fillStyle = gradient;
             ctx.beginPath();
             ctx.arc(0, 0, 20, 0, Math.PI * 2);
             ctx.fill();
             
             ctx.restore();
        }
    }

    // Draw Plane Image
    try {
        ctx.drawImage(Assets.PlayerPlane, -this.width / 2, -this.height / 2, this.width, this.height);
    } catch (e) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.fill();
    }
    
    // If double shot, draw "wingmen" visual or just indicate it
    if (this.doubleShot) {
        // Draw small planes on side
        ctx.globalAlpha = 0.5;
        ctx.drawImage(Assets.PlayerPlane, -this.width - 10, 0, this.width/2, this.height/2);
        ctx.drawImage(Assets.PlayerPlane, this.width/2 + 10, 0, this.width/2, this.height/2);
        ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
  }
}
