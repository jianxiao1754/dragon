import { Game } from './Game';
export const ItemType = {
  BOMB: 'BOMB',
  SHIELD: 'SHIELD',
  WEAPON_BOOST: 'WEAPON_BOOST'
} as const;

export type ItemType = typeof ItemType[keyof typeof ItemType];

export class Item {
  game: Game;
  x: number;
  y: number;
  width: number = 40;
  height: number = 40;
  type: ItemType;
  speed: number = 3;
  markedForDeletion: boolean = false;

  constructor(game: Game, x: number, y: number, type: ItemType) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.type = type;
  }

  update() {
    this.y += this.speed;
    if (this.y > this.game.height) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow effect
    ctx.shadowBlur = 15;
    
    switch (this.type) {
      case ItemType.BOMB:
        ctx.shadowColor = '#FF4500';
        // Bomb Body
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Fuse
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.quadraticCurveTo(5, -25, 10, -20);
        ctx.strokeStyle = '#CCC';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Spark
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(10, -20, 3, 0, Math.PI * 2);
        ctx.fill();
        // Skull/Warning symbol
        ctx.fillStyle = '#FF4500';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 2);
        break;

      case ItemType.SHIELD:
        ctx.shadowColor = '#00FFFF';
        // Shield Shape
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-15, -5);
        ctx.lineTo(-15, -15);
        ctx.lineTo(15, -15);
        ctx.lineTo(15, -5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Inner Cross
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 5);
        ctx.moveTo(-8, -2);
        ctx.lineTo(8, -2);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case ItemType.WEAPON_BOOST:
        ctx.shadowColor = '#FF00FF';
        // Bullet Icon
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(-5, -5);
        ctx.quadraticCurveTo(0, -15, 5, -5);
        ctx.lineTo(5, 10);
        ctx.closePath();
        ctx.fillStyle = '#FF00FF';
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Spread lines
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-15, -10);
        ctx.moveTo(10, 0);
        ctx.lineTo(15, -10);
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
    }

    ctx.restore();
  }
}
