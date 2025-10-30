class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    // Grid setup
    this.cols = 4;
    this.rows = 6;
    this.cellSize = 100;
    this.creeps = [];
    this.spotlightGraphics = this.add.graphics();

    // Stats
    this.resetCount = 0;
    this.escapeCount = 0;

    // Draw grid
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x444444);
    for (let i = 0; i <= this.cols; i++) {
      graphics.moveTo(i * this.cellSize, 0);
      graphics.lineTo(i * this.cellSize, this.rows * this.cellSize);
    }
    for (let i = 0; i <= this.rows; i++) {
      graphics.moveTo(0, i * this.cellSize);
      graphics.lineTo(this.cols * this.cellSize, i * this.cellSize);
    }
    graphics.strokePath();

    // Create creeps (bottom row)
    for (let i = 0; i < this.cols; i++) {
      const creepX = i * this.cellSize + this.cellSize / 2;
      const creepY = (this.rows - 1) * this.cellSize + this.cellSize / 2;

      const circle = this.add.circle(creepX, creepY, 20, 0x00ff00);
      const label = this.add.text(creepX - 6, creepY - 10, (i + 1).toString(), {
        fontSize: "20px",
        color: "#000",
        fontStyle: "bold",
      });

      this.creeps.push({
        sprite: circle,
        label: label,
        col: i,
        row: this.rows - 1,
      });
    }

    this.activeCreepIndex = 0;
    this.updateCreepColors();

    // UI Text
    this.uiText = this.add.text(10, 10, "", {
      fontSize: "20px",
      color: "#FFFFFF",
      fontFamily: "monospace",
    });
    this.updateUI();

    // Keyboard input
    this.keys = this.input.keyboard.addKeys("W,A,S,D,ONE,TWO,THREE,FOUR");
    this.input.keyboard.on("keydown", this.handleInput, this);

    // Spotlight timer (every 2 seconds)
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.activateSpotlight,
      callbackScope: this,
    });
  }

  handleInput(event) {
    const creep = this.creeps[this.activeCreepIndex];
    if (!creep) return;

    const moveMap = {
      W: { r: -1, c: 0 },
      S: { r: 1, c: 0 },
      A: { r: 0, c: -1 },
      D: { r: 0, c: 1 },
    };

    const move = moveMap[event.key.toUpperCase()];
    if (move) {
      creep.row = Phaser.Math.Clamp(creep.row + move.r, 0, this.rows - 1);
      creep.col = Phaser.Math.Clamp(creep.col + move.c, 0, this.cols - 1);
      this.updateCreepPosition(creep);
      this.checkEscape(creep);
    }

    if (["1", "2", "3", "4"].includes(event.key)) {
      this.activeCreepIndex = parseInt(event.key) - 1;
      this.updateCreepColors();
    }
  }

  updateCreepPosition(creep) {
    creep.sprite.x = creep.col * this.cellSize + this.cellSize / 2;
    creep.sprite.y = creep.row * this.cellSize + this.cellSize / 2;
    creep.label.x = creep.sprite.x - 6;
    creep.label.y = creep.sprite.y - 10;
  }

  updateCreepColors() {
    this.creeps.forEach((c, index) => {
      c.sprite.fillColor = index === this.activeCreepIndex ? 0xff0000 : 0x00ff00;
    });
  }

  activateSpotlight() {
    // Pick a random column
    const col = Phaser.Math.Between(0, this.cols - 1);

    // Draw spotlight highlight
    this.spotlightGraphics.clear();
    this.spotlightGraphics.fillStyle(0xffffff, 0.3);
    this.spotlightGraphics.fillRect(
      col * this.cellSize,
      0,
      this.cellSize,
      this.rows * this.cellSize
    );

    // Check creeps in that column
    this.creeps.forEach((creep) => {
      if (creep.col === col && creep.row < this.rows - 1) {
        // Reset to starting row
        creep.row = this.rows - 1;
        this.resetCount++;
        this.updateCreepPosition(creep);
      }
    });

    // Update UI
    this.updateUI();

    // Fade spotlight after short delay
    this.time.delayedCall(500, () => {
      this.spotlightGraphics.clear();
    });
  }

  checkEscape(creep) {
    // If creep reaches top-left or top-right
    if (creep.row === 0 && (creep.col === 0 || creep.col === this.cols - 1)) {
      this.escapeCount++;

      // Send creep back to start after escaping
      creep.row = this.rows - 1;
      this.updateCreepPosition(creep);
      this.updateUI();
    }
  }

  updateUI() {
    this.uiText.setText(
      `Resets: ${this.resetCount}   Escapes: ${this.escapeCount}`
    );
  }
}

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  backgroundColor: "#000000",
  scene: [GameScene],
};

new Phaser.Game(config);
