export class LifeSystem {
  constructor(players) {
    // players: array of {name, lives, score, isSeeker, ...}
    this.players = players;
  }

  // Called when a hider is hit by a bullet
  // Returns the player if they have 0 lives (triggers role swap)
  hitHider(hider) {
    if (hider.lives <= 0 || hider.isSeeker) return null;
    hider.lives--;
    if (hider.lives <= 0) {
      hider.setEliminated(true);
      return hider; // signal role swap needed
    }
    return null;
  }

  // Call at start of each hiding phase: revive eliminated hiders
  reviveAll() {
    for (const p of this.players) {
      if (!p.isSeeker && p.isEliminated) {
        p.setEliminated(false);
      }
    }
  }

  // Swap roles: depleted hider becomes seeker, current seeker becomes hider
  swapRoles(depletedHider, currentSeeker) {
    currentSeeker.setSeeker(false);
    currentSeeker.lives = 3;
    currentSeeker.setEliminated(false);

    depletedHider.setSeeker(true);
    depletedHider.setEliminated(false);
    // lives already at 0, keep at 0 until they become hider again
  }

  // Award score to all active hiders each second
  tickScore() {
    for (const p of this.players) {
      if (!p.isSeeker && !p.isEliminated) {
        p.score++;
      }
    }
  }

  getRankings() {
    return [...this.players].sort((a, b) => b.score - a.score);
  }
}
