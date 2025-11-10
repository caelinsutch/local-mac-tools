import { describe, expect, it } from "vitest";
import { executeOSAScript, parseDelimitedResult } from "./index";

describe("parseDelimitedResult", () => {
	it("should parse empty array notation", () => {
		const result = parseDelimitedResult("[]", (parts) => parts[0]);
		expect(result).toEqual([]);
	});

	it("should parse delimited string with default delimiters", () => {
		const parser = (parts: string[]) => ({
			name: parts[0],
			value: parts[1],
		});

		const result = parseDelimitedResult("name1|value1;name2|value2", parser);

		expect(result).toEqual([
			{ name: "name1", value: "value1" },
			{ name: "name2", value: "value2" },
		]);
	});

	it("should parse delimited string with custom delimiters", () => {
		const parser = (parts: string[]) => ({
			name: parts[0],
			value: parts[1],
		});

		const result = parseDelimitedResult(
			"name1:value1,name2:value2",
			parser,
			",",
			":",
		);

		expect(result).toEqual([
			{ name: "name1", value: "value1" },
			{ name: "name2", value: "value2" },
		]);
	});

	it("should filter out null results from parser", () => {
		const parser = (parts: string[]) => {
			if (parts[0] === "skip") return null;
			return { name: parts[0], value: parts[1] };
		};

		const result = parseDelimitedResult(
			"name1|value1;skip|value2;name3|value3",
			parser,
		);

		expect(result).toEqual([
			{ name: "name1", value: "value1" },
			{ name: "name3", value: "value3" },
		]);
	});

	it("should handle single item", () => {
		const parser = (parts: string[]) => ({
			name: parts[0],
			value: parts[1],
		});

		const result = parseDelimitedResult("name1|value1", parser);

		expect(result).toEqual([{ name: "name1", value: "value1" }]);
	});
});

describe("executeOSAScript", () => {
	it("should execute simple AppleScript and return result", async () => {
		const script = 'return "Hello World"';
		const result = await executeOSAScript(script);
		expect(result).toBe("Hello World");
	});

	it("should execute AppleScript that returns numbers", async () => {
		const script = "return 42";
		const result = await executeOSAScript(script);
		expect(result).toBe("42");
	});

	it("should handle AppleScript errors", async () => {
		const script = 'error "Test error"';
		await expect(executeOSAScript(script)).rejects.toThrow();
	});

	it("should trim whitespace from results", async () => {
		const script = 'return "  trimmed  "';
		const result = await executeOSAScript(script);
		expect(result).toBe("trimmed");
	});
});
