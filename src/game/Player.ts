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

    // Auto shoot
    if (this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = currentFireInterval;
    } else {
      this.fireTimer--;
    }
  }

  takeDamage(amount: number) {
      this.hp -= amount;
      if (this.hp <= 0) {
          this.hp = 0;
      }
      // TODO: Play damage sound?
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

  increasePower() {
    this.damage += 2; // Increase damage by 2
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Draw Plane Image
    // Ensure image is loaded? HTMLImageElement handles it usually, but if not loaded yet it draws nothing.
    // SVG Data URI loads instantly usually.
    try {
        ctx.drawImage(Assets.PlayerPlane, -this.width / 2, -this.height / 2, this.width, this.height);
    } catch (e) {
        // Fallback if image fails (unlikely)
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
    
    // Draw Debuff Visuals
    if (this.slowDebuffTimer > 0) {
        // Draw snail icon or blue/grey overlay
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2 + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.fill();
        
        // Text
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("SLOW", 0, -this.height/2 - 10);
    }
    
    ctx.restore();
  }
}
