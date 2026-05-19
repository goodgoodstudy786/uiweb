import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/uiweb/" : "/",
  server: {
    host: "0.0.0.0",
    port: 8787,
  },
  preview: {
    host: "0.0.0.0",
    port: 8787,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // 代码分割优化
    rollupOptions: {
      input: {
        home: "index.html",
        case: "case.html",
        inspiration: "inspiration.html",
        works: "works.html",
        config: "config.html",
      },
      output: {
        // 手动分割 chunk，减小首屏加载体积
        manualChunks: {
          // 后台管理相关代码单独打包
          admin: ["./src/admin-app.ts"],
        },
      },
    },
    // 压缩优化
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 资源内联阈值
    assetsInlineLimit: 4096,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
  },
});
