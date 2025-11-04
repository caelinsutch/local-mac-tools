import { describe, expect, it } from "vitest";
import { ContactsClient } from "../src/client";

describe("ContactsClient Integration Tests", () => {
	const client = new ContactsClient();

	it("should search contacts by name", async () => {
		const results = await client.searchByName("Caelin");

		expect(Array.isArray(results)).toBe(true);

		if (results.length > 0) {
			expect(results[0]).toHaveProperty("name");
			expect(results[0]).toHaveProperty("phone");
			expect(typeof results[0].name).toBe("string");
			expect(typeof results[0].phone).toBe("string");
		}
	});

	it("should search contacts by phone number", async () => {
		const results = await client.searchByPhone("916");

		expect(Array.isArray(results)).toBe(true);

		if (results.length > 0) {
			expect(results[0]).toHaveProperty("name");
			expect(results[0]).toHaveProperty("phone");
			expect(typeof results[0].name).toBe("string");
			expect(typeof results[0].phone).toBe("string");
			expect(results[0].phone).toContain("916");
		}
	});

	it("should return empty array for non-existent name", async () => {
		const results = await client.searchByName(
			"ThisNameDefinitelyDoesNotExist123456",
		);

		expect(Array.isArray(results)).toBe(true);
		expect(results.length).toBe(0);
	});

	it("should return empty array for non-existent phone", async () => {
		const results = await client.searchByPhone("999999999999");

		expect(Array.isArray(results)).toBe(true);
		expect(results.length).toBe(0);
	});
});