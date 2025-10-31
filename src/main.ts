/**
 * 五子棋游戏主文件
 * 实现了完整的五子棋游戏逻辑，包括棋盘绘制、落子、胜负判定、悔棋、AI对战等功能
 */

// 游戏配置常量
const BOARD_SIZE = 15; // 棋盘大小（15x15）
const BASE_CELL_SIZE = 40; // 基础格子大小
const BASE_PIECE_RADIUS = 15; // 基础棋子半径
const BASE_CANVAS_SIZE = 600; // 基础画布大小

// 玩家类型枚举
enum Player {
  NONE = 0,  // 空位
  BLACK = 1, // 黑方
  WHITE = 2  // 白方
}

// 游戏模式枚举
enum GameMode {
  PVP = 'pvp',  // 玩家对战
  PVE = 'pve'   // 玩家 vs AI
}

// 棋盘状态类型
type Board = Player[][];

// 落子记录类型
interface Move {
  row: number;
  col: number;
  player: Player;
  timestamp: number;
  moveNumber: number;
}

// 游戏状态类型
interface GameState {
  board: Board;
  currentPlayer: Player;
  gameOver: boolean;
  moveHistory: Move[];
  gameMode: GameMode;
}

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
  private moveHistory: Move[]; // 落子历史
  private moveCount: number; // 落子计数
  private gameMode: GameMode; // 游戏模式
  private canvasSize!: number; // Canvas 实际尺寸
  private scale!: number; // 缩放比例
  private cellSize!: number; // 实际格子大小
  private pieceRadius!: number; // 实际棋子半径
  private hoverRow: number; // 鼠标悬停行
  private hoverCol: number; // 鼠标悬停列
  private showMoveNumbers: boolean; // 是否显示落子序号
  private offscreenCanvas: HTMLCanvasElement; // 离屏画布
  private offscreenCtx: CanvasRenderingContext2D; // 离屏画布上下文

  constructor() {
    // 初始化棋盘
    this.board = this.createEmptyBoard();
    this.currentPlayer = Player.BLACK;
    this.gameOver = false;
    this.moveHistory = [];
    this.moveCount = 0;
    this.gameMode = GameMode.PVP;
    this.hoverRow = -1;
    this.hoverCol = -1;
    this.showMoveNumbers = true;

    // 获取 DOM 元素
    this.canvas = document.getElementById('game-board') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.statusElement = document.getElementById('current-player')!;
    this.winnerMessageElement = document.getElementById('winner-message')!;

    // 创建离屏画布
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    // 设置 Canvas 尺寸（响应式）
    this.setupCanvas();

    // 绑定事件
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    document.getElementById('reset-btn')!.addEventListener('click', this.reset.bind(this));
    document.getElementById('undo-btn')!.addEventListener('click', this.undo.bind(this));
    document.getElementById('mode-toggle')!.addEventListener('click', this.toggleMode.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));

    // 尝试加载保存的游戏
    this.loadGame();

    // 绘制初始棋盘
    this.drawBoard();
  }

  /**
   * 设置 Canvas 尺寸（响应式）
   */
  private setupCanvas(): void {
    // 计算合适的 Canvas 尺寸
    const maxSize = Math.min(window.innerWidth - 60, BASE_CANVAS_SIZE);
    this.canvasSize = maxSize;
    this.scale = this.canvasSize / BASE_CANVAS_SIZE;
    this.cellSize = BASE_CELL_SIZE * this.scale;
    this.pieceRadius = BASE_PIECE_RADIUS * this.scale;

    // 设置主画布的实际渲染尺寸
    this.canvas.width = this.canvasSize;
    this.canvas.height = this.canvasSize;

    // 设置离屏画布尺寸
    this.offscreenCanvas.width = this.canvasSize;
    this.offscreenCanvas.height = this.canvasSize;

    // 绘制离屏画布背景
    this.drawBoardBackground();
  }

  /**
   * 处理窗口大小改变
   */
  private handleResize(): void {
    this.setupCanvas();
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
   * 绘制棋盘背景（网格）到离屏画布
   */
  private drawBoardBackground(): void {
    const { offscreenCtx } = this;

    // 清空画布
    offscreenCtx.fillStyle = '#DEB887';
    offscreenCtx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // 绘制网格线
    offscreenCtx.strokeStyle = '#000';
    offscreenCtx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      // 绘制横线
      offscreenCtx.beginPath();
      offscreenCtx.moveTo(this.cellSize, this.cellSize + i * this.cellSize);
      offscreenCtx.lineTo(this.cellSize + (BOARD_SIZE - 1) * this.cellSize, this.cellSize + i * this.cellSize);
      offscreenCtx.stroke();

      // 绘制竖线
      offscreenCtx.beginPath();
      offscreenCtx.moveTo(this.cellSize + i * this.cellSize, this.cellSize);
      offscreenCtx.lineTo(this.cellSize + i * this.cellSize, this.cellSize + (BOARD_SIZE - 1) * this.cellSize);
      offscreenCtx.stroke();
    }

    // 绘制星位（天元和四个角的星位）
    const starPoints = [
      [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
    ];
    offscreenCtx.fillStyle = '#000';
    for (const [row, col] of starPoints) {
      const x = this.cellSize + col * this.cellSize;
      const y = this.cellSize + row * this.cellSize;
      offscreenCtx.beginPath();
      offscreenCtx.arc(x, y, 3 * this.scale, 0, 2 * Math.PI);
      offscreenCtx.fill();
    }
  }

  /**
   * 绘制棋盘（优化版本 - 使用离屏画布）
   */
  private drawBoard(): void {
    const { ctx } = this;

    // 复制离屏画布到主画布
    ctx.drawImage(this.offscreenCanvas, 0, 0);

    // 绘制所有棋子
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.board[row][col] !== Player.NONE) {
          const moveNumber = this.getMoveNumber(row, col);
          this.drawPiece(row, col, this.board[row][col], moveNumber);
        }
      }
    }

    // 绘制鼠标悬停预览
    if (this.hoverRow >= 0 && this.hoverCol >= 0 && !this.gameOver) {
      if (this.board[this.hoverRow][this.hoverCol] === Player.NONE) {
        this.drawPreview(this.hoverRow, this.hoverCol, this.currentPlayer);
      }
    }
  }

  /**
   * 获取指定位置的落子序号
   */
  private getMoveNumber(row: number, col: number): number {
    const move = this.moveHistory.find(m => m.row === row && m.col === col);
    return move ? move.moveNumber : 0;
  }

  /**
   * 绘制棋子
   */
  private drawPiece(row: number, col: number, player: Player, moveNumber?: number): void {
    const { ctx } = this;
    const x = this.cellSize + col * this.cellSize;
    const y = this.cellSize + row * this.cellSize;

    // 绘制棋子
    ctx.beginPath();
    ctx.arc(x, y, this.pieceRadius, 0, 2 * Math.PI);
    ctx.fillStyle = player === Player.BLACK ? '#000' : '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 绘制落子序号
    if (this.showMoveNumbers && moveNumber) {
      ctx.fillStyle = player === Player.BLACK ? '#fff' : '#000';
      ctx.font = `${12 * this.scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(moveNumber.toString(), x, y);
    }
  }

  /**
   * 绘制鼠标悬停预览
   */
  private drawPreview(row: number, col: number, player: Player): void {
    const { ctx } = this;
    const x = this.cellSize + col * this.cellSize;
    const y = this.cellSize + row * this.cellSize;

    ctx.beginPath();
    ctx.arc(x, y, this.pieceRadius, 0, 2 * Math.PI);
    ctx.fillStyle = player === Player.BLACK ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    ctx.strokeStyle = player === Player.BLACK ? '#000' : '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    if (this.gameOver) return;

    const [row, col] = this.getPositionFromEvent(event);

    if (row !== this.hoverRow || col !== this.hoverCol) {
      this.hoverRow = row;
      this.hoverCol = col;
      this.drawBoard();
    }
  }

  /**
   * 处理鼠标离开事件
   */
  private handleMouseLeave(): void {
    this.hoverRow = -1;
    this.hoverCol = -1;
    this.drawBoard();
  }

  /**
   * 从事件中获取棋盘坐标
   */
  private getPositionFromEvent(event: MouseEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 考虑缩放比例
    const col = Math.round((x - this.cellSize) / this.cellSize);
    const row = Math.round((y - this.cellSize) / this.cellSize);

    return [row, col];
  }

  /**
   * 处理点击事件
   */
  private handleClick(event: MouseEvent): void {
    if (this.gameOver) return;

    // AI 模式下，白方由 AI 控制，不响应点击
    if (this.gameMode === GameMode.PVE && this.currentPlayer === Player.WHITE) {
      return;
    }

    const [row, col] = this.getPositionFromEvent(event);

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
    this.moveCount++;

    // 记录历史
    const move: Move = {
      row,
      col,
      player: this.currentPlayer,
      timestamp: Date.now(),
      moveNumber: this.moveCount
    };
    this.moveHistory.push(move);

    // 绘制新棋子（增量绘制，而不是重绘整个棋盘）
    this.drawPiece(row, col, this.currentPlayer, this.moveCount);

    // 保存游戏状态
    this.saveGame();

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

    // AI 模式下，轮到 AI 落子
    if (this.gameMode === GameMode.PVE && this.currentPlayer === Player.WHITE) {
      setTimeout(() => this.aiMove(), 500);
    }
  }

  /**
   * AI 落子
   */
  private aiMove(): void {
    if (this.gameOver) return;

    const move = this.getAIMove();
    if (move) {
      this.placePiece(move[0], move[1]);
    }
  }

  /**
   * 获取 AI 的下一步落子位置（简单策略）
   */
  private getAIMove(): [number, number] | null {
    // 策略1: 检查是否能直接获胜
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.board[row][col] === Player.NONE) {
          this.board[row][col] = Player.WHITE;
          if (this.checkWin(row, col)) {
            this.board[row][col] = Player.NONE;
            return [row, col];
          }
          this.board[row][col] = Player.NONE;
        }
      }
    }

    // 策略2: 检查是否需要阻止对手获胜
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.board[row][col] === Player.NONE) {
          this.board[row][col] = Player.BLACK;
          if (this.checkWin(row, col)) {
            this.board[row][col] = Player.NONE;
            return [row, col];
          }
          this.board[row][col] = Player.NONE;
        }
      }
    }

    // 策略3: 评分系统 - 找最佳落子点
    let bestScore = -1;
    let bestMove: [number, number] | null = null;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.board[row][col] === Player.NONE) {
          const score = this.evaluatePosition(row, col, Player.WHITE);
          if (score > bestScore) {
            bestScore = score;
            bestMove = [row, col];
          }
        }
      }
    }

    return bestMove;
  }

  /**
   * 评估指定位置的得分
   */
  private evaluatePosition(row: number, col: number, player: Player): number {
    let score = 0;
    const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;

    // 检查四个方向的连续棋子数
    const directions = [
      [0, 1],   // 横向
      [1, 0],   // 纵向
      [1, 1],   // 左上到右下
      [1, -1]   // 右上到左下
    ];

    for (const [dx, dy] of directions) {
      // 己方连珠数量
      const myCount = this.countDirection(row, col, dx, dy, player) +
                      this.countDirection(row, col, -dx, -dy, player);
      // 对手连珠数量
      const opponentCount = this.countDirection(row, col, dx, dy, opponent) +
                           this.countDirection(row, col, -dx, -dy, opponent);

      // 评分权重：己方连珠更高，防守次之
      if (myCount >= 4) score += 100000; // 成五
      else if (myCount === 3) score += 10000; // 活四/冲四
      else if (myCount === 2) score += 1000; // 活三
      else if (myCount === 1) score += 100; // 活二

      if (opponentCount >= 4) score += 50000; // 防守对手成五
      else if (opponentCount === 3) score += 5000; // 防守对手活四
      else if (opponentCount === 2) score += 500; // 防守对手活三
    }

    // 中心位置加分
    const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
    score += (14 - centerDistance) * 10;

    return score;
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
    const playerText = this.currentPlayer === Player.BLACK ? '黑方' : '白方';
    const modeText = this.gameMode === GameMode.PVE && this.currentPlayer === Player.WHITE ? ' (AI)' : '';
    this.statusElement.textContent = playerText + modeText;
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
      const winnerText = winner === Player.BLACK ? '黑方' : '白方';
      const aiText = this.gameMode === GameMode.PVE && winner === Player.WHITE ? ' (AI)' : '';
      message = `${winnerText}${aiText}获胜！`;
    }

    this.winnerMessageElement.textContent = message;
    this.winnerMessageElement.classList.remove('hidden');

    // 清除本地存储
    localStorage.removeItem('gomoku-game-state');
  }

  /**
   * 悔棋
   */
  private undo(): void {
    if (this.gameOver || this.moveHistory.length === 0) {
      return;
    }

    // PVE 模式下，悔棋需要撤销两步（玩家和AI各一步）
    const stepsToUndo = this.gameMode === GameMode.PVE && this.moveHistory.length >= 2 ? 2 : 1;

    for (let i = 0; i < stepsToUndo; i++) {
      if (this.moveHistory.length === 0) break;

      const lastMove = this.moveHistory.pop()!;
      this.board[lastMove.row][lastMove.col] = Player.NONE;
      this.moveCount--;
    }

    // 更新当前玩家
    if (this.moveHistory.length > 0) {
      const lastMove = this.moveHistory[this.moveHistory.length - 1];
      this.currentPlayer = lastMove.player === Player.BLACK ? Player.WHITE : Player.BLACK;
    } else {
      this.currentPlayer = Player.BLACK;
    }

    // 更新显示
    const playerText = this.currentPlayer === Player.BLACK ? '黑方' : '白方';
    const modeText = this.gameMode === GameMode.PVE && this.currentPlayer === Player.WHITE ? ' (AI)' : '';
    this.statusElement.textContent = playerText + modeText;

    // 重绘棋盘
    this.drawBoard();

    // 保存状态
    this.saveGame();
  }

  /**
   * 切换游戏模式
   */
  private toggleMode(): void {
    this.gameMode = this.gameMode === GameMode.PVP ? GameMode.PVE : GameMode.PVP;
    const modeBtn = document.getElementById('mode-toggle') as HTMLButtonElement;
    modeBtn.textContent = this.gameMode === GameMode.PVP ? '切换到 AI 对战' : '切换到双人对战';

    // 重置游戏
    this.reset();
  }

  /**
   * 保存游戏状态到本地存储
   */
  private saveGame(): void {
    if (this.gameOver) return;

    const gameState: GameState = {
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      moveHistory: this.moveHistory,
      gameMode: this.gameMode
    };

    localStorage.setItem('gomoku-game-state', JSON.stringify(gameState));
  }

  /**
   * 从本地存储加载游戏状态
   */
  private loadGame(): void {
    const saved = localStorage.getItem('gomoku-game-state');
    if (!saved) return;

    try {
      const gameState: GameState = JSON.parse(saved);

      // 恢复游戏状态
      this.board = gameState.board;
      this.currentPlayer = gameState.currentPlayer;
      this.gameOver = gameState.gameOver;
      this.moveHistory = gameState.moveHistory;
      this.moveCount = gameState.moveHistory.length;
      this.gameMode = gameState.gameMode;

      // 更新UI
      const playerText = this.currentPlayer === Player.BLACK ? '黑方' : '白方';
      const modeText = this.gameMode === GameMode.PVE && this.currentPlayer === Player.WHITE ? ' (AI)' : '';
      this.statusElement.textContent = playerText + modeText;

      const modeBtn = document.getElementById('mode-toggle') as HTMLButtonElement;
      modeBtn.textContent = this.gameMode === GameMode.PVP ? '切换到 AI 对战' : '切换到双人对战';
    } catch (error) {
      console.error('加载游戏状态失败:', error);
      localStorage.removeItem('gomoku-game-state');
    }
  }

  /**
   * 重置游戏
   */
  private reset(): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = Player.BLACK;
    this.gameOver = false;
    this.moveHistory = [];
    this.moveCount = 0;
    this.statusElement.textContent = '黑方';
    this.winnerMessageElement.classList.add('hidden');

    // 清除本地存储
    localStorage.removeItem('gomoku-game-state');

    // 重绘棋盘
    this.drawBoard();
  }
}

// 初始化游戏
new GomokuGame();
