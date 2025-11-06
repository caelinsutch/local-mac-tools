import { describe, expect, it } from "vitest";
import { parseAttributedBody } from "./utils";

describe("parseAttributedBody", () => {
	it("should return null for null input", () => {
		expect(parseAttributedBody(null)).toBe(null);
	});

	it("should return null for empty buffer", () => {
		expect(parseAttributedBody(Buffer.from(""))).toBe(null);
	});

	it("should parse NSAttributedString format with NSNumber marker", () => {
		// Simulate the format: ...NSString[6 chars]Hello World[12 chars]NSDictionary...NSNumber...
		const mockData =
			"prefix_NSString______Hello World____________NSDictionary_suffix_NSNumber_more";
		const buffer = Buffer.from(mockData, "utf8");

		const result = parseAttributedBody(buffer);
		expect(result).toBe("Hello World");
	});

	it("should handle complex attributed body from real iMessage", () => {
		// This simulates a real attributedBody structure
		const mockData =
			"__NSCFType__NSString\x00\x00\x00\x00\x00\x00Test message content\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00NSDictionary__kIMMessagePartAttributeName__NSNumber";
		const buffer = Buffer.from(mockData, "utf8");

		const result = parseAttributedBody(buffer);
		expect(result).not.toBeNull();
		expect(result?.length).toBeGreaterThan(0);
	});

	it("should handle messages without NSNumber marker (fallback to regex)", () => {
		// Test the fallback regex approach - needs actual null byte followed by text
		const mockData = "some_prefix_NSString\x00Simple text\x00more_data";
		const buffer = Buffer.from(mockData, "utf8");

		const result = parseAttributedBody(buffer);
		expect(result).toBe("Simple text");
	});

	it("should return null for malformed data", () => {
		const buffer = Buffer.from("random data without markers", "utf8");
		const result = parseAttributedBody(buffer);
		expect(result).toBe(null);
	});

	it("should handle UTF-8 encoded messages with special characters", () => {
		const mockData =
			"prefix_NSString______Hello 👋 World 🌍____________NSDictionary_suffix_NSNumber_more";
		const buffer = Buffer.from(mockData, "utf8");

		const result = parseAttributedBody(buffer);
		expect(result).toBe("Hello 👋 World 🌍");
	});

	it("should trim whitespace from extracted text", () => {
		const mockData =
			"prefix_NSString______  Hello World  ____________NSDictionary_suffix_NSNumber_more";
		const buffer = Buffer.from(mockData, "utf8");

		const result = parseAttributedBody(buffer);
		expect(result).toBe("Hello World");
	});
});
