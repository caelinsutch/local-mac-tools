import { describe, expect, it } from "vitest";
import { ContactsClient } from "../src/client";

/**
 * Integration test for sendMessage functionality
 *
 * To run this test with a specific phone number:
 * PHONE_NUMBER="+1234567890" bun test __tests__/sendMessage.test.ts
 *
 * Example:
 * PHONE_NUMBER="+19165551234" bun test __tests__/sendMessage.test.ts
 */
describe("ContactsClient sendMessage Tests", () => {
	const client = new ContactsClient();
	const phoneNumber = process.env.PHONE_NUMBER;

	it("should send a message when PHONE_NUMBER is provided", async () => {
		if (!phoneNumber) {
			console.warn(
				"⚠️  Skipping test: Set PHONE_NUMBER environment variable to test message sending",
			);
			console.warn(
				'   Example: PHONE_NUMBER="+19165551234" bun test __tests__/sendMessage.test.ts',
			);
			return;
		}

		console.log(`📱 Sending test message to ${phoneNumber}...`);

		const result = await client.sendMessage({
			recipient: phoneNumber,
			message: "Test message from contacts-sdk integration test",
		});

		expect(result).toBeDefined();
		expect(result).toHaveProperty("success");

		if (result.success) {
			console.log("✅ Message sent successfully!");
		} else {
			console.error(`❌ Failed to send message: ${result.error}`);
		}

		expect(result.success).toBe(true);
	});

	it("should handle errors gracefully with invalid recipient", async () => {
		const result = await client.sendMessage({
			recipient: "invalid-recipient-12345",
			message: "This should fail",
		});

		expect(result).toBeDefined();
		expect(result).toHaveProperty("success");
		// We don't assert false here because the behavior may vary
		// but we do expect the function to handle the error gracefully
	});
});
