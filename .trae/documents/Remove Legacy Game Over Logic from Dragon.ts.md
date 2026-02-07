I have identified the cause of the issue.

**The Problem:**
The `Dragon.ts` file still contains "legacy" logic that instantly triggers **GAME OVER** as soon as the dragon's head touches the bottom of the screen (`y > game.height`). This happens *before* the new logic in `Game.ts` (which triggers at `height + 50`) has a chance to run.

This explains why:
1.  The game ends instantly.
2.  The player still has full HP (because the damage calculation code never runs).
3.  The dragon is still visible at the bottom.

**The Fix:**
I will remove the following code block from `src/game/Dragon.ts`:

```typescript
    // Check if head reaches bottom
    // Find head block
    const currentHead = this.blocks.find(b => b.isHead);
    if (currentHead) {
        if (currentHead.y > this.game.height) {
            this.game.triggerGameOver();
        }
    }
```

By removing this, the game will defer to the main `Game.ts` loop, which correctly:
1.  Waits for the dragon to go slightly off-screen.
2.  Calculates damage based on remaining blocks.
3.  Only ends the game if the player's HP actually drops to 0.