# 五子棋游戏 (Gomoku Game)

一个使用 TypeScript + Vite 构建的现代化五子棋游戏。

## 功能特性

- ✅ 15x15 标准棋盘
- ✅ 黑白双方交替对弈
- ✅ 自动检测五子连珠获胜
- ✅ 精美的 UI 设计
- ✅ 响应式布局，支持移动端
- ✅ 完整的 TypeScript 类型支持

## 技术栈

- **TypeScript** - 类型安全
- **Vite** - 快速的开发构建工具
- **Canvas API** - 游戏渲染
- **ES Modules** - 现代模块化

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

浏览器会自动打开 http://localhost:3000

## 构建项目

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 类型检查

```bash
npm run typecheck
```

## 游戏规则

1. 黑方先行，黑白双方交替落子
2. 在横、竖、斜任意方向形成连续五子即获胜
3. 棋盘下满且无人获胜则为平局

## 项目结构

```
gomoku-game/
├── src/
│   ├── main.ts      # 游戏主逻辑
│   └── style.css    # 样式文件
├── index.html       # HTML 入口
├── package.json     # 项目配置
├── tsconfig.json    # TypeScript 配置
└── vite.config.ts   # Vite 配置
```

## 开发规范

本项目遵循以下代码规范：
- 使用 ES 模块语法 (import/export)
- 使用解构导入
- 代码添加中文注释
- 完成代码后进行类型检查

## 许可证

MIT
