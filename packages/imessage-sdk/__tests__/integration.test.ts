import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IMessageClient } from "../src/client";
import { getDefaultDatabasePath, validateDatabasePath } from "../src/utils";

/**
 * Integration tests that run against the actual iMessage database
 *
 * These tests require:
 * - macOS with iMessage enabled
 * - Full Disk Access permission
 * - At least some message history
 *
 * Tests will be skipped if the database is not accessible
 */

describe("Integration Tests", () => {
	let client: IMessageClient | null = null;
	let isDatabaseAvailable = false;

	beforeAll(() => {
		const dbPath = getDefaultDatabasePath();
		isDatabaseAvailable = validateDatabasePath(dbPath);

		if (isDatabaseAvailable) {
			try {
				client = new IMessageClient();
			} catch (error) {
				console.warn("Failed to initialize client:", error);
				isDatabaseAvailable = false;
			}
		}

		if (!isDatabaseAvailable) {
			console.warn(
				"\n⚠️  Integration tests skipped: iMessage database not accessible",
			);
			console.warn(
				"   Make sure you have Full Disk Access enabled for your terminal/IDE\n",
			);
		}
	});

	afterAll(() => {
		if (client) {
			client.close();
		}
	});

	describe("Database Connection", () => {
		it("should connect to the iMessage database", () => {
			if (!isDatabaseAvailable) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			expect(client).not.toBeNull();
		});

		it("should validate database path exists", () => {
			if (!isDatabaseAvailable) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const dbPath = getDefaultDatabasePath();
			expect(validateDatabasePath(dbPath)).toBe(true);
		});
	});

	describe("Get Messages", () => {
		it("should fetch messages from the database", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const messages = client.getMessages({ limit: 10 });

			expect(Array.isArray(messages)).toBe(true);
			expect(messages.length).toBeLessThanOrEqual(10);

			if (messages.length > 0) {
				const message = messages[0];
				expect(message).toHaveProperty("ROWID");
				expect(message).toHaveProperty("guid");
				expect(message).toHaveProperty("date");
				expect(typeof message.ROWID).toBe("number");
				expect(typeof message.guid).toBe("string");
			}
		});

		it("should filter messages by isFromMe", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const sentMessages = client.getMessages({ isFromMe: true, limit: 5 });
			const receivedMessages = client.getMessages({
				isFromMe: false,
				limit: 5,
			});

			expect(Array.isArray(sentMessages)).toBe(true);
			expect(Array.isArray(receivedMessages)).toBe(true);

			for (const msg of sentMessages) {
				expect(msg.is_from_me).toBe(1);
			}

			for (const msg of receivedMessages) {
				expect(msg.is_from_me).toBe(0);
			}
		});

		it("should include attachments in enriched messages", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const messages = client.getMessages({ limit: 100 });

			// Check that attachments property exists
			for (const msg of messages) {
				expect(msg).toHaveProperty("attachments");
				expect(Array.isArray(msg.attachments)).toBe(true);
			}

			// If any message has attachments, validate structure
			const messagesWithAttachments = messages.filter(
				(m) => m.attachments && m.attachments.length > 0,
			);

			if (messagesWithAttachments.length > 0) {
				const attachment = messagesWithAttachments[0].attachments?.[0];
				expect(attachment).toHaveProperty("ROWID");
				expect(attachment).toHaveProperty("guid");
			}
		});

		it("should search messages by text", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			// Try to search for common word "the"
			const results = client.getMessages({ searchText: "the", limit: 10 });

			expect(Array.isArray(results)).toBe(true);

			for (const msg of results) {
				if (msg.text) {
					expect(msg.text.toLowerCase()).toContain("the");
				}
			}
		});
	});

	describe("Get Chats", () => {
		it("should fetch chats from the database", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const chats = client.getChats({ limit: 10 });

			expect(Array.isArray(chats)).toBe(true);
			expect(chats.length).toBeLessThanOrEqual(10);

			if (chats.length > 0) {
				const chat = chats[0];
				expect(chat).toHaveProperty("ROWID");
				expect(chat).toHaveProperty("guid");
				expect(chat).toHaveProperty("chat_identifier");
				expect(typeof chat.ROWID).toBe("number");
			}
		});

		it("should get recent chats with participants", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const recentChats = client.getRecentChats(5);

			expect(Array.isArray(recentChats)).toBe(true);
			expect(recentChats.length).toBeLessThanOrEqual(5);

			for (const chat of recentChats) {
				expect(chat).toHaveProperty("participants");
				expect(Array.isArray(chat.participants)).toBe(true);
				expect(chat.participants.length).toBeGreaterThan(0);
			}
		});

		it("should get chat by ID with participants", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const chats = client.getChats({ limit: 1 });

			if (chats.length > 0) {
				const chatId = chats[0].ROWID;
				const chat = client.getChatById(chatId);

				expect(chat).not.toBeNull();
				expect(chat?.participants).toBeDefined();
				expect(Array.isArray(chat?.participants)).toBe(true);
			}
		});

		it("should filter group chats", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const groupChats = client.getChats({ isGroup: true, limit: 10 });
			const individualChats = client.getChats({ isGroup: false, limit: 10 });

			expect(Array.isArray(groupChats)).toBe(true);
			expect(Array.isArray(individualChats)).toBe(true);

			for (const chat of groupChats) {
				expect(chat.chat_identifier).toMatch(/^chat/);
			}

			for (const chat of individualChats) {
				expect(chat.chat_identifier).not.toMatch(/^chat/);
			}
		});
	});

	describe("Get Handles", () => {
		it("should fetch handles from the database", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const handles = client.getHandles();

			expect(Array.isArray(handles)).toBe(true);
			expect(handles.length).toBeGreaterThan(0);

			if (handles.length > 0) {
				const handle = handles[0];
				expect(handle).toHaveProperty("ROWID");
				expect(handle).toHaveProperty("id");
				expect(handle).toHaveProperty("service");
				expect(typeof handle.id).toBe("string");
			}
		});

		it("should search handles", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const allHandles = client.getHandles();

			if (allHandles.length > 0) {
				// Search for part of a known handle
				const searchTerm = allHandles[0].id.substring(0, 3);
				const results = client.searchHandles(searchTerm);

				expect(Array.isArray(results)).toBe(true);
				expect(results.length).toBeGreaterThan(0);

				for (const handle of results) {
					expect(
						handle.id.toLowerCase().includes(searchTerm.toLowerCase()),
					).toBe(true);
				}
			}
		});
	});

	describe("Get Conversation Stats", () => {
		it("should get overall statistics", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const stats = client.getConversationStats();

			expect(stats).toHaveProperty("totalMessages");
			expect(stats).toHaveProperty("sentMessages");
			expect(stats).toHaveProperty("receivedMessages");
			expect(stats).toHaveProperty("firstMessageDate");
			expect(stats).toHaveProperty("lastMessageDate");

			expect(typeof stats.totalMessages).toBe("number");
			expect(typeof stats.sentMessages).toBe("number");
			expect(typeof stats.receivedMessages).toBe("number");

			expect(stats.totalMessages).toBeGreaterThanOrEqual(0);
			expect(stats.sentMessages).toBeGreaterThanOrEqual(0);
			expect(stats.receivedMessages).toBeGreaterThanOrEqual(0);

			if (stats.totalMessages > 0) {
				expect(stats.sentMessages + stats.receivedMessages).toBe(
					stats.totalMessages,
				);
				expect(stats.firstMessageDate).toBeInstanceOf(Date);
				expect(stats.lastMessageDate).toBeInstanceOf(Date);
			}
		});

		it("should get statistics for a specific chat", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const chats = client.getChats({ limit: 1 });

			if (chats.length > 0) {
				const chatId = chats[0].ROWID;
				const stats = client.getConversationStats(chatId);

				expect(stats).toHaveProperty("totalMessages");
				expect(typeof stats.totalMessages).toBe("number");
				expect(stats.totalMessages).toBeGreaterThanOrEqual(0);
			}
		});
	});

	describe("Messages for Chat", () => {
		it("should get messages for a specific chat", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const chats = client.getChats({ limit: 1 });

			if (chats.length > 0) {
				const chatId = chats[0].ROWID;
				const messages = client.getMessagesForChat(chatId, 10);

				expect(Array.isArray(messages)).toBe(true);
				expect(messages.length).toBeLessThanOrEqual(10);
			}
		});
	});

	describe("Contact/Participant Methods", () => {
		it("should get handle by identifier", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const allHandles = client.getHandles();

			if (allHandles.length > 0) {
				const testHandle = allHandles[0];
				const found = client.getHandleByIdentifier(testHandle.id);

				expect(found).not.toBeNull();
				expect(found?.id).toBe(testHandle.id);
			}
		});

		it("should get chats for a handle", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const allHandles = client.getHandles();

			if (allHandles.length > 0) {
				const testHandle = allHandles[0];
				const chats = client.getChatsForHandle(testHandle.ROWID);

				expect(Array.isArray(chats)).toBe(true);

				for (const chat of chats) {
					expect(chat).toHaveProperty("participants");
					expect(Array.isArray(chat.participants)).toBe(true);
				}
			}
		});

		it("should get message count for handle", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const allHandles = client.getHandles();

			if (allHandles.length > 0) {
				const testHandle = allHandles[0];
				const stats = client.getMessageCountForHandle(testHandle.ROWID);

				expect(stats).toHaveProperty("total");
				expect(stats).toHaveProperty("sent");
				expect(stats).toHaveProperty("received");
				expect(typeof stats.total).toBe("number");
				expect(stats.total).toBeGreaterThanOrEqual(0);
				expect(stats.sent + stats.received).toBe(stats.total);
			}
		});

		it("should get participants for chat", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const chats = client.getChats({ limit: 1 });

			if (chats.length > 0) {
				const participants = client.getParticipantsForChat(chats[0].ROWID);

				expect(Array.isArray(participants)).toBe(true);
				expect(participants.length).toBeGreaterThan(0);

				for (const participant of participants) {
					expect(participant).toHaveProperty("ROWID");
					expect(participant).toHaveProperty("id");
					expect(typeof participant.id).toBe("string");
				}
			}
		});
	});

	describe("Performance", () => {
		it("should handle large queries efficiently", () => {
			if (!isDatabaseAvailable || !client) {
				return expect(isDatabaseAvailable).toBe(false);
			}

			const startTime = Date.now();
			const messages = client.getMessages({ limit: 1000 });
			const endTime = Date.now();

			const duration = endTime - startTime;

			expect(Array.isArray(messages)).toBe(true);
			expect(messages.length).toBeLessThanOrEqual(1000);
			// Query should complete in reasonable time (under 5 seconds)
			expect(duration).toBeLessThan(5000);
		});
	});
});
