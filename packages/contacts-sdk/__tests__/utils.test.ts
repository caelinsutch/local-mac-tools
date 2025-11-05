import { describe, expect, it } from "vitest";
import { parseDelimitedResult } from "../src/utils";

describe("parseDelimitedResult", () => {
	it("should parse empty result", () => {
		const result = parseDelimitedResult("[]", ([name, phone]) =>
			name && phone ? { name, phone } : null,
		);

		expect(result).toEqual([]);
	});

	it("should parse single item", () => {
		const result = parseDelimitedResult("John Doe|555-1234", ([name, phone]) =>
			name && phone ? { name, phone } : null,
		);

		expect(result).toEqual([{ name: "John Doe", phone: "555-1234" }]);
	});

	it("should parse multiple items", () => {
		const result = parseDelimitedResult(
			"John Doe|555-1234;Jane Smith|555-5678;Bob Johnson|555-9012",
			([name, phone]) => (name && phone ? { name, phone } : null),
		);

		expect(result).toEqual([
			{ name: "John Doe", phone: "555-1234" },
			{ name: "Jane Smith", phone: "555-5678" },
			{ name: "Bob Johnson", phone: "555-9012" },
		]);
	});

	it("should filter out invalid items", () => {
		const result = parseDelimitedResult(
			"John Doe|555-1234;Invalid;Jane Smith|555-5678",
			([name, phone]) => (name && phone ? { name, phone } : null),
		);

		expect(result).toEqual([
			{ name: "John Doe", phone: "555-1234" },
			{ name: "Jane Smith", phone: "555-5678" },
		]);
	});

	it("should handle custom delimiters", () => {
		const result = parseDelimitedResult(
			"John Doe:555-1234,Jane Smith:555-5678",
			([name, phone]) => (name && phone ? { name, phone } : null),
			",",
			":",
		);

		expect(result).toEqual([
			{ name: "John Doe", phone: "555-1234" },
			{ name: "Jane Smith", phone: "555-5678" },
		]);
	});

	it("should handle items with more than two parts", () => {
		const result = parseDelimitedResult(
			"John|Doe|555-1234;Jane|Smith|555-5678",
			([first, last, phone]) =>
				first && last && phone ? { name: `${first} ${last}`, phone } : null,
		);

		expect(result).toEqual([
			{ name: "John Doe", phone: "555-1234" },
			{ name: "Jane Smith", phone: "555-5678" },
		]);
	});

	it("should handle parser returning different types", () => {
		const result = parseDelimitedResult(
			"apple|5;banana|3;orange|7",
			([fruit, count]) =>
				fruit && count ? { fruit, count: Number.parseInt(count, 10) } : null,
		);

		expect(result).toEqual([
			{ fruit: "apple", count: 5 },
			{ fruit: "banana", count: 3 },
			{ fruit: "orange", count: 7 },
		]);
	});

	it("should handle empty strings in parts", () => {
		const result = parseDelimitedResult(
			"John Doe|;|555-1234;Jane Smith|555-5678",
			([name, phone]) => (name && phone ? { name, phone } : null),
		);

		expect(result).toEqual([{ name: "Jane Smith", phone: "555-5678" }]);
	});

	it("should handle trailing delimiters", () => {
		const result = parseDelimitedResult(
			"John Doe|555-1234;Jane Smith|555-5678;",
			([name, phone]) => (name && phone ? { name, phone } : null),
		);

		expect(result).toEqual([
			{ name: "John Doe", phone: "555-1234" },
			{ name: "Jane Smith", phone: "555-5678" },
		]);
	});
});
