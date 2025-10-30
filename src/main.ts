/**
 * 五子棋游戏主文件
 * 实现了完整的五子棋游戏逻辑，包括棋盘绘制、落子、胜负判定等功能
 */

// 游戏配置常量
const BOARD_SIZE = 15; // 棋盘大小（15x15）
const CELL_SIZE = 40; // 每个格子的像素大小
const PIECE_RADIUS = 15; // 棋子半径

// 玩家类型枚举
enum Player {
  NONE = 0,  // 空位
  BLACK = 1, // 黑方
  WHITE = 2  // 白方
}

// 棋盘状态类型
type Board = Player[][];

/**
 * 五子棋游戏类
 */
class GomokuGame {
  private board: Board; // 棋盘状态
  private currentPlayer: Player; // 当前玩家
  private gameOver: boolean; // 游戏是否结束
  private canvas: HTMLCanvasElement; // Canvas 元素
  private ctx: CanvasRenderingContext2D; // Canvas 上下文
  private statusElement: HTMLElement; // 状态显示元素
  private winnerMessageElement: HTMLElement; // 获胜消息元素

  constructor() {
    // 初始化棋盘
    this.board = this.createEmptyBoard();
    this.currentPlayer = Player.BLACK;
    this.gameOver = false;

    // 获取 DOM 元素
    this.canvas = document.getElementById('game-board') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.statusElement = document.getElementById('current-player')!;
    this.winnerMessageElement = document.getElementById('winner-message')!;

    // 绑定事件
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    document.getElementById('reset-btn')!.addEventListener('click', this.reset.bind(this));

    // 绘制初始棋盘
    this.drawBoard();
  }

  /**
   * 创建空棋盘
   */
  private createEmptyBoard(): Board {
    return Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => Player.NONE)
    );
  }

  /**
   * 绘制棋盘
   */
  private drawBoard(): void {
    const { ctx } = this;

    // 清空画布
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制网格线
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      // 绘制横线
      ctx.beginPath();
      ctx.moveTo(CELL_SIZE, CELL_SIZE + i * CELL_SIZE);
      ctx.lineTo(CELL_SIZE + (BOARD_SIZE - 1) * CELL_SIZE, CELL_SIZE + i * CELL_SIZE);
      ctx.stroke();

      // 绘制竖线
      ctx.beginPath();
      ctx.moveTo(CELL_SIZE + i * CELL_SIZE, CELL_SIZE);
      ctx.lineTo(CELL_SIZE + i * CELL_SIZE, CELL_SIZE + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();
    }

    // 绘制所有棋子
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.board[row][col] !== Player.NONE) {
          this.drawPiece(row, col, this.board[row][col]);
        }
      }
    }
  }

  /**
   * 绘制棋子
   */
  private drawPiece(row: number, col: number, player: Player): void {
    const { ctx } = this;
    const x = CELL_SIZE + col * CELL_SIZE;
    const y = CELL_SIZE + row * CELL_SIZE;

    ctx.beginPath();
    ctx.arc(x, y, PIECE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = player === Player.BLACK ? '#000' : '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * 处理点击事件
   */
  private handleClick(event: MouseEvent): void {
    if (this.gameOver) return;

    // 计算点击位置对应的棋盘坐标
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.round((x - CELL_SIZE) / CELL_SIZE);
    const row = Math.round((y - CELL_SIZE) / CELL_SIZE);

    // 检查坐标是否有效
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return;
    }

    // 检查该位置是否已有棋子
    if (this.board[row][col] !== Player.NONE) {
      return;
    }

    // 落子
    this.placePiece(row, col);
  }

  /**
   * 在指定位置放置棋子
   */
  private placePiece(row: number, col: number): void {
    this.board[row][col] = this.currentPlayer;
    this.drawPiece(row, col, this.currentPlayer);

    // 检查是否获胜
    if (this.checkWin(row, col)) {
      this.endGame(this.currentPlayer);
      return;
    }

    // 检查是否平局
    if (this.isBoardFull()) {
      this.endGame(Player.NONE);
      return;
    }

    // 切换玩家
    this.switchPlayer();
  }

  /**
   * 检查是否获胜
   */
  private checkWin(row: number, col: number): boolean {
    const player = this.board[row][col];

    // 四个方向：横、竖、左斜、右斜
    const directions = [
      [0, 1],   // 横向
      [1, 0],   // 纵向
      [1, 1],   // 左上到右下
      [1, -1]   // 右上到左下
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // 当前棋子本身

      // 正方向统计
      count += this.countDirection(row, col, dx, dy, player);
      // 反方向统计
      count += this.countDirection(row, col, -dx, -dy, player);

      if (count >= 5) {
        return true;
      }
    }

    return false;
  }

  /**
   * 在指定方向统计连续的棋子数量
   */
  private countDirection(row: number, col: number, dx: number, dy: number, player: Player): number {
    let count = 0;
    let currentRow = row + dx;
    let currentCol = col + dy;

    while (
      currentRow >= 0 && currentRow < BOARD_SIZE &&
      currentCol >= 0 && currentCol < BOARD_SIZE &&
      this.board[currentRow][currentCol] === player
    ) {
      count++;
      currentRow += dx;
      currentCol += dy;
    }

    return count;
  }

  /**
   * 检查棋盘是否已满
   */
  private isBoardFull(): boolean {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.board[row][col] === Player.NONE) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 切换当前玩家
   */
  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;
    this.statusElement.textContent = this.currentPlayer === Player.BLACK ? '黑方' : '白方';
  }

  /**
   * 结束游戏
   */
  private endGame(winner: Player): void {
    this.gameOver = true;

    let message: string;
    if (winner === Player.NONE) {
      message = '平局！';
    } else {
      message = `${winner === Player.BLACK ? '黑方' : '白方'}获胜！`;
    }

    this.winnerMessageElement.textContent = message;
    this.winnerMessageElement.classList.remove('hidden');
  }

  /**
   * 重置游戏
   */
  private reset(): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = Player.BLACK;
    this.gameOver = false;
    this.statusElement.textContent = '黑方';
    this.winnerMessageElement.classList.add('hidden');
    this.drawBoard();
  }
}

// 初始化游戏
new GomokuGame();
