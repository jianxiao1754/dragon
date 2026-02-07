import { Game } from './Game';
import { GameConfig } from './Config';
import { Assets } from './Assets';

export type BuffType = 'NONE' | 'ADD_PLANE' | 'ATTACK_SPEED' | 'ATTACK_POWER' | 'HEAL' | 'DEBUFF_SLOW';

export class Block {
  game: Game;
  x: number;
  y: number;
  radius: number; // Using radius for collision, but drawing as hexagon or circle
  value: number;
  maxHealth: number;
  buff: BuffType;
  color: string;
  isHead: boolean;
  markedForDeletion: boolean = false;

  constructor(game: Game, x: number, y: number, value: number, buff: BuffType = 'NONE', isHead: boolean = false) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.value = value;
    this.maxHealth = value;
    this.buff = buff;
    this.isHead = isHead;
    this.radius = isHead ? GameConfig.BLOCK_RADIUS_HEAD : GameConfig.BLOCK_RADIUS_BODY;
    this.color = this.getColor();
  }

  getColor() {
    if (this.isHead) return '#ff3333'; // Red for head
    if (this.buff === 'ADD_PLANE') return '#00ff00';
    if (this.buff === 'ATTACK_SPEED') return '#00ffff';
    if (this.buff === 'ATTACK_POWER') return '#ff0000';
    if (this.buff === 'HEAL') return '#ff69b4'; // Pink for Heal
    if (this.buff === 'DEBUFF_SLOW') return '#808080'; // Grey for Slow Debuff
    return '#ffffff';
  }

  update(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  takeDamage(amount: number): boolean {
    this.value -= amount;
    if (this.value <= 0) {
      this.markedForDeletion = true;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isHead) {
        // Draw Head Image
        ctx.save();
        ctx.translate(this.x, this.y);
        // Draw slightly larger than hit radius for visual effect
        const size = this.radius * 2.5; 
        try {
            ctx.drawImage(Assets.DragonHead, -size/2, -size/2, size, size);
        } catch(e) {
            // fallback
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
        ctx.restore();
    } else {
        // Body Blocks
        ctx.beginPath();
        // Hexagon look
        const sides = 6;
        const size = this.radius;
        ctx.moveTo(this.x + size * Math.cos(0), this.y + size * Math.sin(0));
        for (let i = 1; i <= sides; i += 1) {
          ctx.lineTo(this.x + size * Math.cos(i * 2 * Math.PI / sides), this.y + size * Math.sin(i * 2 * Math.PI / sides));
        }
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill slightly transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        ctx.closePath();
    }

    // Draw value text
    ctx.fillStyle = '#fff';
    ctx.font = this.isHead ? 'bold 20px Arial' : '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow for better visibility
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;

    if (this.buff !== 'NONE' && !this.isHead) {
        // Draw Icon or symbol
        let symbol = '';
        if (this.buff === 'ADD_PLANE') symbol = '+✈';
        if (this.buff === 'ATTACK_SPEED') symbol = '⚡';
        if (this.buff === 'ATTACK_POWER') symbol = '💪';
        ctx.fillText(symbol, this.x, this.y);
    } else {
        ctx.fillText(this.value.toString(), this.x, this.y);
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }
}
