import { Block, type BuffType } from './Block';
import { Game } from './Game';
import { GameConfig } from './Config';

export class Dragon {
  game: Game;
  blocks: Block[] = [];
  path: { x: number, y: number }[] = [];
  speed: number = GameConfig.DRAGON_START_SPEED;
  angle: number = 0;
  segmentSpacing: number = GameConfig.DRAGON_SEGMENT_SPACING;
  level: number = 1;
  headDead: boolean = false;
  
  constructor(game: Game) {
    this.game = game;
    this.init(1);
  }

  init(level: number) {
    this.level = level;
    this.blocks = [];
    this.path = [];
    this.headDead = false;
    this.speed = GameConfig.DRAGON_START_SPEED + (level * GameConfig.DRAGON_SPEED_INC_PER_LEVEL);
    
    // Initialize head position above screen
    let startX = this.game.width / 2;
    let startY = -100;
    
    // Create Head
    const headHp = GameConfig.HEAD_HP_BASE + (level * GameConfig.HEAD_HP_PER_LEVEL);
    this.blocks.push(new Block(this.game, startX, startY, headHp, 'NONE', true));

    // Create body segments
    const length = GameConfig.DRAGON_BASE_LENGTH + level * GameConfig.DRAGON_LENGTH_INC_PER_LEVEL;
    for (let i = 1; i < length; i++) {
        // Determine if this block has a buff
        let buff: BuffType = 'NONE';
        if (i % GameConfig.BUFF_FREQUENCY === 0) {
            const rand = Math.random();
            if (rand < GameConfig.BUFF_CHANCE_ADD_PLANE) buff = 'ADD_PLANE';
            else if (rand < GameConfig.BUFF_CHANCE_ATTACK_SPEED) buff = 'ATTACK_SPEED';
            else buff = 'ATTACK_POWER';
        }

        const hp = Math.floor(Math.random() * 20) + GameConfig.BLOCK_HP_MIN + (level * GameConfig.BLOCK_HP_PER_LEVEL);
        this.blocks.push(new Block(this.game, startX, startY - (i * this.segmentSpacing), hp, buff, false));
    }

    // Pre-fill path
    for (let i = 0; i < length * this.segmentSpacing + 300; i++) {
        this.path.push({x: startX, y: startY - i});
    }
  }

  update() {
    if (this.headDead) return;

    // Move Head Logic
    this.angle += GameConfig.DRAGON_OSCILLATION_SPEED + (this.level * GameConfig.DRAGON_OSCILLATION_INC_PER_LEVEL);
    const headX = (this.game.width / 2) + Math.sin(this.angle) * (this.game.width / 3);
    const headY = this.path[0].y + this.speed;

    // Add new head position to path history
    this.path.unshift({ x: headX, y: headY });

    // Clean up very old path points
    if (this.path.length > this.blocks.length * this.segmentSpacing * 5) {
        this.path.pop();
    }

    // Filter out destroyed blocks
    // IMPORTANT: If Head (index 0) is marked for deletion, it means Level Complete
    const head = this.blocks.find(b => b.isHead);
    if (head && head.markedForDeletion) {
        this.headDead = true;
        return; // Game loop will handle level transition
    }

    this.blocks = this.blocks.filter(b => !b.markedForDeletion);
    
    // If only head remains? Or if all body destroyed?
    // Current logic: Just keep going.
    
    if (this.blocks.length === 0) {
        // Should not happen if head logic works, but just in case
        this.headDead = true;
    }

    // Update positions based on Cumulative Distance
    let currentPathIndex = 0;
    
    this.blocks.forEach((block, index) => {
        if (index === 0) {
            // Head is at path[0]
            block.update(this.path[0].x, this.path[0].y);
        } else {
            let distFound = 0;
            // Walk back along path until we cover 'segmentSpacing' distance
            while (currentPathIndex < this.path.length - 1 && distFound < this.segmentSpacing) {
                const p1 = this.path[currentPathIndex];
                const p2 = this.path[currentPathIndex + 1];
                const d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                distFound += d;
                currentPathIndex++;
            }
            
            if (currentPathIndex < this.path.length) {
                block.update(this.path[currentPathIndex].x, this.path[currentPathIndex].y);
            }
        }
    });

    // Check if head reaches bottom
    // Find head block
    const currentHead = this.blocks.find(b => b.isHead);
    if (currentHead) {
        if (currentHead.y > this.game.height) {
            this.game.triggerGameOver();
        }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.blocks.forEach(block => block.draw(ctx));
  }
}
