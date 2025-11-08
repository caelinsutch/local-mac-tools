/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: For testing */
/**
 * Test script for chat ID 2620
 * Run with: tsx test-chat.ts
 */

import { IMessageClient } from "@macos-tools/imessage-sdk";

const client = new IMessageClient();

console.log("Testing Chat ID 2620\n");
console.log("=".repeat(80));

// Get chat details
const chat = client.getChatById(2620);
if (!chat) {
	console.error("❌ Chat 2620 not found!");
	process.exit(1);
}

console.log("\n📱 Chat Information:");
console.log(`  ID: ${chat.ROWID}`);
console.log(`  Identifier: ${chat.chat_identifier}`);
console.log(`  Display Name: ${chat.display_name || "(none)"}`);
console.log(`  Service: ${chat.service_name}`);
console.log(
	`  Style: ${chat.style} ${chat.style === 43 ? "(group)" : "(individual)"}`,
);

// Get participants
const participants = client.getParticipantsForChat(2620);
console.log("\n👥 Participants:");
for (const p of participants) {
	console.log(`  - ${p.id} (Handle ID: ${p.ROWID})`);
}

// Get last 5 messages
const messages = client.getMessagesForChat(2620, 5);
console.log(`\n💬 Last ${messages.length} Messages:\n`);

for (const msg of messages.reverse()) {
	const sender = msg.is_from_me ? "You" : msg.handle?.id || "Unknown";
	const date = new Date(msg.date / 1000000 + 978307200000);

	console.log("-".repeat(80));
	console.log(`From: ${sender}`);
	console.log(`Date: ${date.toISOString()}`);
	console.log(`Message ID: ${msg.ROWID}`);
	console.log(`Has text field: ${msg.text ? "✓" : "✗"}`);
	console.log(
		`Has attributedBody: ${msg.attributedBody ? "✓" : "✗"} ${msg.attributedBody ? `(${msg.attributedBody.length} bytes)` : ""}`,
	);

	if (msg.text) {
		console.log(`Text field: "${msg.text}"`);
	}

	if (msg.attributedBody && !msg.text) {
		console.log("\nAttributedBody (raw buffer preview - first 200 chars):");
		console.log(msg.attributedBody.toString("utf8").substring(0, 200));

		console.log("\nAttributedBody (hex preview - first 100 bytes):");
		console.log(msg.attributedBody.toString("hex").substring(0, 200));

		// Try parsing
		try {
			const { parseAttributedBody } = await import("@macos-tools/imessage-sdk");
			const parsed = parseAttributedBody(msg.attributedBody);
			console.log(`\nParsed text: "${parsed}"`);
		} catch (e) {
			console.log(`\nFailed to parse: ${e}`);
		}

		// Try our aggressive extraction
		try {
			const str = msg.attributedBody.toString("utf8");
			const cleaned = str.replace(
				/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g,
				"",
			);
			const matches = cleaned.match(/[a-zA-Z0-9\s.,!?'"()-]{3,}/g);
			if (matches && matches.length > 0) {
				console.log("\nExtracted text sequences:");
				for (const match of matches.slice(0, 5)) {
					// Show first 5 matches
					console.log(`  - "${match.trim()}"`);
				}
				const longest = matches.reduce((a, b) => (a.length > b.length ? a : b));
				console.log(`\nLongest sequence: "${longest.trim()}"`);
			}
		} catch (e) {
			console.log(`\nFailed to extract: ${e}`);
		}
	}

	console.log();
}

console.log("=".repeat(80));
console.log("\n✅ Test complete!");
