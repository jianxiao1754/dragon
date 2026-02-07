I have identified the issue. When multiple dragons are present, the current logic in `Dragon.ts` relies on checking `headDead` flag which is set in `update()` but the `Game.ts` logic might be inadvertently treating the level completion based on *any* head dying or checking the array incorrectly.

However, the specific issue described ("when I kill one dragon's head to 0, the dragon does not die") is likely due to how `Dragon.ts` handles the head block deletion.

**Current Logic in `Dragon.ts`:**
```typescript
    // Filter out destroyed blocks
    // IMPORTANT: If Head (index 0) is marked for deletion, it means Level Complete
    const head = this.blocks.find(b => b.isHead);
    if (head && head.markedForDeletion) {
        this.headDead = true;
        return; // Game loop will handle level transition
    }
```

**The Problem:**
When a head block's HP reaches 0, it sets `markedForDeletion = true`.
The `Dragon.ts` `update()` loop sees this, sets `this.headDead = true`, and then **returns immediately**.
It stops drawing the dragon.

However, `Game.ts` handles dragons like this:
```typescript
    // Update and Draw Dragons
    // Iterate backwards for safe removal
    for (let i = this.dragons.length - 1; i >= 0; i--) {
        const dragon = this.dragons[i];
        dragon.update();
        dragon.draw(this.ctx);
        
        // ...
    }
```

If `headDead` is true, `dragon.update()` returns early. `dragon.draw()` might still try to draw blocks, but `update` didn't filter them.

Actually, the issue is more likely that `Game.ts` **does not remove the dragon from the `dragons` array** when `headDead` is true. It only removes dragons in `handleDragonEscape` (when they go off screen).

**The Fix:**
I need to update `Game.ts` to check if a dragon is "dead" (head destroyed) and remove it from the array (and trigger any rewards/effects), effectively "killing" that specific dragon instance while leaving others active.

**Plan:**
1.  Modify `Game.ts` inside the `animate` loop where it iterates over dragons.
2.  Add a check: `if (dragon.headDead)`.
3.  If true:
    *   Trigger "Dragon Defeated" logic (absorb buffs, score, explosion) *for that specific dragon*.
    *   Remove that dragon from the `this.dragons` array.
    *   **Do not** trigger `levelUp()` immediately unless `this.dragons.length === 0`.

**Wait, `levelUp` is currently called if ANY dragon head dies?**
```typescript
    // Check Level Up
    if (this.dragons.length === 0) {
        this.levelUp();
    } else if (this.dragons.every(d => d.headDead)) { // This checks if ALL are dead
        this.levelUp();
    }
```
The logic `this.dragons.every` is correct for "all must be dead", but we want to remove them one by one.

**Revised Plan:**
1.  In `Game.ts`, inside the loop iterating `dragons`:
    *   Check `if (dragon.headDead)`.
    *   If so, execute "Dragon Death" logic:
        *   Add score.
        *   Create explosion.
        *   Absorb buffs from *this* dragon's body.
        *   Remove dragon from `this.dragons`.
2.  Remove the separate `this.dragons.every(...)` check since the loop will empty the array naturally.
3.  The existing `if (this.dragons.length === 0) { this.levelUp(); }` check will then naturally handle the level transition when the last dragon is killed.

This ensures each dragon is independent. Killing one removes it, allowing you to focus on the others.