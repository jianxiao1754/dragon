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
  centerX: number;
  currentHeadX: number; // For smooth interpolation
  
  constructor(game: Game) {
    this.game = game;
    this.centerX = game.width / 2;
    this.currentHeadX = this.centerX;
    this.init(1);
  }

  init(level: number) {
    this.level = level;
    this.blocks = [];
    this.path = [];
    this.headDead = false;
    this.speed = GameConfig.DRAGON_START_SPEED + (level * GameConfig.DRAGON_SPEED_INC_PER_LEVEL);
    if (this.speed > GameConfig.DRAGON_MAX_SPEED) {
        this.speed = GameConfig.DRAGON_MAX_SPEED;
    }
    
    // Initialize head position above screen
    let startX = this.centerX;
    let startY = -100;
    this.currentHeadX = startX;
    
    // Create Head
    // Exponential HP: Base * Factor^(Level-1)
    const headHp = Math.floor(GameConfig.HEAD_HP_BASE * Math.pow(GameConfig.HEAD_HP_GROWTH_FACTOR, level - 1));
    this.blocks.push(new Block(this.game, startX, startY, headHp, 'NONE', true));

    // Calculate Length and HP scaling
    let length = GameConfig.DRAGON_BASE_LENGTH + level * GameConfig.DRAGON_LENGTH_INC_PER_LEVEL;
    let hpMultiplier = 1;
    
    if (length > GameConfig.DRAGON_MAX_LENGTH) {
        // Cap length, but increase HP for every level that would have added length
        // Rough approximation: excess length contributes to HP
        const excessLength = length - GameConfig.DRAGON_MAX_LENGTH;
        length = GameConfig.DRAGON_MAX_LENGTH;
        
        // Every "missed" segment adds roughly 5% HP to remaining segments to compensate
        hpMultiplier = 1 + (excessLength * 0.05);
    }

    // Create body segments
    for (let i = 1; i < length; i++) {
        // Determine if this block has a buff
        let buff: BuffType = 'NONE';
        if (i % GameConfig.BUFF_FREQUENCY === 0) {
            const rand = Math.random();
            if (rand < GameConfig.BUFF_CHANCE_ADD_PLANE) buff = 'ADD_PLANE';
            else if (rand < GameConfig.BUFF_CHANCE_ATTACK_SPEED) buff = 'ATTACK_SPEED';
            else if (rand < GameConfig.BUFF_CHANCE_HEAL) buff = 'HEAL';
            else if (rand < GameConfig.BUFF_CHANCE_DEBUFF_SLOW) buff = 'DEBUFF_SLOW';
            else buff = 'ATTACK_POWER';
        }

        let hp = Math.floor(Math.random() * 20) + GameConfig.BLOCK_HP_MIN;
        // Exponential growth for body blocks too
        hp = Math.floor(hp * Math.pow(GameConfig.BLOCK_HP_GROWTH_FACTOR, level - 1));
        
        hp = Math.floor(hp * hpMultiplier); // Apply multiplier for capped length
        
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
    let oscSpeed = GameConfig.DRAGON_OSCILLATION_SPEED + (this.level * GameConfig.DRAGON_OSCILLATION_INC_PER_LEVEL);
    if (oscSpeed > GameConfig.DRAGON_MAX_OSCILLATION_SPEED) {
        oscSpeed = GameConfig.DRAGON_MAX_OSCILLATION_SPEED;
    }
    this.angle += oscSpeed;
    
    // Irregular Movement Logic to prevent camping
    // Combine two sine waves with different frequencies
    const wave1 = Math.sin(this.angle) * (this.game.width / 3);
    const wave2 = Math.sin(this.angle * 2.3) * (this.game.width / 10); // Secondary wave
    
    // Add a slow drift to the center point if single dragon, or just rely on the complex wave
    // For now, complex wave is usually enough.
    
    const targetHeadX = this.centerX + wave1 + wave2;
    
    // Smooth movement / Limit lateral speed
    // Max lateral movement per frame (e.g., 5 pixels)
    let maxLateralSpeed = 3 + (this.level * 0.1);
    if (maxLateralSpeed > 10) maxLateralSpeed = 10;
    
    const dx = targetHeadX - this.currentHeadX;
    
    if (Math.abs(dx) > maxLateralSpeed) {
        this.currentHeadX += Math.sign(dx) * maxLateralSpeed;
    } else {
        this.currentHeadX = targetHeadX;
    }

    const clampedHeadX = Math.max(50, Math.min(this.game.width - 50, this.currentHeadX));

    const headY = this.path[0].y + this.speed;

    // Add new head position to path history
    this.path.unshift({ x: clampedHeadX, y: headY });

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
    /* 
    Legacy logic removed:
    const currentHead = this.blocks.find(b => b.isHead);
    if (currentHead) {
        if (currentHead.y > this.game.height) {
            this.game.triggerGameOver();
        }
    }
    This is now handled in Game.ts handleDragonEscape() which correctly deducts HP
    instead of instant Game Over.
    */
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.blocks.forEach(block => block.draw(ctx));
  }
}
