/**
 * Utility functions for iMessage SDK
 */

import * as fs from "node:fs";

/**
 * Converts Apple's Core Data timestamp to JavaScript Date
 * Apple stores dates as nanoseconds since 2001-01-01
 */
export function appleTimeToDate(appleTime: number): Date {
	// Apple epoch starts at 2001-01-01 00:00:00 UTC
	const APPLE_EPOCH = 978307200; // Unix timestamp for 2001-01-01

	// Convert nanoseconds to seconds (divide by 1 billion)
	const seconds = appleTime / 1000000000;

	// Add Apple epoch to get Unix timestamp
	const unixTimestamp = seconds + APPLE_EPOCH;

	return new Date(unixTimestamp * 1000);
}

/**
 * Converts JavaScript Date to Apple's Core Data timestamp
 */
export function dateToAppleTime(date: Date): number {
	const APPLE_EPOCH = 978307200;
	const unixTimestamp = Math.floor(date.getTime() / 1000);
	const seconds = unixTimestamp - APPLE_EPOCH;
	return seconds * 1000000000;
}

/**
 * Formats a phone number or email for display
 */
export function formatHandle(handleId: string): string {
	// Remove any special formatting
	if (handleId.includes("@")) {
		return handleId; // Email address
	}

	// Format phone number
	const cleaned = handleId.replace(/\D/g, "");
	if (cleaned.length === 11 && cleaned.startsWith("1")) {
		return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
	}
	if (cleaned.length === 10) {
		return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
	}

	return handleId;
}

/**
 * Checks if a chat is a group chat
 */
export function isGroupChat(chatIdentifier: string): boolean {
	return chatIdentifier.startsWith("chat");
}

/**
 * Safely parses attributedBody blob (for macOS Ventura+)
 * Note: This is a simplified version. Full parsing requires handling Apple's proprietary format
 */
export function parseAttributedBody(buffer: Buffer | null): string | null {
	if (!buffer) return null;

	try {
		// This is a simplified extraction - real implementation would need proper binary parsing
		const text = buffer.toString("utf8");
		// Look for readable text in the buffer
		const match = text.match(/NSString[^\x00]*?\x00([^\x00]+)/);
		return match ? match[1] : null;
	} catch (error) {
		return null;
	}
}

/**
 * Gets the default iMessage database path
 */
export function getDefaultDatabasePath(): string {
	const homeDir = process.env.HOME || process.env.USERPROFILE || "";
	return `${homeDir}/Library/Messages/chat.db`;
}

/**
 * Validates that the database path exists and is accessible
 */
export function validateDatabasePath(path: string): boolean {
	try {
		return fs.existsSync(path);
	} catch {
		return false;
	}
}
