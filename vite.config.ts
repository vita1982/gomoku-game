import { defineConfig } from 'vite';

// Vite 配置文件
export default defineConfig({
  // 开发服务器配置
  server: {
    port: 3000,
    open: true
  },
  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
