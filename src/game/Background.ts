import { GameConfig } from './Config';

export type WeatherType = 'SUNNY' | 'SANDSTORM';

export class Background {
  width: number;
  height: number;
  scrollOffset: number = 0;
  
  weather: WeatherType = 'SANDSTORM';
  weatherTimer: number = 0;
  weatherDuration: number = 2000; // frames

  // Desert Elements
  elements: { type: 'CACTUS' | 'STONE' | 'RIVER' | 'OASIS' | 'VILLAGE', x: number, y: number, scale: number, width?: number, height?: number, points?: {x:number, y:number}[] }[] = [];

  // Sandstorm particles
  sandParticles: { x: number, y: number, speed: number, size: number }[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initElements();
    this.initSandstorm();
  }

  initElements() {
    // Generate some initial procedural elements
    // River: A winding path
    this.generateRiver();
    
    // Scatter some cacti and stones
    for (let i = 0; i < 20; i++) {
        this.addRandomElement(Math.random() * this.height * 2); // Spread over 2 screens worth
    }
  }
  
  generateRiver() {
      // Create a river path
      const riverPoints: {x:number, y:number}[] = [];
      let x = this.width * 0.5; // Start middle
      for(let y = -this.height; y < this.height * 2; y += 30) {
          x += Math.sin(y * 0.005) * 10 + (Math.random() - 0.5) * 5;
          riverPoints.push({x, y});
      }
      this.elements.push({ type: 'RIVER', x: 0, y: 0, scale: 1, points: riverPoints });
  }

  addRandomElement(yBase: number) {
      // Logic: 
      // 1. Check if near river.
      // 2. If near river, chance for OASIS.
      // 3. VILLAGE can be anywhere but prefer not ON river.
      
      const typeRoll = Math.random();
      let type: 'CACTUS' | 'STONE' | 'OASIS' | 'VILLAGE' = 'CACTUS';
      
      if (typeRoll < 0.5) type = 'CACTUS';
      else if (typeRoll < 0.8) type = 'STONE';
      else if (typeRoll < 0.9) type = 'VILLAGE';
      else type = 'OASIS';

      const x = Math.random() * this.width;
      const y = yBase - Math.random() * this.height; 
      const scale = 0.5 + Math.random() * 1.0;

      // Check river collision
      const river = this.elements.find(e => e.type === 'RIVER');
      let nearRiver = false;
      let onRiver = false;
      
      if (river && river.points) {
          // Find closest river point
          const closest = river.points.reduce((prev, curr) => {
              const dPrev = Math.abs(prev.y - y);
              const dCurr = Math.abs(curr.y - y);
              return dPrev < dCurr ? prev : curr;
          });
          
          const dist = Math.abs(closest.x - x);
          if (dist < 60) onRiver = true;
          if (dist < 150) nearRiver = true;
      }

      // Rules
      if (type === 'STONE' && onRiver) {
           // Stones in river are ok
      } else if (onRiver) {
          // Force move away or cancel
          return; // Skip placement
      }
      
      // Oasis logic: Only near river? Or just rare?
      // User asked for "Oasis", let's make them standalone or near river
      if (type === 'OASIS' && !nearRiver && Math.random() > 0.2) {
          // 80% chance Oasis must be near river
          return; 
      }

      this.elements.push({ type, x, y, scale });
  }

  initSandstorm() {
      for(let i=0; i<100; i++) {
          this.sandParticles.push({
              x: Math.random() * this.width,
              y: Math.random() * this.height,
              speed: 10 + Math.random() * 20,
              size: 1 + Math.random() * 3
          });
      }
  }

  update() {
    // Scroll background
    this.scrollOffset += GameConfig.SCROLL_SPEED;
    
    // Weather Cycle
    this.weatherTimer++;
    if (this.weatherTimer > this.weatherDuration) {
        this.weatherTimer = 0;
        // Decide next weather
        if (this.weather === 'SUNNY') {
            if (Math.random() < GameConfig.SANDSTORM_CHANCE) {
                this.weather = 'SANDSTORM';
                this.weatherDuration = 600 + Math.random() * 600; // 10-20s storm
            } else {
                this.weatherDuration = 1200 + Math.random() * 1200; // 20-40s sunny
            }
        } else {
            this.weather = 'SUNNY';
            this.weatherDuration = 1200;
        }
    }

    // Update Elements (infinite scroll illusion)
    // We don't actually move elements, we just draw them with offset.
    // However, to keep memory low, we could recycle.
    // For simplicity, let's just loop the scrollOffset modulo some large value? 
    // Actually, let's move elements and recycle.
    
    this.elements.forEach(el => {
        el.y += GameConfig.SCROLL_SPEED;
        if (el.type === 'RIVER' && el.points) {
             el.points.forEach(p => p.y += GameConfig.SCROLL_SPEED);
             // Recycle River points? 
             // Simplification: Just regenerate river if it goes too far? 
             // Or better: Let's simpler approach. Just move scrollOffset and draw relative.
        }
    });
    
    // Recycle elements that went off screen (bottom)
    this.elements.forEach(el => {
        if (el.type !== 'RIVER' && el.y > this.height) {
            el.y = -100; // Reset to top
            el.x = Math.random() * this.width;
        }
    });

    // Handle River Infinite Scroll manually
    const river = this.elements.find(e => e.type === 'RIVER');
    if (river && river.points) {
        // Remove points below screen
        river.points = river.points.filter(p => p.y < this.height + 100);
        // Add points at top
        const topPoint = river.points[0];
        if (topPoint && topPoint.y > -100) {
            let newY = topPoint.y;
            let newX = topPoint.x;
            while(newY > -this.height) { // Buffer above
                newY -= 50;
                newX += Math.sin(newY * 0.01) * 20 + (Math.random() - 0.5) * 10;
                river.points.unshift({x: newX, y: newY});
            }
        }
    }

    // Update Sandstorm
    if (this.weather === 'SANDSTORM') {
        this.sandParticles.forEach(p => {
            p.x += p.speed;
            p.y += p.speed * 0.5; // Diagonal movement
            if (p.x > this.width) p.x = 0;
            if (p.y > this.height) p.y = 0;
        });
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // 1. Base Sand Color
    ctx.fillStyle = '#e6c288'; // Desert sand color
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 2. Draw Elements
    this.elements.forEach(el => {
        if (el.type === 'RIVER' && el.points) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for(let i=1; i<el.points.length; i++) {
                // Smooth curve? Line is fine for now
                ctx.lineTo(el.points[i].x, el.points[i].y);
            }
            ctx.lineWidth = 40;
            ctx.strokeStyle = '#4da6ff'; // Water blue
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            // River border
            ctx.lineWidth = 45;
            ctx.strokeStyle = '#c2a676'; // Wet sand
            ctx.globalCompositeOperation = 'destination-over'; // Draw behind water
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        } else if (el.type === 'CACTUS') {
            this.drawCactus(ctx, el.x, el.y, el.scale);
        } else if (el.type === 'STONE') {
            this.drawStone(ctx, el.x, el.y, el.scale);
        } else if (el.type === 'OASIS') {
            this.drawOasis(ctx, el.x, el.y, el.scale);
        } else if (el.type === 'VILLAGE') {
            this.drawVillage(ctx, el.x, el.y, el.scale);
        }
    });

    // 3. Weather Overlay
    if (this.weather === 'SANDSTORM') {
        // Overlay
        ctx.fillStyle = 'rgba(194, 166, 118, 0.4)'; // Sandy haze
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Particles
        ctx.fillStyle = '#dcb376';
        this.sandParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Wind lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<20; i++) {
             const lx = Math.random() * this.width;
             const ly = Math.random() * this.height;
             ctx.moveTo(lx, ly);
             ctx.lineTo(lx + 50, ly + 20);
        }
        ctx.stroke();
    }
  }

  drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#2d5a27'; // Cactus green
      
      // Main stem
      ctx.beginPath();
      ctx.roundRect(-10, -40, 20, 40, 10);
      ctx.fill();
      
      // Arms
      ctx.beginPath();
      ctx.roundRect(-25, -25, 15, 10, 5); // Left arm base
      ctx.roundRect(-25, -35, 10, 20, 5); // Left arm up
      ctx.fill();
      
      ctx.beginPath();
      ctx.roundRect(10, -20, 15, 10, 5); // Right arm base
      ctx.roundRect(15, -30, 10, 20, 5); // Right arm up
      ctx.fill();
      
      ctx.restore();
  }

  drawStone(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#606060'; // Shadow/Texture
      ctx.beginPath();
      ctx.arc(-5, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  }

  drawOasis(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale * 1.5, scale * 1.5);
      
      // Water
      ctx.fillStyle = '#4da6ff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Palm Trees
      this.drawPalmTree(ctx, -20, -10);
      this.drawPalmTree(ctx, 20, -5);
      this.drawPalmTree(ctx, 0, -15);
      
      ctx.restore();
  }

  drawPalmTree(ctx: CanvasRenderingContext2D, dx: number, dy: number) {
      ctx.save();
      ctx.translate(dx, dy);
      // Trunk
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(5, -10, 0, -25);
      ctx.stroke();
      
      // Leaves
      ctx.fillStyle = '#228b22';
      for(let i=0; i<5; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -25, 10, 3, (i * 72) * Math.PI / 180, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();
  }

  drawVillage(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      
      // Cluster of houses
      this.drawHouse(ctx, 0, 0);
      this.drawHouse(ctx, 30, 10);
      this.drawHouse(ctx, -25, 15);
      
      ctx.restore();
  }

  drawHouse(ctx: CanvasRenderingContext2D, dx: number, dy: number) {
      ctx.save();
      ctx.translate(dx, dy);
      
      // Base
      ctx.fillStyle = '#d2b48c'; // Tan/Mud brick
      ctx.fillRect(-10, -10, 20, 20);
      
      // Door
      ctx.fillStyle = '#4a3c31';
      ctx.fillRect(-3, 0, 6, 10);
      
      // Roof (Flat or slight dome for desert)
      ctx.fillStyle = '#c2a676';
      ctx.beginPath();
      ctx.rect(-12, -14, 24, 4);
      ctx.fill();
      
      ctx.restore();
  }
}
