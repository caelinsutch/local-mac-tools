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
 * Based on the Python approach: extract text between NSString and NSDictionary markers
 */
export function parseAttributedBody(buffer: Buffer | null): string | null {
	if (!buffer) return null;

	try {
		// Decode buffer as UTF-8, replacing invalid sequences
		let attributedBody = buffer.toString("utf8");

		// Check if this is an NSAttributedString format
		if (attributedBody.includes("NSNumber")) {
			// Split by NSNumber and take the first part
			attributedBody = attributedBody.split("NSNumber")[0];

			// Look for content between NSString and NSDictionary
			if (attributedBody.includes("NSString")) {
				attributedBody = attributedBody.split("NSString")[1];

				if (attributedBody.includes("NSDictionary")) {
					attributedBody = attributedBody.split("NSDictionary")[0];

					// Clean up: remove first 6 and last 12 characters (encoding artifacts)
					if (attributedBody.length > 18) {
						attributedBody = attributedBody.substring(
							6,
							attributedBody.length - 12,
						);
						return attributedBody.trim();
					}
				}
			}
		}

		// Fallback: try original regex approach
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Necessary for parsing the buffer
		const match = attributedBody.match(/NSString[^\x00]*?\x00([^\x00]+)/);
		if (match?.[1]) {
			return match[1].trim();
		}

		return null;
	} catch (_error) {
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

/**
 * Message interface for formatting
 */
export interface FormattableMessage {
	is_from_me: number;
	text?: string | null;
	attributedBody?: Buffer | string | null;
	date: number;
	handle?: {
		id: string;
	};
}

/**
 * Formats a message for display
 * Uses enriched message data when available (handle.id) for better display
 * @param msg Message object to format (preferably EnrichedMessage)
 * @returns Formatted string with timestamp, sender, and text
 */
export function formatMessage(msg: FormattableMessage): string {
	const sender = msg.is_from_me ? "Me" : msg.handle?.id || "Unknown";

	// Handle both Buffer and string attributedBody
	let text: string | null = null;
	if (msg.attributedBody) {
		if (Buffer.isBuffer(msg.attributedBody)) {
			text = parseAttributedBody(msg.attributedBody) ?? msg.text ?? null;
		} else {
			text = msg.attributedBody;
		}
	} else {
		text = msg.text ?? null;
	}

	// Apple time is nanoseconds since 2001-01-01, convert to readable date
	const date = appleTimeToDate(msg.date);
	return `[${date.toISOString()}] ${sender}: ${text ?? ""}`;
}
