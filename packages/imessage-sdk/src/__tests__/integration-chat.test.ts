import { describe, expect, it } from "vitest";
import { IMessageClient } from "../client";
import { parseAttributedBody } from "../utils";

describe("Integration: Chat 2620 attributedBody parsing", () => {
	it("should retrieve and parse messages from chat 2620", () => {
		const client = new IMessageClient();

		// Get chat details
		const chat = client.getChatById(2620);
		expect(chat).not.toBeNull();

		if (!chat) {
			throw new Error("Chat 2620 not found");
		}

		console.log("\n📱 Chat 2620 Information:");
		console.log(`  ID: ${chat.ROWID}`);
		console.log(`  Identifier: ${chat.chat_identifier}`);
		console.log(`  Display Name: ${chat.display_name || "(none)"}`);
		console.log(`  Service: ${chat.service_name}`);

		// Get participants
		const participants = client.getParticipantsForChat(2620);
		expect(participants.length).toBeGreaterThan(0);

		console.log(`\n👥 Participants (${participants.length}):`);
		for (const p of participants) {
			console.log(`  - ${p.id}`);
		}

		// Get last 5 messages
		const messages = client.getMessagesForChat(2620, 5);
		expect(messages.length).toBeGreaterThan(0);

		console.log(`\n💬 Last ${messages.length} Messages:\n`);

		for (const msg of messages.reverse()) {
			const sender = msg.is_from_me ? "You" : msg.handle?.id || "Unknown";

			console.log("-".repeat(60));
			console.log(`From: ${sender}`);
			console.log(`Message ID: ${msg.ROWID}`);

			// Check if message has text
			if (msg.text) {
				console.log(`✓ Text extracted: "${msg.text}"`);
				expect(msg.text).toBeTruthy();
				expect(msg.text.trim().length).toBeGreaterThan(0);
			} else if (msg.attributedBody) {
				// If no text but has attributedBody, that's a problem
				console.log(
					`⚠️  No text but has attributedBody (${msg.attributedBody.length} bytes)`,
				);

				// Try parsing manually
				const parsed = parseAttributedBody(msg.attributedBody);
				if (parsed) {
					console.log(`  Manually parsed: "${parsed}"`);
				} else {
					console.log("  Failed to parse attributedBody");
					console.log(
						`  Raw preview: ${msg.attributedBody.toString("utf8").substring(0, 100)}`,
					);
				}

				// This should not happen - client should have parsed it
				expect.fail(
					"Message has attributedBody but text is null - client should have parsed it",
				);
			} else {
				console.log("ℹ️  No text content (might be media-only message)");
			}

			// Verify no weird characters in text
			if (msg.text) {
				const hasWeirdChars =
					msg.text.includes("��") ||
					msg.text.includes("__kIMMessagePartAttributeName") ||
					msg.text.includes("NSNumber");

				if (hasWeirdChars) {
					console.log(`❌ Contains unparsed binary data: "${msg.text}"`);
					expect.fail(
						`Message contains unparsed binary data: ${msg.text.substring(0, 50)}`,
					);
				}
			}
		}

		console.log("-".repeat(60));
		console.log("\n✅ All messages parsed successfully!\n");
	});

	it("should handle attributedBody parsing for all recent messages", () => {
		const client = new IMessageClient();

		// Get recent messages with attributedBody
		const messages = client.getMessages({ limit: 50 });

		let attributedBodyCount = 0;
		let parsedCount = 0;
		let failedCount = 0;

		for (const msg of messages) {
			// Skip if no attributedBody
			if (!msg.attributedBody) continue;

			attributedBodyCount++;

			// Check if text was extracted
			if (msg.text && msg.text.trim().length > 0) {
				parsedCount++;

				// Verify no weird characters
				const hasWeirdChars =
					msg.text.includes("��") ||
					msg.text.includes("__kIMMessagePartAttributeName") ||
					msg.text.includes("NSNumber");

				if (hasWeirdChars) {
					console.log(
						`Message ${msg.ROWID} has unparsed binary: ${msg.text.substring(0, 50)}`,
					);
					failedCount++;
				}
			} else {
				// No text extracted from attributedBody
				failedCount++;
			}
		}

		console.log("\n📊 AttributedBody Parsing Stats:");
		console.log(`  Total messages checked: ${messages.length}`);
		console.log(`  Messages with attributedBody: ${attributedBodyCount}`);
		console.log(`  Successfully parsed: ${parsedCount}`);
		console.log(`  Failed to parse: ${failedCount}`);

		if (attributedBodyCount > 0) {
			const successRate = (parsedCount / attributedBodyCount) * 100;
			console.log(`  Success rate: ${successRate.toFixed(1)}%\n`);

			// Expect at least 80% success rate
			expect(successRate).toBeGreaterThanOrEqual(80);
		}
	});
});
