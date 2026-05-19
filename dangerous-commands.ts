/**
 * 危险命令拦截插件
 * 在执行危险 bash 命令前弹出确认框
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// 危险命令模式列表
const DANGEROUS_PATTERNS = [
	// 删除类
	/\brm\s+(-[rfv]*\s+)*(\/|~|\.|\*)/i,        // rm -rf /, rm -rf ~, rm -rf ., rm -rf *
	/\brm\s+.*--no-preserve-root/i,               // rm --no-preserve-root
	/\brmdir\s+.*\//i,                             // rmdir /path

	// 权限类
	/\bchmod\s+(-R\s+)?777/i,                     // chmod 777
	/\bchmod\s+.*\+\s*s/i,                         // chmod +s (suid)
	/\bchown\s+.*root/i,                           // chown root

	// 系统类
	/\bmkfs\b/i,                                   // mkfs (格式化)
	/\bfdisk\b/i,                                  // fdisk
	/\bdd\s+.*of=\/dev/i,                          // dd of=/dev/...
	/\b:\(\)\{.*\|.*&\s*\}/i,                      // fork bomb :(){ :|:& };:

	// 网络/下载执行
	/\bcurl\b.*\|\s*(bash|sh|python|node)/i,       // curl | bash
	/\bwget\b.*\|\s*(bash|sh|python|node)/i,       // wget | bash

	// 覆盖类
	/>\s*\/dev\/sd[a-z]/i,                         // > /dev/sda
	/\bmv\b.*\s+\/$/i,                             // mv something /

	// Git 危险操作
	/\bgit\s+push\s+.*--force/i,                   // git push --force
	/\bgit\s+reset\s+.*--hard/i,                   // git reset --hard
	/\bgit\s+clean\s+.*-fd/i,                      // git clean -fd
	/\bgit\s+branch\s+-D/i,                        // git branch -D

	// 进程类
	/\bkill\s+-9\s+1\b/i,                          // kill -9 1
	/\bkillall\b/i,                                // killall
	/\bpkill\b/i,                                  // pkill

	// 杂项
	/\bsudo\s+rm/i,                                // sudo rm
	/\bsu\s+-c/i,                                  // su -c
	/\bshutdown\b/i,                               // shutdown
	/\breboot\b/i,                                 // reboot
	/\binit\s+0\b/i,                               // init 0
];

/**
 * 检查命令是否危险
 */
function isDangerous(command: string): boolean {
	return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

/**
 * 提取危险原因
 */
function getDangerReason(command: string): string {
	if (/\brm\s+.*-[rfv]*r/i.test(command) || /\brm\s+.*-[rfv]*f/i.test(command)) {
		return "递归删除文件";
	}
	if (/\bchmod\s+777/i.test(command)) {
		return "设置宽松权限 (777)";
	}
	if (/\bgit\s+push\s+.*--force/i.test(command)) {
		return "强制推送可能覆盖远程提交";
	}
	if (/\bgit\s+reset\s+.*--hard/i.test(command)) {
		return "硬重置会丢失未提交的更改";
	}
	if (/\bcurl\b.*\|\s*(bash|sh)/i.test(command) || /\bwget\b.*\|\s*(bash|sh)/i.test(command)) {
		return "直接执行远程脚本";
	}
	if (/\bmkfs\b/i.test(command) || /\bfdisk\b/i.test(command)) {
		return "磁盘操作";
	}
	if (/\bdd\s+.*of=\/dev/i.test(command)) {
		return "直接写入设备";
	}
	if (/\bsudo\s+rm/i.test(command)) {
		return "以管理员权限删除";
	}
	return "可能的危险操作";
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		// 只拦截 bash 工具
		if (event.toolName !== "bash") return;

		const command = event.input.command as string;
		if (!command || !isDangerous(command)) return;

		const reason = getDangerReason(command);

		const confirmed = await ctx.ui.confirm(
			"⚠️ 危险命令警告",
			`${reason}\n\n命令: ${command}\n\n确定要执行吗？`,
		);

		if (!confirmed) {
			ctx.ui.notify("已取消执行", "info");
			return { block: true, reason: "用户取消了危险命令" };
		}
	});
}
