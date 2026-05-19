/**
 * 声音提示插件
 * 回答完全完成后播放风铃声
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { exec } from "child_process";

// 配置
const CONFIG = {
	enabled: true,
	thresholdSeconds: 15,
};

// 状态
let startTime = 0;

/**
 * 播放风铃声
 */
async function playChime(): Promise<void> {
	if (!CONFIG.enabled) return;

	try {
		await new Promise<void>((resolve) => {
			exec(`powershell -c "(New-Object Media.SoundPlayer 'C:/Windows/Media/chimes.wav').PlaySync()"`, () => resolve());
		});
	} catch {
		process.stdout.write("\x07");
	}
}

export default function (pi: ExtensionAPI) {
	// 开始计时
	pi.on("agent_start", async () => {
		startTime = Date.now();
	});

	// 回答完全结束后判断是否播放声音
	pi.on("agent_end", async () => {
		if (startTime === 0) return;

		const elapsed = (Date.now() - startTime) / 1000;

		if (elapsed >= CONFIG.thresholdSeconds) {
			await playChime();
		}

		startTime = 0;
	});

	// /sound - 切换开关
	pi.registerCommand("sound", {
		description: "切换声音提示",
		handler: async (_args, ctx) => {
			CONFIG.enabled = !CONFIG.enabled;
			ctx.ui.notify(`声音提示已${CONFIG.enabled ? "开启" : "关闭"}`, "info");
			ctx.ui.setStatus("sound", CONFIG.enabled
				? ctx.ui.theme.fg("accent", "🔊 声音开")
				: ctx.ui.theme.fg("muted", "🔇 声音关"));
		},
	});

	// /sound-threshold - 设置阈值
	pi.registerCommand("sound-threshold", {
		description: "设置提示阈值（秒）",
		handler: async (args, ctx) => {
			const sec = parseInt(args || "5", 10);
			if (isNaN(sec) || sec < 0) {
				ctx.ui.notify("请输入正整数", "warning");
				return;
			}
			CONFIG.thresholdSeconds = sec;
			ctx.ui.notify(`阈值已设为 ${sec} 秒`, "info");
		},
	});

	// /sound-test - 测试声音
	pi.registerCommand("sound-test", {
		description: "测试声音",
		handler: async (_args, ctx) => {
			ctx.ui.notify("播放风铃声...", "info");
			await playChime();
		},
	});

	// 初始化状态栏
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setStatus("sound", CONFIG.enabled
			? ctx.ui.theme.fg("accent", "🔊 声音开")
			: ctx.ui.theme.fg("muted", "🔇 声音关"));
	});
}
