# My Pi Extensions

我的 Pi 编码代理扩展插件集合。

## 插件列表

| 插件 | 文件 | 说明 |
|------|------|------|
| 🔔 声音提示 | `sound-notification.ts` | 回答完成后播放风铃声 |
| ⏱️ 耗时计时器 | `response-timer-advanced.ts` | 显示回答耗时和历史统计 |
| 📋 复制会话 | `copy-conversation.ts` | 复制会话内容到剪贴板 |
| 📝 计划模式 | `plan-mode/` | 只读探索模式，用于规划方案 |

---

## 🔔 声音提示 (sound-notification)

回答完全完成后播放柔和的风铃声，超过 5 秒才触发，避免短回答打扰。

### 命令

| 命令 | 说明 |
|------|------|
| `/sound` | 开关声音提示 |
| `/sound-test` | 测试声音 |
| `/sound-threshold <秒>` | 设置触发阈值（默认 5 秒） |

### 配置

编辑 `sound-notification.ts` 顶部：

```typescript
const CONFIG = {
    enabled: true,          // 是否启用
    thresholdSeconds: 5,    // 超过多少秒才提示
};
```

### 更换声音

替换 `playChime()` 函数中的路径：

```typescript
// Windows 可用声音：
// C:/Windows/Media/chimes.wav        - 风铃声
// C:/Windows/Media/ding.wav          - 叮声
// C:/Windows/Media/Windows Notify.wav - 通知声
```

---

## ⏱️ 耗时计时器 (response-timer-advanced)

实时显示回答耗时，支持历史统计。

### 功能

- 流式输出时实时更新耗时
- 根据耗时显示不同 emoji（⚡ 快 / ⏱️ 正常 / 🐌 慢 / 🐢 很慢）
- 记录最快、最慢、平均耗时
- 统计数据持久化保存

### 命令

| 命令 | 说明 |
|------|------|
| `/timer-stats` | 查看耗时统计 |

### 状态栏显示

| 图标 | 含义 |
|------|------|
| ⚡ | < 2 秒 |
| ⏱️ | 2-10 秒 |
| 🐌 | 10-30 秒 |
| 🐢 | > 30 秒 |

---

## 📋 复制会话 (copy-conversation)

将当前会话内容复制到剪贴板，方便分享。

### 命令

| 命令 | 说明 |
|------|------|
| `/copy` | 复制当前会话 |
| `/copy-all` | 复制完整会话（含系统消息） |

---

## 📝 计划模式 (plan-mode)

只读探索模式，用于在修改代码前先规划方案。

### 特点

- 只能读取文件，不能修改
- 适合在动手前先了解代码结构
- 可以自由探索，不会意外修改文件

### 命令

| 命令 | 说明 |
|------|------|
| `/plan` | 进入计划模式 |
| `/plan-off` | 退出计划模式 |

---

## 安装方式

### 方式一：直接复制

将插件文件复制到 `~/.pi/agent/extensions/` 目录：

```bash
# Windows
copy *.ts %USERPROFILE%\.pi\agent\extensions\

# Linux/macOS
cp *.ts ~/.pi/agent/extensions/
```

### 方式二：Git 克隆

```bash
cd ~/.pi/agent/extensions
git clone https://github.com/xulijian666/my_pi_extensions.git temp
mv temp/*.ts .
mv temp/plan-mode .
rm -rf temp
```

### 方式三：符号链接

```bash
# Windows (管理员权限)
mklink /D C:\Users\%USERNAME%\.pi\agent\extensions\my-plugins D:\path\to\my_pi_extensions

# Linux/macOS
ln -s /path/to/my_pi_extensions ~/.pi/agent/extensions/my-plugins
```

---

## 开发

### 插件结构

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    // 监听事件
    pi.on("agent_start", async (event, ctx) => {
        // ...
    });

    // 注册命令
    pi.registerCommand("my-command", {
        description: "我的命令",
        handler: async (args, ctx) => {
            ctx.ui.notify("Hello!", "info");
        },
    });

    // 注册工具
    pi.registerTool({
        name: "my-tool",
        description: "我的工具",
        parameters: Type.Object({ ... }),
        execute: async (toolCallId, params, signal, onUpdate, ctx) => {
            return { content: [...] };
        },
    });
}
```

### 常用事件

| 事件 | 触发时机 |
|------|----------|
| `session_start` | 会话开始 |
| `session_shutdown` | 会话结束 |
| `agent_start` | 开始处理用户输入 |
| `agent_end` | 回答完全完成 |
| `turn_start` | 单轮开始 |
| `turn_end` | 单轮结束 |
| `tool_call` | 工具调用前 |
| `tool_result` | 工具返回后 |

### 常用 API

| API | 说明 |
|-----|------|
| `ctx.ui.notify(msg, type)` | 显示通知 |
| `ctx.ui.confirm(title, msg)` | 确认对话框 |
| `ctx.ui.setStatus(id, text)` | 设置状态栏 |
| `ctx.ui.setWidget(id, lines)` | 设置编辑器上方组件 |
| `pi.registerCommand(...)` | 注册命令 |
| `pi.registerTool(...)` | 注册工具 |
| `pi.appendEntry(type, data)` | 持久化存储 |

---

## 相关链接

- [Pi 官网](https://pi.dev)
- [Pi 文档](https://pi.dev/docs/latest)
- [扩展开发指南](https://pi.dev/docs/latest/extensions)
- [Pi GitHub](https://github.com/earendil-works/pi-mono)

---

## 许可证

MIT
