import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * 复制对话插件
 * 
 * 功能：
 * - /cp 复制当前对话到剪切板
 * - 只复制用户提问和 AI 回答
 * - 不复制思考过程、系统消息等
 */

export default function (pi: ExtensionAPI) {
  
  pi.registerCommand("cp", {
    description: "📋 复制对话到剪切板（只复制问答内容）",
    handler: async (_args, ctx) => {
      const entries = ctx.sessionManager.getEntries();
      
      // 过滤并格式化消息
      const messages: string[] = [];
      
      for (const entry of entries) {
        // 只处理消息类型
        if (entry.type !== "message") continue;
        
        const msg = entry.message;
        
        // 用户消息
        if (msg.role === "user") {
          const content = extractText(msg.content);
          if (content.trim()) {
            messages.push(`👤 用户:\n${content}\n`);
          }
        }
        
        // AI 回答（只取文本内容，跳过工具调用等）
        if (msg.role === "assistant") {
          const content = extractAssistantText(msg.content);
          if (content.trim()) {
            messages.push(`🤖 AI:\n${content}\n`);
          }
        }
      }
      
      if (messages.length === 0) {
        ctx.ui.notify("❌ 没有可复制的对话内容", "error");
        return;
      }
      
      // 组装最终内容
      const conversation = messages.join("\n---\n\n");
      
      // 复制到剪切板
      try {
        await copyToClipboard(conversation);
        ctx.ui.notify(`✅ 已复制 ${messages.length} 条消息到剪切板`, "success");
      } catch (error) {
        ctx.ui.notify(`❌ 复制失败: ${error}`, "error");
      }
    },
  });

  // 注册快捷键
  pi.registerShortcut("ctrl+alt+c", {
    description: "复制对话到剪切板",
    handler: async (ctx) => {
      pi.sendUserMessage("/cp", { deliverAs: "followUp" });
    },
  });
}

// 提取文本内容
function extractText(content: any): string {
  if (typeof content === "string") {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
  }
  
  return "";
}

// 提取 AI 回答的文本内容（跳过思考过程）
function extractAssistantText(content: any): string {
  if (!Array.isArray(content)) {
    return typeof content === "string" ? content : "";
  }
  
  const parts: string[] = [];
  
  for (const block of content) {
    // 只取文本内容
    if (block.type === "text" && block.text) {
      // 跳过思考过程（通常在 <thinking> 标签内）
      let text = block.text;
      
      // 移除 <thinking>...</thinking> 标签及其内容
      text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
      
      // 移除其他可能的思考标记
      text = text.replace(/\[思考过程\][\s\S]*?\[\/思考过程\]/g, "");
      
      if (text.trim()) {
        parts.push(text.trim());
      }
    }
    
    // 跳过工具调用、工具结果等
    // if (block.type === "tool_use") continue;
    // if (block.type === "tool_result") continue;
  }
  
  return parts.join("\n\n");
}

// 复制到剪切板
async function copyToClipboard(text: string): Promise<void> {
  const { execSync } = await import("child_process");
  const { writeFileSync, unlinkSync, mkdirSync } = await import("fs");
  const { join } = await import("path");
  
  // Windows - 使用 PowerShell 脚本文件
  if (process.platform === "win32") {
    const tempDir = join(process.env.TEMP || process.env.TMP || "C:\\Temp", "pi-ext");
    try { mkdirSync(tempDir, { recursive: true }); } catch {}
    
    const textFile = join(tempDir, "clipboard-text.txt");
    const scriptFile = join(tempDir, "clipboard.ps1");
    
    writeFileSync(textFile, text, "utf-8");
    writeFileSync(scriptFile, `Get-Content -Raw -Encoding UTF8 "${textFile}" | Set-Clipboard`, "utf-8");
    
    try {
      execSync(`powershell -ExecutionPolicy Bypass -File "${scriptFile}"`, { stdio: "pipe" });
    } finally {
      try { unlinkSync(textFile); } catch {}
      try { unlinkSync(scriptFile); } catch {}
    }
    return;
  }
  
  // macOS
  if (process.platform === "darwin") {
    execSync(`pbcopy`, { input: text });
    return;
  }
  
  // Linux
  try {
    execSync(`xclip -selection clipboard`, { input: text });
  } catch {
    execSync(`xsel --clipboard`, { input: text });
  }
}
