import * as util from "util";
import * as path from "path";

const textDecoder = new util.TextDecoder("utf-8");

/**
 * 将字节流解码为字符串
 */
export function decodeText(buffer: Uint8Array): string {
    return textDecoder.decode(buffer);
}

/**
 * 标准化路径分隔符为 POSIX 风格 (/)
 */
export function normalizePath(fsPath: string): string {
    return fsPath.split(path.sep).join("/");
}

/**
 * 简单的 Token 估算
 * 逻辑：平均 4 字符 = 1 Token
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * 二进制探测
 * 逻辑：读取前 512 字节，包含 Null Byte 则视为二进制
 */
export function isBinary(buffer: Uint8Array): boolean {
    const checkLength = Math.min(buffer.length, 512);
    for (let i = 0; i < checkLength; i++) {
        if (buffer[i] === 0) {
            return true;
        }
    }
    return false;
}
