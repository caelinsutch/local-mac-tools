import { describe, it, expect, beforeEach, vi } from "vitest";
import { IMessageClient } from "../src/client";
import type { Message, Handle, Chat } from "../src/types";

// Mock better-sqlite3
vi.mock("better-sqlite3", () => {
	const mockDb = {
		prepare: vi.fn(),
		close: vi.fn(),
	};

	const Database = vi.fn(() => mockDb);
	Database.prototype = mockDb;

	return { default: Database };
});

// Mock utils
vi.mock("../src/utils", () => ({
	getDefaultDatabasePath: vi.fn(() => "/mock/path/to/chat.db"),
	validateDatabasePath: vi.fn(() => true),
	appleTimeToDate: vi.fn((timestamp: number) => {
		const APPLE_EPOCH = 978307200;
		const seconds = timestamp / 1000000000;
		const unixTimestamp = seconds + APPLE_EPOCH;
		return new Date(unixTimestamp * 1000);
	}),
	dateToAppleTime: vi.fn((date: Date) => {
		const APPLE_EPOCH = 978307200;
		const unixTimestamp = Math.floor(date.getTime() / 1000);
		const seconds = unixTimestamp - APPLE_EPOCH;
		return seconds * 1000000000;
	}),
	parseAttributedBody: vi.fn(() => null),
	isGroupChat: vi.fn((id: string) => id.startsWith("chat")),
	formatHandle: vi.fn((id: string) => id),
}));

describe("IMessageClient", () => {
	describe("constructor", () => {
		it("should initialize with default config", async () => {
			expect(() => new IMessageClient()).not.toThrow();
		});

		it("should accept custom database path", async () => {
			const config = { databasePath: "/custom/path/chat.db" };
			expect(() => new IMessageClient(config)).not.toThrow();
		});

		it("should throw error if database path is invalid", async () => {
			const { validateDatabasePath } = await import("../src/utils");
			vi.mocked(validateDatabasePath).mockReturnValueOnce(false);

			expect(() => new IMessageClient()).toThrow(
				"iMessage database not found",
			);
		});
	});

	describe("getMessages", () => {
		it("should return empty array when no messages exist", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				all: vi.fn(() => []),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const messages = client.getMessages();

			expect(messages).toEqual([]);
			expect(mockPrepare).toHaveBeenCalled();
		});

		it("should filter messages by chatId", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockAll = vi.fn(() => []);
			const mockPrepare = vi.fn(() => ({ all: mockAll }));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			client.getMessages({ chatId: 123 });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("chat_message_join");
			expect(mockAll).toHaveBeenCalledWith(123);
		});

		it("should filter messages by isFromMe", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockAll = vi.fn(() => []);
			const mockPrepare = vi.fn(() => ({ all: mockAll }));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			client.getMessages({ isFromMe: true });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("is_from_me");
			expect(mockAll).toHaveBeenCalledWith(1);
		});

		it("should apply limit and offset", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockAll = vi.fn(() => []);
			const mockPrepare = vi.fn(() => ({ all: mockAll }));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			client.getMessages({ limit: 50, offset: 100 });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("LIMIT");
			expect(query).toContain("OFFSET");
			expect(mockAll).toHaveBeenCalledWith(50, 100);
		});

		it("should search messages by text", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockAll = vi.fn(() => []);
			const mockPrepare = vi.fn(() => ({ all: mockAll }));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			client.getMessages({ searchText: "hello" });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("LIKE");
			expect(mockAll).toHaveBeenCalledWith("%hello%");
		});
	});

	describe("getMessageById", () => {
		it("should return null when message not found", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				get: vi.fn(() => undefined),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const message = client.getMessageById(999);

			expect(message).toBeNull();
		});

		it("should return message when found", async () => {
			const mockMessage = {
				ROWID: 1,
				guid: "test-guid",
				text: "Test message",
				handle_id: 1,
				service: "iMessage",
				date: 0,
				is_from_me: 1,
			};

			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				get: vi.fn(() => mockMessage),
				all: vi.fn(() => []), // For attachments
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const message = client.getMessageById(1);

			expect(message).toBeDefined();
			expect(message?.ROWID).toBe(1);
		});
	});

	describe("getChats", () => {
		it("should return all chats without filter", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				all: vi.fn(() => []),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const chats = client.getChats();

			expect(chats).toEqual([]);
			expect(mockPrepare).toHaveBeenCalled();
		});

		it("should filter by group chat", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockAll = vi.fn(() => []);
			const mockPrepare = vi.fn(() => ({ all: mockAll }));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			client.getChats({ isGroup: true });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("chat_identifier LIKE 'chat%'");
		});

		it("should filter by display name", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockAll = vi.fn(() => []);
			const mockPrepare = vi.fn(() => ({ all: mockAll }));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			client.getChats({ displayName: "John" });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("display_name LIKE");
			expect(mockAll).toHaveBeenCalledWith("%John%");
		});
	});

	describe("getChatById", () => {
		it("should return null when chat not found", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				get: vi.fn(() => undefined),
				all: vi.fn(() => []),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const chat = client.getChatById(999);

			expect(chat).toBeNull();
		});

		it("should return chat with participants when found", async () => {
			const mockChat: Chat = {
				ROWID: 1,
				guid: "test-guid",
				style: 0,
				state: 0,
				account_id: "test",
				chat_identifier: "test-chat",
				service_name: "iMessage",
				room_name: null,
				account_login: null,
				display_name: "Test Chat",
				group_id: null,
				is_archived: 0,
				last_addressed_handle: null,
				is_filtered: 0,
			};

			const mockParticipants: Handle[] = [
				{
					ROWID: 1,
					id: "+11234567890",
					country: "us",
					service: "iMessage",
					uncanonicalized_id: null,
				},
			];

			const Database = (await import("better-sqlite3")).default;
			let callCount = 0;
			const mockPrepare = vi.fn(() => ({
				get: vi.fn(() => mockChat),
				all: vi.fn(() => {
					callCount++;
					return callCount === 1 ? mockParticipants : [];
				}),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const chat = client.getChatById(1);

			expect(chat).toBeDefined();
			expect(chat?.ROWID).toBe(1);
			expect(chat?.participants).toHaveLength(1);
		});
	});

	describe("getHandles", () => {
		it("should return all handles", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				all: vi.fn(() => []),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const handles = client.getHandles();

			expect(handles).toEqual([]);
			expect(mockPrepare).toHaveBeenCalled();
		});
	});

	describe("searchHandles", () => {
		it("should search handles by term", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockAll = vi.fn(() => []);
			const mockPrepare = vi.fn(() => ({ all: mockAll }));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			client.searchHandles("123");

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("LIKE");
			expect(mockAll).toHaveBeenCalledWith("%123%", "%123%");
		});
	});

	describe("getConversationStats", () => {
		it("should return statistics for all messages", async () => {
			const mockStats = {
				total: 100,
				sent: 60,
				received: 40,
				first_date: 0,
				last_date: 1000000000000000,
			};

			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				get: vi.fn(() => mockStats),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const stats = client.getConversationStats();

			expect(stats.totalMessages).toBe(100);
			expect(stats.sentMessages).toBe(60);
			expect(stats.receivedMessages).toBe(40);
			expect(stats.firstMessageDate).toBeInstanceOf(Date);
			expect(stats.lastMessageDate).toBeInstanceOf(Date);
		});

		it("should handle null dates", async () => {
			const mockStats = {
				total: 0,
				sent: 0,
				received: 0,
				first_date: null,
				last_date: null,
			};

			const Database = (await import("better-sqlite3")).default;
			const mockPrepare = vi.fn(() => ({
				get: vi.fn(() => mockStats),
			}));
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: mockPrepare,
						close: vi.fn(),
					}) as any,
			);

			const client = new IMessageClient();
			const stats = client.getConversationStats();

			expect(stats.totalMessages).toBe(0);
			expect(stats.firstMessageDate).toBeNull();
			expect(stats.lastMessageDate).toBeNull();
		});
	});

	describe("close", () => {
		it("should close the database connection", async () => {
			const Database = (await import("better-sqlite3")).default;
			const mockClose = vi.fn();
			vi.mocked(Database).mockImplementation(
				() =>
					({
						prepare: vi.fn(),
						close: mockClose,
					}) as any,
			);

			const client = new IMessageClient();
			client.close();

			expect(mockClose).toHaveBeenCalled();
		});
	});
});
