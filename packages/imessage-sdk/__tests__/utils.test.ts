import { describe, expect, it, vi } from "vitest";

// Unmock utils to test real implementations
vi.unmock("../src/utils");

import {
	appleTimeToDate,
	dateToAppleTime,
	formatHandle,
	getDefaultDatabasePath,
	isGroupChat,
	parseAttributedBody,
	validateDatabasePath,
} from "../src/utils";

describe("utils", () => {
	describe("appleTimeToDate", () => {
		it("should convert Apple timestamp to JavaScript Date", () => {
			// Apple epoch: 2001-01-01 00:00:00 UTC
			const appleTime = 0;
			const result = appleTimeToDate(appleTime);
			expect(result).toBeInstanceOf(Date);
			expect(result.getUTCFullYear()).toBe(2001);
			expect(result.getUTCMonth()).toBe(0); // January
			expect(result.getUTCDate()).toBe(1);
		});

		it("should handle positive timestamps correctly", () => {
			// 1 day in nanoseconds = 86400 * 1000000000
			const oneDayInNanoseconds = 86400 * 1000000000;
			const result = appleTimeToDate(oneDayInNanoseconds);
			expect(result.getUTCFullYear()).toBe(2001);
			expect(result.getUTCMonth()).toBe(0);
			expect(result.getUTCDate()).toBe(2);
		});

		it("should handle large timestamps (recent dates)", () => {
			// Timestamp for approximately 2024
			const recentTime = 725846400000000000; // ~2024
			const result = appleTimeToDate(recentTime);
			expect(result.getFullYear()).toBeGreaterThanOrEqual(2024);
		});
	});

	describe("dateToAppleTime", () => {
		it("should convert JavaScript Date to Apple timestamp", () => {
			const date = new Date("2001-01-01T00:00:00Z");
			const result = dateToAppleTime(date);
			expect(result).toBe(0);
		});

		it("should handle dates after Apple epoch", () => {
			const date = new Date("2001-01-02T00:00:00Z");
			const result = dateToAppleTime(date);
			const oneDayInNanoseconds = 86400 * 1000000000;
			expect(result).toBe(oneDayInNanoseconds);
		});

		it("should be inverse of appleTimeToDate", () => {
			const originalDate = new Date("2024-01-15T12:30:00Z");
			const appleTime = dateToAppleTime(originalDate);
			const convertedDate = appleTimeToDate(appleTime);

			// Allow small difference due to precision
			expect(
				Math.abs(convertedDate.getTime() - originalDate.getTime()),
			).toBeLessThan(1000);
		});
	});

	describe("formatHandle", () => {
		it("should return email addresses unchanged", () => {
			const email = "test@example.com";
			expect(formatHandle(email)).toBe(email);
		});

		it("should format 10-digit US phone numbers", () => {
			const phone = "1234567890";
			const result = formatHandle(phone);
			expect(result).toBe("(123) 456-7890");
		});

		it("should format 11-digit US phone numbers with country code", () => {
			const phone = "11234567890";
			const result = formatHandle(phone);
			expect(result).toBe("+1 (123) 456-7890");
		});

		it("should handle already formatted phone numbers", () => {
			const phone = "+1-123-456-7890";
			const result = formatHandle(phone);
			expect(result).toBe("+1 (123) 456-7890");
		});

		it("should return non-standard formats unchanged", () => {
			const phone = "123";
			expect(formatHandle(phone)).toBe(phone);
		});

		it("should handle international numbers", () => {
			const phone = "+447911123456";
			expect(formatHandle(phone)).toBe(phone);
		});
	});

	describe("isGroupChat", () => {
		it("should return true for group chat identifiers", () => {
			expect(isGroupChat("chat123456789")).toBe(true);
			expect(isGroupChat("chat1234567890abcdef")).toBe(true);
		});

		it("should return false for individual chat identifiers", () => {
			expect(isGroupChat("+11234567890")).toBe(false);
			expect(isGroupChat("test@example.com")).toBe(false);
			expect(isGroupChat("iMessage;-;+11234567890")).toBe(false);
		});

		it("should handle edge cases", () => {
			expect(isGroupChat("")).toBe(false);
			expect(isGroupChat("Chat123")).toBe(false); // Case sensitive
		});
	});

	describe("parseAttributedBody", () => {
		it("should return null for null buffer", () => {
			expect(parseAttributedBody(null)).toBeNull();
		});

		it("should return null for empty buffer", () => {
			const buffer = Buffer.from("");
			expect(parseAttributedBody(buffer)).toBeNull();
		});

		it("should extract text from NSString format", () => {
			// Simplified NSString-like format
			const buffer = Buffer.from("NSString\x00Hello World\x00");
			const result = parseAttributedBody(buffer);
			expect(result).toBe("Hello World");
		});

		it("should return null for unparseable buffers", () => {
			const buffer = Buffer.from("random binary data");
			const result = parseAttributedBody(buffer);
			expect(result).toBeNull();
		});

		it("should handle buffers with special characters", () => {
			const buffer = Buffer.from("NSString\x00Test 123!@#\x00");
			const result = parseAttributedBody(buffer);
			expect(result).toBe("Test 123!@#");
		});
	});

	describe("getDefaultDatabasePath", () => {
		it("should return a path to chat.db", () => {
			const path = getDefaultDatabasePath();
			expect(path).toContain("Library/Messages/chat.db");
		});

		it("should include home directory", () => {
			const path = getDefaultDatabasePath();
			expect(path.length).toBeGreaterThan(0);
			expect(path).toMatch(/^[/~]/); // Should start with / or ~
		});
	});

	describe("validateDatabasePath", () => {
		it("should return false for non-existent path", () => {
			const result = validateDatabasePath("/nonexistent/path/to/chat.db");
			expect(result).toBe(false);
		});

		it("should return false for empty string", () => {
			const result = validateDatabasePath("");
			expect(result).toBe(false);
		});

		it("should handle paths with special characters", () => {
			const result = validateDatabasePath("/path/with spaces/chat.db");
			expect(result).toBe(false); // Assuming it doesn't exist
		});

		// Note: Testing for true case would require an actual database file
		// which may not be available in CI/CD environments
	});
});
