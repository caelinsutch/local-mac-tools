import { IMessageClient } from "@macos-tools/imessage-sdk";
import { createLogger } from "@macos-tools/logger";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";

const logger = createLogger({ service: "mcp-server:imessage" });

/**
 * Formats a message for display
 */
function formatMessage(msg: {
	ROWID: number;
	text: string | null;
	is_from_me: number;
	date: number;
	handle_identifier?: string;
}): string {
	const sender = msg.is_from_me ? "Me" : msg.handle_identifier || "Unknown";
	const text = msg.text || "[No text content]";
	// Apple time is nanoseconds since 2001-01-01, convert to readable date
	const date = new Date(msg.date / 1000000 + 978307200000);
	return `[${date.toISOString()}] ${sender}: ${text}`;
}

/**
 * Formats a chat for display
 */
function formatChat(chat: {
	ROWID: number;
	chat_identifier: string;
	display_name: string | null;
	service_name: string;
}): string {
	const name = chat.display_name || chat.chat_identifier;
	return `Chat #${chat.ROWID}: ${name} (${chat.service_name})`;
}

/**
 * Registers iMessage-related tools with the MCP server
 */
export function registerIMessageTools(server: McpServer): void {
	const imessageClient = new IMessageClient();

	// Tool 1: Search messages
	server.registerTool(
		"imessage_search_messages",
		{
			title: "imessage_search_messages",
			description:
				"Search iMessage conversations by text content, contact, date range, or other filters. " +
				"Returns matching messages with sender, timestamp, and content. " +
				"Use this to find specific messages or conversations.",
			inputSchema: {
				searchText: z
					.string()
					.optional()
					.describe("Text to search for in message content"),
				contactIdentifier: z
					.string()
					.optional()
					.describe(
						"Phone number or email of contact (e.g., '+1234567890' or 'user@example.com')",
					),
				isFromMe: z
					.boolean()
					.optional()
					.describe("Filter by sender: true for messages you sent, false for received"),
				service: z
					.string()
					.optional()
					.describe("Service type: 'iMessage' or 'SMS'"),
				startDate: z
					.string()
					.optional()
					.describe("ISO 8601 date string for earliest message (e.g., '2024-01-01')"),
				endDate: z
					.string()
					.optional()
					.describe("ISO 8601 date string for latest message (e.g., '2024-12-31')"),
				limit: z
					.number()
					.optional()
					.describe("Maximum number of results to return (default: 50)"),
			},
		},
		async (args) => {
			logger.info("imessage_search_messages called", args);

			try {
				// Convert contact identifier to handle ID if provided
				let handleId: number | undefined;
				if (args.contactIdentifier) {
					const handle = imessageClient.getHandleByIdentifier(
						args.contactIdentifier as string,
					);
					if (handle) {
						handleId = handle.ROWID;
					} else {
						return {
							content: [
								{
									type: "text",
									text: `No contact found with identifier: ${args.contactIdentifier}`,
								},
							],
						};
					}
				}

				const messages = imessageClient.getMessages({
					searchText: args.searchText as string | undefined,
					handleId,
					isFromMe: args.isFromMe as boolean | undefined,
					service: args.service as string | undefined,
					startDate: args.startDate
						? new Date(args.startDate as string)
						: undefined,
					endDate: args.endDate ? new Date(args.endDate as string) : undefined,
					limit: (args.limit as number) || 50,
				});

				logger.info("imessage_search_messages results", {
					resultCount: messages.length,
				});

				if (messages.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: "No messages found matching the search criteria.",
							},
						],
					};
				}

				const formattedMessages = messages
					.map((msg) => formatMessage(msg))
					.join("\n\n");

				return {
					content: [
						{
							type: "text",
							text: `Found ${messages.length} message(s):\n\n${formattedMessages}`,
						},
					],
				};
			} catch (error) {
				logger.error("imessage_search_messages error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error searching messages: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
				};
			}
		},
	);

	// Tool 2: Get recent chats
	server.registerTool(
		"imessage_get_recent_chats",
		{
			title: "imessage_get_recent_chats",
			description:
				"Get a list of recent iMessage conversations, ordered by most recent activity. " +
				"Returns chat details including participants and the last message preview. " +
				"Use this to see what conversations are active.",
			inputSchema: {
				limit: z
					.number()
					.optional()
					.describe("Maximum number of chats to return (default: 20)"),
			},
		},
		async (args) => {
			logger.info("imessage_get_recent_chats called", args);

			try {
				const chats = imessageClient.getRecentChats((args.limit as number) || 20);

				logger.info("imessage_get_recent_chats results", {
					resultCount: chats.length,
				});

				if (chats.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: "No recent chats found.",
							},
						],
					};
				}

				const formattedChats = chats.map((chat) => {
					const participants = imessageClient.getParticipantsForChat(chat.ROWID);
					const participantNames = participants.map((p) => p.id).join(", ");
					const lastMessages = imessageClient.getMessagesForChat(chat.ROWID, 1);
					const lastMessage = lastMessages[0]
						? `\n  Last: ${lastMessages[0].text || "[No text]"}`
						: "";

					return `${formatChat(chat)}\n  Participants: ${participantNames}${lastMessage}`;
				});

				return {
					content: [
						{
							type: "text",
							text: `Recent chats (${chats.length}):\n\n${formattedChats.join("\n\n")}`,
						},
					],
				};
			} catch (error) {
				logger.error("imessage_get_recent_chats error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error getting recent chats: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
				};
			}
		},
	);

	// Tool 3: Get chat history
	server.registerTool(
		"imessage_get_chat_history",
		{
			title: "imessage_get_chat_history",
			description:
				"Get the full message history for a specific chat/conversation. " +
				"Requires a chat ID (obtained from imessage_get_recent_chats or imessage_query_database). " +
				"Returns all messages in chronological order with sender and timestamp.",
			inputSchema: {
				chatId: z.number().describe("The chat ID (ROWID) to get history for"),
				limit: z
					.number()
					.optional()
					.describe("Maximum number of messages to return (default: 100)"),
			},
		},
		async (args) => {
			logger.info("imessage_get_chat_history called", args);

			try {
				const chatId = args.chatId as number;
				const limit = (args.limit as number) || 100;

				// Verify chat exists
				const chat = imessageClient.getChatById(chatId);
				if (!chat) {
					return {
						content: [
							{
								type: "text",
								text: `No chat found with ID: ${chatId}`,
							},
						],
					};
				}

				const messages = imessageClient.getMessagesForChat(chatId, limit);

				logger.info("imessage_get_chat_history results", {
					chatId,
					resultCount: messages.length,
				});

				if (messages.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No messages found in chat #${chatId}`,
							},
						],
					};
				}

				const chatInfo = formatChat(chat);
				const participants = imessageClient.getParticipantsForChat(chatId);
				const participantNames = participants.map((p) => p.id).join(", ");
				const formattedMessages = messages
					.map((msg) => formatMessage(msg))
					.join("\n");

				return {
					content: [
						{
							type: "text",
							text:
								`${chatInfo}\nParticipants: ${participantNames}\n\n` +
								`Message history (${messages.length} messages):\n\n${formattedMessages}`,
						},
					],
				};
			} catch (error) {
				logger.error("imessage_get_chat_history error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error getting chat history: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
				};
			}
		},
	);

	// Tool 4: Get conversation statistics
	server.registerTool(
		"imessage_get_conversation_stats",
		{
			title: "imessage_get_conversation_stats",
			description:
				"Get statistics for iMessage conversations, including message counts, " +
				"sent vs received ratios, and date ranges. " +
				"Can get stats for a specific chat or overall statistics.",
			inputSchema: {
				chatId: z
					.number()
					.optional()
					.describe(
						"Optional chat ID to get stats for a specific conversation. Omit for overall stats.",
					),
			},
		},
		async (args) => {
			logger.info("imessage_get_conversation_stats called", args);

			try {
				const stats = imessageClient.getConversationStats(
					args.chatId as number | undefined,
				);

				logger.info("imessage_get_conversation_stats results", { stats });

				const scope = args.chatId ? `for chat #${args.chatId}` : "overall";
				const firstDate = stats.firstMessageDate
					? stats.firstMessageDate.toISOString()
					: "N/A";
				const lastDate = stats.lastMessageDate
					? stats.lastMessageDate.toISOString()
					: "N/A";

				return {
					content: [
						{
							type: "text",
							text:
								`Conversation statistics ${scope}:\n\n` +
								`Total messages: ${stats.totalMessages}\n` +
								`Sent by you: ${stats.sentMessages}\n` +
								`Received: ${stats.receivedMessages}\n` +
								`First message: ${firstDate}\n` +
								`Last message: ${lastDate}`,
						},
					],
				};
			} catch (error) {
				logger.error("imessage_get_conversation_stats error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error getting conversation stats: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
				};
			}
		},
	);
}
