class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload(){
    this.load.audio('levelComplete', 'assets/sounds/level_complete.ogg');
    this.load.audio('lifeLost', 'assets/sounds/lifelost.ogg');
    this.load.audio('GameOver', 'assets/sounds/Death.ogg');
  }

  create() {
    // GRID CONSTANTS
    this.cols = 8;
    this.rows = 8;
    this.cellSize = 80;

    // GAME STATE
    this.lives = 3;
    this.score = 0;
    this.round = 1;

    this.creep = null;
    this.hazardCells = [];

    // GRAPHICS LAYERS
    this.telegraphGraphics = this.add.graphics();
    this.spotlightGraphics = this.add.graphics();
    this.exitGraphics = this.add.graphics();
    this.hazardGraphics = this.add.graphics();

    // UI (round removed)
    this.livesText = this.add.text(10, 10, "Lives: XXX", {
      fontSize: "20px",
      color: "#FFFFFF",
      fontFamily: "monospace",
    });

    this.scoreText = this.add.text(10, 35, "Score: 0", {
      fontSize: "20px",
      color: "#FFFFFF",
      fontFamily: "monospace",
    });

    // DRAW GRID
    const g = this.add.graphics();
    g.lineStyle(2, 0x444444);
    for (let i = 0; i <= this.cols; i++) {
      g.moveTo(i * this.cellSize, 0);
      g.lineTo(i * this.cellSize, this.rows * this.cellSize);
    }
    for (let i = 0; i <= this.rows; i++) {
      g.moveTo(0, i * this.cellSize);
      g.lineTo(this.cols * this.cellSize, i * this.cellSize);
    }
    g.strokePath();

    // INPUT
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown", this.handleInput, this);

    // added sound objects
    this.levelCompleteSound = this.sound.add('levelComplete');
    this.lifeLostSound = this.sound.add('lifeLost');
    this.gameOverSound = this.sound.add('GameOver');

    // START FIRST ROUND
    this.startNewRound();
  }

  // -------------------------------------------------------
  // ---------------- SPOTLIGHT RESETTABLE TIMER -----------
  // -------------------------------------------------------

  startSpotlightCycle() {
    this.spotlightEvent = this.time.addEvent({
      delay: 1250, // 0.75 telegraph + 0.5 fire
      loop: true,
      callback: () => this.beginSpotlightCycle(),
    });
  }

  // -------------------------------------------------------
  // ---------------- ROUND SETUP --------------------------
  // -------------------------------------------------------

  startNewRound() {
    // Clear all old graphics
    this.clearSpotlights();
    this.telegraphGraphics.clear();
    this.clearExit();
    this.clearHazards();

    // Remove old spotlight timers
    if (this.spotlightEvent) {
      this.spotlightEvent.remove();
    }

    // Reset creep & board
    this.spawnCreep();
    this.chooseExitCell();
    this.spawnHazards();

    // Restart spotlight loop
    this.startSpotlightCycle();
  }

  spawnCreep() {
    if (this.creep) {
      this.creep.sprite.destroy();
      this.creep.label.destroy();
    }

    const col = Phaser.Math.Between(0, this.cols - 1);
    const row = Phaser.Math.Between(0, this.rows - 1);

    const x = col * this.cellSize + this.cellSize / 2;
    const y = row * this.cellSize + this.cellSize / 2;

    const circle = this.add.circle(x, y, 20, 0x00ff00);
    const label = this.add.text(x - 6, y - 10, "1", {
      fontSize: "20px",
      color: "#000",
      fontFamily: "monospace",
    });

    this.creep = {
      sprite: circle,
      label: label,
      col: col,
      row: row,
      idleTime: 0,
    };
  }

  // -------------------------------------------------------
  // ---------------- EXIT CELL ----------------------------
  // -------------------------------------------------------

  chooseExitCell() {
    this.exitCol = Phaser.Math.Between(0, this.cols - 1);
    this.exitRow = Phaser.Math.Between(0, this.rows - 1);
    this.flashExit();
  }

  flashExit() {
    this.exitGraphics.clear();
    this.exitGraphics.fillStyle(0xffd700, 0.7);

    this.exitGraphics.fillRect(
      this.exitCol * this.cellSize,
      this.exitRow * this.cellSize,
      this.cellSize,
      this.cellSize
    );

    this.tweens.add({
      targets: this.exitGraphics,
      alpha: { from: 1, to: 0.4 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  clearExit() {
    this.exitGraphics.clear();
    this.tweens.killTweensOf(this.exitGraphics);
  }

  // -------------------------------------------------------
  // ---------------- HAZARD CELLS -------------------------
  // -------------------------------------------------------

  spawnHazards() {
    this.hazardCells = [];
    this.hazardGraphics.clear();

    let used = new Set();
    let needed = 5;

    while (this.hazardCells.length < needed) {
      let col = Phaser.Math.Between(0, this.cols - 1);
      let row = Phaser.Math.Between(0, this.rows - 1);

      let key = `${col},${row}`;

      // Don’t spawn hazard on exit
      if (col === this.exitCol && row === this.exitRow) continue;

      if (!used.has(key)) {
        used.add(key);
        this.hazardCells.push({ col, row });
      }
    }

    this.drawHazards();
  }

  drawHazards() {
    this.hazardGraphics.clear();
    this.hazardGraphics.fillStyle(0xff0000, 0.6);

    this.hazardCells.forEach((cell) => {
      this.hazardGraphics.fillRect(
        cell.col * this.cellSize,
        cell.row * this.cellSize,
        this.cellSize,
        this.cellSize
      );
    });
  }

  clearHazards() {
    this.hazardCells = [];
    this.hazardGraphics.clear();
  }

  // -------------------------------------------------------
  // ---------------- MOVEMENT -----------------------------
  // -------------------------------------------------------

  handleInput(event) {
    if (!this.creep) return;

    let moved = false;

    if (event.key === "ArrowUp") {
      this.creep.row = Math.max(0, this.creep.row - 1);
      moved = true;
    }
    if (event.key === "ArrowDown") {
      this.creep.row = Math.min(this.rows - 1, this.creep.row + 1);
      moved = true;
    }
    if (event.key === "ArrowLeft") {
      this.creep.col = Math.max(0, this.creep.col - 1);
      moved = true;
    }
    if (event.key === "ArrowRight") {
      this.creep.col = Math.min(this.cols - 1, this.creep.col + 1);
      moved = true;
    }

    if (moved) {
      this.creep.idleTime = 0;
      this.updateCreepPosition();
      this.checkHazardDeath();
      this.checkExitReached();
    }
  }

  updateCreepPosition() {
    this.creep.sprite.x = this.creep.col * this.cellSize + this.cellSize / 2;
    this.creep.sprite.y = this.creep.row * this.cellSize + this.cellSize / 2;
    this.creep.label.x = this.creep.sprite.x - 6;
    this.creep.label.y = this.creep.sprite.y - 10;
  }

  checkHazardDeath() {
    for (let cell of this.hazardCells) {
      if (cell.col === this.creep.col && cell.row === this.creep.row) {
        this.handleCreepDeath();
        return;
      }
    }
  }

  // -------------------------------------------------------
  // ---------------- EXIT CHECK ---------------------------
  // -------------------------------------------------------

  checkExitReached() {
    if (this.creep.col === this.exitCol && this.creep.row === this.exitRow) {
      // new level sound --> add 
      this.levelCompleteSound.play();
      this.score += 100;
      this.scoreText.setText("Score: " + this.score);

      this.round++;
      this.startNewRound();
    }
  }

  // -------------------------------------------------------
  // ---------------- SPOTLIGHT SYSTEM ---------------------
  // -------------------------------------------------------

  beginSpotlightCycle() {
    this.creep.idleTime++;

    let targetRow, targetCol;

    // Weighted 70% targeting, 30% random
    if (Math.random() < 0.7) {
      targetRow = this.creep.row;
      targetCol = this.creep.col;

      // Punish idle behavior
      if (this.creep.idleTime >= 3 && Math.random() < 0.8) {
        targetRow = this.creep.row;
        targetCol = this.creep.col;
      }
    } else {
      targetRow = Phaser.Math.Between(0, this.rows - 1);
      targetCol = Phaser.Math.Between(0, this.cols - 1);
    }

    this.telegraph(targetRow, targetCol);

    this.time.delayedCall(750, () => {
      this.fireSpotlight(targetRow, targetCol);
    });
  }

  telegraph(row, col) {
    this.telegraphGraphics.clear();
    this.telegraphGraphics.fillStyle(0xff0000, 0.9);

    // Row telegraph
    this.telegraphGraphics.fillRect(
      0,
      row * this.cellSize,
      this.cols * this.cellSize,
      6
    );

    // Column telegraph
    this.telegraphGraphics.fillRect(
      col * this.cellSize,
      0,
      6,
      this.rows * this.cellSize
    );
  }

  fireSpotlight(row, col) {
    this.telegraphGraphics.clear();
    this.spotlightGraphics.clear();

    this.spotlightGraphics.fillStyle(0xffffff, 0.45);

    // Row spotlight
    this.spotlightGraphics.fillRect(
      0,
      row * this.cellSize,
      this.cols * this.cellSize,
      this.cellSize
    );

    // Column spotlight
    this.spotlightGraphics.fillRect(
      col * this.cellSize,
      0,
      this.cellSize,
      this.rows * this.cellSize
    );

    // Check for death
    if (this.creep.row === row || this.creep.col === col) {
      this.handleCreepDeath();
    }

    this.time.delayedCall(500, () => this.clearSpotlights());
  }

  // -------------------------------------------------------
  // ---------------- DEATH & LIVES ------------------------
  // -------------------------------------------------------

  handleCreepDeath() {
    this.lives--;
    this.updateLivesText();

    if (this.lives <= 0) {
      // Game over sound --> add
      this.gameOverSound.play();
      this.time.delayedCall(250, () => {
        alert("GAME OVER");
        location.reload()});
      return;
    }

    // LIFE LOST  sound --> add
    this.lifeLostSound.play();
    // small pause on death
    this.time.delayedCall(500, () => {
      this.startNewRound();
    });
  }

  updateLivesText() {
    let str = "";
    for (let i = 0; i < this.lives; i++) str += "X";
    this.livesText.setText("Lives: " + str);
  }

  clearSpotlights() {
    this.spotlightGraphics.clear();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 640,
  backgroundColor: "#000000",
  scene: [GameScene],
};

new Phaser.Game(config);
