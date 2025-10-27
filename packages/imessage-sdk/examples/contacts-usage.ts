/**
 * Contact and participant usage examples
 *
 * This example shows how to work with contacts and conversation participants.
 * Run with: ts-node examples/contacts-usage.ts
 */

import { IMessageClient } from "../src";

async function main() {
	console.log("iMessage SDK - Contact & Participant Examples\n");
	console.log("==============================================\n");

	try {
		const client = new IMessageClient();

		// Example 1: Get all contacts/handles
		console.log("📇 All Contacts:");
		console.log("----------------");
		const allHandles = client.getHandles();
		console.log(`Found ${allHandles.length} contacts\n`);

		// Show first 5 contacts
		const topContacts = allHandles.slice(0, 5);
		for (const handle of topContacts) {
			console.log(`- ${handle.id} (${handle.service})`);
		}
		console.log();

		// Example 2: Search for a specific contact
		if (allHandles.length > 0) {
			console.log("🔍 Search for Contact:");
			console.log("----------------------");
			const searchTerm = allHandles[0].id.substring(0, 3);
			const results = client.searchHandles(searchTerm);
			console.log(`Searching for "${searchTerm}": ${results.length} results`);
			for (const handle of results.slice(0, 3)) {
				console.log(`- ${handle.id}`);
			}
			console.log();
		}

		// Example 3: Get chats with participants
		console.log("💬 Recent Chats with Participants:");
		console.log("----------------------------------");
		const recentChats = client.getRecentChats(5);

		for (const chat of recentChats) {
			const displayName =
				chat.display_name || chat.chat_identifier.substring(0, 30);
			console.log(`\nChat: ${displayName}`);
			console.log(`Participants (${chat.participants.length}):`);

			for (const participant of chat.participants) {
				console.log(`  - ${participant.id} (${participant.service})`);
			}

			// Get message count for this chat
			const stats = client.getConversationStats(chat.ROWID);
			console.log(
				`  Messages: ${stats.totalMessages} (${stats.sentMessages} sent, ${stats.receivedMessages} received)`,
			);
		}
		console.log();

		// Example 4: Get all chats for a specific contact
		if (allHandles.length > 0) {
			console.log("👤 Chats for a Specific Contact:");
			console.log("---------------------------------");
			const contact = allHandles[0];
			console.log(`Contact: ${contact.id}\n`);

			const chatsForContact = client.getChatsForHandle(contact.ROWID);
			console.log(`This contact is in ${chatsForContact.length} chats:`);

			for (const chat of chatsForContact.slice(0, 5)) {
				const chatName =
					chat.display_name ||
					chat.participants
						.filter((p) => p.ROWID !== contact.ROWID)
						.map((p) => p.id)
						.join(", ") ||
					"Direct Chat";

				console.log(`  - ${chatName}`);
				console.log(`    Participants: ${chat.participants.length}`);
			}
			console.log();
		}

		// Example 5: Get message statistics for a contact
		if (allHandles.length > 0) {
			console.log("📊 Message Statistics by Contact:");
			console.log("----------------------------------");

			// Get top 5 contacts by message count
			const contactStats: Array<{
				handle: string;
				total: number;
				sent: number;
				received: number;
			}> = [];

			for (const handle of allHandles.slice(0, 20)) {
				// Check first 20 for performance
				const stats = client.getMessageCountForHandle(handle.ROWID);
				if (stats.total > 0) {
					contactStats.push({
						handle: handle.id,
						...stats,
					});
				}
			}

			// Sort by total messages
			contactStats.sort((a, b) => b.total - a.total);

			console.log("Top 5 contacts by message count:\n");
			for (const stat of contactStats.slice(0, 5)) {
				console.log(`${stat.handle}:`);
				console.log(`  Total: ${stat.total} messages`);
				console.log(`  Sent: ${stat.sent}`);
				console.log(`  Received: ${stat.received}`);
				console.log();
			}
		}

		// Example 6: Group chats with participants
		console.log("👥 Group Chats:");
		console.log("---------------");
		const groupChats = client.getChats({ isGroup: true, limit: 5 });

		for (const chat of groupChats) {
			const participants = client.getParticipantsForChat(chat.ROWID);
			console.log(
				`\n${chat.display_name || "Unnamed Group"} (${participants.length} members):`,
			);

			for (const participant of participants) {
				console.log(`  - ${participant.id}`);
			}
		}
		console.log();

		// Example 7: Find contact by exact identifier
		if (allHandles.length > 0) {
			console.log("🎯 Find Contact by Exact Identifier:");
			console.log("------------------------------------");
			const exactId = allHandles[0].id;
			const found = client.getHandleByIdentifier(exactId);

			if (found) {
				console.log(`Found: ${found.id}`);
				console.log(`Service: ${found.service}`);
				console.log(`Country: ${found.country || "N/A"}`);

				// Get their chat participation
				const chats = client.getChatsForHandle(found.ROWID);
				console.log(`Active in ${chats.length} chats`);

				// Get message stats
				const stats = client.getMessageCountForHandle(found.ROWID);
				console.log(`Total messages: ${stats.total}`);
			}
			console.log();
		}

		client.close();
		console.log("✓ Done!");
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		console.error(
			"\nMake sure you have granted Full Disk Access to your terminal!",
		);
		process.exit(1);
	}
}

main();
