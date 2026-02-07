import { GameConfig } from './Config';
import { Block } from './Block';

export class Bullet {
  x: number;
  y: number;
  radius: number;
  speed: number;
  damage: number;
  color: string;
  markedForDeletion: boolean = false;
  penetration: number = GameConfig.BULLET_PENETRATION;
  hitBlocks: Set<Block> = new Set(); // Keep track of blocks hit to avoid multi-hit on same frame/block

  constructor(x: number, y: number, damage: number = 1) {
    this.x = x;
    this.y = y;
    this.radius = GameConfig.BULLET_RADIUS;
    this.speed = GameConfig.BULLET_SPEED;
    this.damage = damage;
    this.color = GameConfig.BULLET_COLOR;
  }

  update() {
    this.y -= this.speed;
    if (this.y < 0) {
      this.markedForDeletion = true;
    }
  }

  onHit(block: Block) {
      if (this.hitBlocks.has(block)) return false; // Already hit this block
      
      this.hitBlocks.add(block);
      
      if (this.penetration > 0) {
          this.penetration--;
          this.damage *= GameConfig.BULLET_DAMAGE_DECAY; // Reduce damage for next hit
          // Ensure damage doesn't drop to 0 effectively
          if (this.damage < 0.1) this.damage = 0.1;
          return true; // Bullet survives
      } else {
          this.markedForDeletion = true;
          return false; // Bullet dies
      }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw trail/glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    // Capsule shape
    ctx.beginPath();
    ctx.moveTo(this.x - this.radius, this.y);
    ctx.arc(this.x, this.y, this.radius, Math.PI, 0); // Top arc
    ctx.lineTo(this.x + this.radius, this.y + this.radius * 3);
    ctx.arc(this.x, this.y + this.radius * 3, this.radius, 0, Math.PI); // Bottom arc
    ctx.lineTo(this.x - this.radius, this.y);
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.radius * 4);
    gradient.addColorStop(0, '#fff'); // White tip
    gradient.addColorStop(0.3, this.color); // Core color
    gradient.addColorStop(1, 'transparent'); // Fade tail
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.restore();
  }
}
