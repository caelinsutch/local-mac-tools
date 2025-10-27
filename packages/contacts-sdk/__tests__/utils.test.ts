import { describe, expect, it } from "vitest";

import {
	cfTimeToDate,
	dateToCfTime,
	formatFullName,
	getDefaultDatabasePath,
	normalizeLabel,
	normalizePhoneNumber,
	phoneNumbersMatch,
	validateDatabasePath,
} from "../src/utils";

describe("utils", () => {
	describe("cfTimeToDate", () => {
		it("should convert CF timestamp to JavaScript Date", () => {
			// CF epoch: 2001-01-01 00:00:00 UTC
			const cfTime = 0;
			const result = cfTimeToDate(cfTime);
			expect(result).toBeInstanceOf(Date);
			expect(result.getUTCFullYear()).toBe(2001);
			expect(result.getUTCMonth()).toBe(0); // January
			expect(result.getUTCDate()).toBe(1);
		});

		it("should handle positive timestamps correctly", () => {
			// 1 day in seconds = 86400
			const oneDayInSeconds = 86400;
			const result = cfTimeToDate(oneDayInSeconds);
			expect(result.getUTCFullYear()).toBe(2001);
			expect(result.getUTCMonth()).toBe(0);
			expect(result.getUTCDate()).toBe(2);
		});

		it("should handle large timestamps (recent dates)", () => {
			// Timestamp for approximately 2024
			const recentTime = 725846400; // ~2024
			const result = cfTimeToDate(recentTime);
			expect(result.getFullYear()).toBeGreaterThanOrEqual(2024);
		});

		it("should handle negative timestamps (before epoch)", () => {
			const cfTime = -86400; // 1 day before epoch
			const result = cfTimeToDate(cfTime);
			expect(result.getUTCFullYear()).toBe(2000);
			expect(result.getUTCMonth()).toBe(11); // December
			expect(result.getUTCDate()).toBe(31);
		});
	});

	describe("dateToCfTime", () => {
		it("should convert JavaScript Date to CF timestamp", () => {
			const date = new Date("2001-01-01T00:00:00Z");
			const result = dateToCfTime(date);
			expect(result).toBe(0);
		});

		it("should handle dates after CF epoch", () => {
			const date = new Date("2001-01-02T00:00:00Z");
			const result = dateToCfTime(date);
			const oneDayInSeconds = 86400;
			expect(result).toBe(oneDayInSeconds);
		});

		it("should be inverse of cfTimeToDate", () => {
			const originalDate = new Date("2024-01-15T12:30:00Z");
			const cfTime = dateToCfTime(originalDate);
			const convertedDate = cfTimeToDate(cfTime);

			// Allow small difference due to precision
			expect(
				Math.abs(convertedDate.getTime() - originalDate.getTime()),
			).toBeLessThan(1000);
		});

		it("should handle dates before CF epoch", () => {
			const date = new Date("2000-12-31T00:00:00Z");
			const result = dateToCfTime(date);
			expect(result).toBeLessThan(0);
		});
	});

	describe("normalizePhoneNumber", () => {
		it("should remove non-digit characters except +", () => {
			const phone = "+1 (123) 456-7890";
			const result = normalizePhoneNumber(phone);
			expect(result).toBe("+11234567890");
		});

		it("should add +1 to 10-digit US numbers", () => {
			const phone = "1234567890";
			const result = normalizePhoneNumber(phone);
			expect(result).toBe("+11234567890");
		});

		it("should handle numbers with existing + prefix", () => {
			const phone = "+447911123456";
			const result = normalizePhoneNumber(phone);
			expect(result).toBe("+447911123456");
		});

		it("should handle 11-digit numbers without +", () => {
			const phone = "11234567890";
			const result = normalizePhoneNumber(phone);
			expect(result).toBe("+11234567890");
		});

		it("should handle numbers with special characters", () => {
			const phone = "(123) 456-7890";
			const result = normalizePhoneNumber(phone);
			expect(result).toBe("+11234567890");
		});

		it("should handle international numbers", () => {
			const phone = "+44 20 1234 5678";
			const result = normalizePhoneNumber(phone);
			expect(result).toBe("+442012345678");
		});

		it("should handle short numbers", () => {
			const phone = "123";
			const result = normalizePhoneNumber(phone);
			expect(result).toBe("123");
		});
	});

	describe("phoneNumbersMatch", () => {
		it("should match identical normalized numbers", () => {
			const phone1 = "+11234567890";
			const phone2 = "+11234567890";
			expect(phoneNumbersMatch(phone1, phone2)).toBe(true);
		});

		it("should match numbers with different formatting", () => {
			const phone1 = "+1 (123) 456-7890";
			const phone2 = "1234567890";
			expect(phoneNumbersMatch(phone1, phone2)).toBe(true);
		});

		it("should match numbers without country code", () => {
			const phone1 = "1234567890";
			const phone2 = "+11234567890";
			expect(phoneNumbersMatch(phone1, phone2)).toBe(true);
		});

		it("should not match different numbers", () => {
			const phone1 = "+11234567890";
			const phone2 = "+19876543210";
			expect(phoneNumbersMatch(phone1, phone2)).toBe(false);
		});

		it("should handle international numbers", () => {
			const phone1 = "+447911123456";
			const phone2 = "+44 7911 123456";
			expect(phoneNumbersMatch(phone1, phone2)).toBe(true);
		});
	});

	describe("formatFullName", () => {
		it("should format full name with all components", () => {
			const result = formatFullName("John", "Michael", "Doe", null);
			expect(result).toBe("John Michael Doe");
		});

		it("should handle missing middle name", () => {
			const result = formatFullName("John", null, "Doe", null);
			expect(result).toBe("John Doe");
		});

		it("should handle missing last name", () => {
			const result = formatFullName("John", null, null, null);
			expect(result).toBe("John");
		});

		it("should handle missing first name", () => {
			const result = formatFullName(null, null, "Doe", null);
			expect(result).toBe("Doe");
		});

		it("should fall back to organization when no name parts", () => {
			const result = formatFullName(null, null, null, "Apple Inc.");
			expect(result).toBe("Apple Inc.");
		});

		it("should return 'Unknown Contact' when all parts are null", () => {
			const result = formatFullName(null, null, null, null);
			expect(result).toBe("Unknown Contact");
		});

		it("should handle empty strings", () => {
			const result = formatFullName("", "", "", null);
			expect(result).toBe("Unknown Contact");
		});

		it("should trim whitespace", () => {
			const result = formatFullName("  John  ", null, "  Doe  ", null);
			expect(result).toBe("John Doe");
		});

		it("should prefer name over organization", () => {
			const result = formatFullName("John", null, "Doe", "Apple Inc.");
			expect(result).toBe("John Doe");
		});
	});

	describe("normalizeLabel", () => {
		it("should normalize mobile label", () => {
			const result = normalizeLabel("_$!<mobile>!$_");
			expect(result).toBe("mobile");
		});

		it("should normalize home label", () => {
			const result = normalizeLabel("_$!<home>!$_");
			expect(result).toBe("home");
		});

		it("should normalize work label", () => {
			const result = normalizeLabel("_$!<work>!$_");
			expect(result).toBe("work");
		});

		it("should normalize iPhone label", () => {
			const result = normalizeLabel("_$!<iphone>!$_");
			expect(result).toBe("iPhone");
		});

		it("should normalize other label", () => {
			const result = normalizeLabel("_$!<other>!$_");
			expect(result).toBe("other");
		});

		it("should return null for null input", () => {
			const result = normalizeLabel(null);
			expect(result).toBeNull();
		});

		it("should return original label if not in map", () => {
			const result = normalizeLabel("custom-label");
			expect(result).toBe("custom-label");
		});

		it("should handle case insensitivity", () => {
			const result = normalizeLabel("_$!<MOBILE>!$_");
			expect(result).toBe("mobile");
		});

		it("should normalize fax labels", () => {
			expect(normalizeLabel("_$!<homefax>!$_")).toBe("home fax");
			expect(normalizeLabel("_$!<workfax>!$_")).toBe("work fax");
			expect(normalizeLabel("_$!<otherfax>!$_")).toBe("other fax");
		});

		it("should normalize pager label", () => {
			const result = normalizeLabel("_$!<pager>!$_");
			expect(result).toBe("pager");
		});

		it("should normalize main label", () => {
			const result = normalizeLabel("_$!<main>!$_");
			expect(result).toBe("main");
		});
	});

	describe("getDefaultDatabasePath", () => {
		it("should return a path to AddressBook database", () => {
			const path = getDefaultDatabasePath();
			expect(path).toContain("Library/Application Support/AddressBook");
		});

		it("should include a database file name", () => {
			const path = getDefaultDatabasePath();
			expect(path).toMatch(/\.abcddb$|\.sqlitedb$/);
		});

		it("should return a non-empty string", () => {
			const path = getDefaultDatabasePath();
			expect(path.length).toBeGreaterThan(0);
		});
	});

	describe("validateDatabasePath", () => {
		it("should return false for non-existent path", () => {
			const result = validateDatabasePath(
				"/nonexistent/path/to/AddressBook.db",
			);
			expect(result).toBe(false);
		});

		it("should return false for empty string", () => {
			const result = validateDatabasePath("");
			expect(result).toBe(false);
		});

		it("should handle paths with special characters", () => {
			const result = validateDatabasePath("/path/with spaces/AddressBook.db");
			expect(result).toBe(false); // Assuming it doesn't exist
		});

		// Note: Testing for true case would require an actual database file
		// which may not be available in CI/CD environments
	});
});
