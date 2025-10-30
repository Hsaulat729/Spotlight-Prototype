class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    // Grid setup (4x4)
    this.gridSize = 4;
    this.cellSize = 150;
    this.creeps = [];

    // Draw grid
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x444444);
    for (let i = 0; i <= this.gridSize; i++) {
      graphics.moveTo(i * this.cellSize, 0);
      graphics.lineTo(i * this.cellSize, this.gridSize * this.cellSize);
      graphics.moveTo(0, i * this.cellSize);
      graphics.lineTo(this.gridSize * this.cellSize, i * this.cellSize);
    }
    graphics.strokePath();

    // Create initial creeps (bottom row)
    for (let i = 0; i < this.gridSize; i++) {
      const creep = this.add.circle(i * this.cellSize + 75, 525, 20, 0x00ff00);
      this.creeps.push({ sprite: creep, col: i, row: 3 });
    }

    this.activeCreepIndex = 0;
    this.keys = this.input.keyboard.addKeys("W,A,S,D,ONE,TWO,THREE,FOUR");

    this.input.keyboard.on("keydown", this.handleInput, this);
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
      creep.row = Phaser.Math.Clamp(creep.row + move.r, 0, 3);
      creep.col = Phaser.Math.Clamp(creep.col + move.c, 0, 3);
      creep.sprite.x = creep.col * this.cellSize + 75;
      creep.sprite.y = creep.row * this.cellSize + 75;
    }

    if (["1", "2", "3", "4"].includes(event.key)) {
      this.activeCreepIndex = parseInt(event.key) - 1;
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 600,
  backgroundColor: "#000000",
  scene: [GameScene],
};

new Phaser.Game(config);
