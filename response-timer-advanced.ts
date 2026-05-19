import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Pi 扩展：回答耗时计时器
 * 
 * 功能：
 * - 流式输出时实时显示耗时
 * - 历史耗时统计
 */

interface TimerStats {
  lastTime: number;
  totalTime: number;
  count: number;
  minTime: number;
  maxTime: number;
}

export default function (pi: ExtensionAPI) {
  let startTime: number | null = null;
  let turnCount = 0;
  let isStreaming = false;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  
  let stats: TimerStats = {
    lastTime: 0,
    totalTime: 0,
    count: 0,
    minTime: Infinity,
    maxTime: 0,
  };

  const clearTick = () => {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };

  const startTick = (ctx: any) => {
    clearTick();
    tickTimer = setInterval(() => {
      if (startTime && isStreaming) {
        const elapsed = Date.now() - startTime;
        const seconds = (elapsed / 1000).toFixed(1);
        ctx.ui.setStatus("timer", `⏱️ ${seconds}s`);
      }
    }, 1000);
  };

  // 从会话恢复统计数据
  pi.on("session_start", async (_event, ctx) => {
    for (const entry of ctx.sessionManager.getEntries()) {
      if (entry.type === "custom" && entry.customType === "timer-stats") {
        stats = entry.data as TimerStats;
        break;
      }
    }
  });

  // 开始计时
  pi.on("agent_start", async (_event, ctx) => {
    startTime = Date.now();
    turnCount = 0;
    isStreaming = true;
    ctx.ui.setStatus("timer", "⏱️ 思考中...");
    startTick(ctx);
  });

  // 每个 turn
  pi.on("turn_start", async (_event, ctx) => {
    if (!startTime) startTime = Date.now();
  });

  pi.on("turn_end", async (_event, ctx) => {
    turnCount++;
  });

  // 结束计时
  pi.on("agent_end", async (_event, ctx) => {
    clearTick();
    
    if (startTime) {
      const elapsed = Date.now() - startTime;
      
      stats.lastTime = elapsed;
      stats.totalTime += elapsed;
      stats.count++;
      stats.minTime = Math.min(stats.minTime, elapsed);
      stats.maxTime = Math.max(stats.maxTime, elapsed);
      
      pi.appendEntry("timer-stats", stats);
      
      let statusText = formatTime(elapsed);
      if (turnCount > 1) {
        statusText += ` | ${turnCount}轮`;
      }
      
      ctx.ui.setStatus("timer", statusText);
      startTime = null;
      isStreaming = false;
    }
  });

  // 查看统计
  pi.registerCommand("timer-stats", {
    description: "查看回答耗时统计",
    handler: async (_args, ctx) => {
      if (stats.count === 0) {
        ctx.ui.notify("📊 暂无统计数据", "info");
        return;
      }
      
      const avgTime = stats.totalTime / stats.count;
      const message = [
        "📊 回答耗时统计",
        "─".repeat(25),
        `⏱️ 上次: ${formatMs(stats.lastTime)}`,
        `📈 平均: ${formatMs(avgTime)}`,
        `⚡ 最快: ${formatMs(stats.minTime)}`,
        `🐢 最慢: ${formatMs(stats.maxTime)}`,
        `📝 次数: ${stats.count}`,
      ].join("\n");
      
      ctx.ui.notify(message, "info");
    },
  });



  // 清理
  pi.on("session_shutdown", async () => {
    clearTick();
  });
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m${((ms % 60000) / 1000).toFixed(0)}s`;
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 2) return `⚡ ${seconds.toFixed(1)}s`;
  if (seconds < 10) return `⏱️ ${seconds.toFixed(1)}s`;
  if (seconds < 30) return `🐌 ${seconds.toFixed(1)}s`;
  return `🐢 ${seconds.toFixed(1)}s`;
}
