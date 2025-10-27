/**
 * Basic usage example for iMessage SDK
 *
 * This example demonstrates the core functionality of the SDK.
 * Run with: ts-node examples/basic-usage.ts
 */

import { appleTimeToDate, IMessageClient } from "../src";

async function main() {
	console.log("iMessage SDK - Basic Usage Example\n");
	console.log("===================================\n");

	try {
		// Initialize the client
		const client = new IMessageClient();
		console.log("✓ Connected to iMessage database\n");

		// Get overall statistics
		console.log("📊 Overall Statistics:");
		console.log("---------------------");
		const stats = client.getConversationStats();
		console.log(`Total messages: ${stats.totalMessages}`);
		console.log(`Sent: ${stats.sentMessages}`);
		console.log(`Received: ${stats.receivedMessages}`);
		if (stats.firstMessageDate) {
			console.log(
				`First message: ${stats.firstMessageDate.toLocaleDateString()}`,
			);
		}
		if (stats.lastMessageDate) {
			console.log(
				`Last message: ${stats.lastMessageDate.toLocaleDateString()}`,
			);
		}
		console.log();

		// Get recent chats
		console.log("💬 Recent Chats (Last 5):");
		console.log("--------------------------");
		const recentChats = client.getRecentChats(5);
		for (const chat of recentChats) {
			const displayName =
				chat.display_name ||
				chat.participants.map((p) => p.id).join(", ") ||
				"Unknown";
			console.log(`- ${displayName}`);
			if (chat.lastMessage) {
				const lastMessageDate = appleTimeToDate(chat.lastMessage.date);
				console.log(`  Last message: ${lastMessageDate.toLocaleString()}`);
			}
		}
		console.log();

		// Get recent messages
		console.log("📨 Recent Messages (Last 10):");
		console.log("-----------------------------");
		const messages = client.getMessages({ limit: 10 });
		for (const msg of messages) {
			const date = appleTimeToDate(msg.date);
			const sender = msg.is_from_me ? "Me" : msg.handle?.id || "Unknown";
			const text = msg.text ? msg.text.substring(0, 50) : "[No text]";
			console.log(`[${date.toLocaleString()}] ${sender}: ${text}`);
		}
		console.log();

		// Search example
		console.log("🔍 Search Example (searching for 'hello'):");
		console.log("------------------------------------------");
		const searchResults = client.getMessages({
			searchText: "hello",
			limit: 5,
		});
		console.log(`Found ${searchResults.length} messages`);
		for (const msg of searchResults) {
			const date = appleTimeToDate(msg.date);
			const sender = msg.is_from_me ? "Me" : msg.handle?.id || "Unknown";
			console.log(`[${date.toLocaleString()}] ${sender}: ${msg.text}`);
		}
		console.log();

		// Get group chats
		console.log("👥 Group Chats:");
		console.log("---------------");
		const groupChats = client.getChats({ isGroup: true, limit: 5 });
		console.log(`Found ${groupChats.length} group chats`);
		for (const chat of groupChats) {
			const chatData = client.getChatById(chat.ROWID);
			if (chatData) {
				console.log(
					`- ${chatData.display_name || "Unnamed Group"} (${chatData.participants.length} participants)`,
				);
			}
		}
		console.log();

		// Close the connection
		client.close();
		console.log("✓ Connection closed");
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		console.error(
			"\nMake sure you have granted Full Disk Access to your terminal!",
		);
		process.exit(1);
	}
}

main();
