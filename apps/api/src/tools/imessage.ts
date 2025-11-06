import { formatMessage, IMessageClient } from "@macos-tools/imessage-sdk";
import { createLogger } from "@macos-tools/logger";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { formatToolError } from "./utils";

const logger = createLogger({ service: "mcp-server:imessage" });

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
					.describe(
						"Filter by sender: true for messages you sent, false for received",
					),
				service: z
					.string()
					.optional()
					.describe("Service type: 'iMessage' or 'SMS'"),
				startDate: z
					.string()
					.optional()
					.describe(
						"ISO 8601 date string for earliest message (e.g., '2024-01-01')",
					),
				endDate: z
					.string()
					.optional()
					.describe(
						"ISO 8601 date string for latest message (e.g., '2024-12-31')",
					),
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
				return formatToolError("Error searching messages", error);
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
				const chats = imessageClient.getRecentChats(
					(args.limit as number) || 20,
				);

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
					const participants = imessageClient.getParticipantsForChat(
						chat.ROWID,
					);
					const participantNames = participants.map((p) => p.id).join(", ");

					// Get last 3 messages for preview
					const lastMessages = imessageClient.getMessagesForChat(chat.ROWID, 3);
					let messagesPreview = "";
					if (lastMessages.length > 0) {
						messagesPreview = "\n  Recent messages:";
						for (const msg of lastMessages.reverse()) {
							messagesPreview += `\n    ${formatMessage(msg)}`;
						}
					}

					return `${formatChat(chat)}\n  Participants: ${participantNames}${messagesPreview}`;
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
				return formatToolError("Error getting recent chats", error);
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
				return formatToolError("Error getting chat history", error);
			}
		},
	);

	// Tool 4: Get messages by date
	server.registerTool(
		"imessage_get_messages_by_date",
		{
			title: "imessage_get_messages_by_date",
			description:
				"Get all messages sent or received on a specific date or date range. " +
				"Useful for recalling 'What did I discuss last Tuesday?' or 'Show me messages from last week'. " +
				"Returns messages with sender, timestamp, and content.",
			inputSchema: {
				date: z
					.string()
					.optional()
					.describe(
						"Specific date in ISO 8601 format (e.g., '2024-01-15'). Gets all messages from that day.",
					),
				startDate: z
					.string()
					.optional()
					.describe(
						"Start date for date range in ISO 8601 format (e.g., '2024-01-01')",
					),
				endDate: z
					.string()
					.optional()
					.describe(
						"End date for date range in ISO 8601 format (e.g., '2024-01-31')",
					),
				contactIdentifier: z
					.string()
					.optional()
					.describe("Optional: filter by specific contact (phone or email)"),
				limit: z
					.number()
					.optional()
					.describe("Maximum number of results to return (default: 100)"),
			},
		},
		async (args) => {
			logger.info("imessage_get_messages_by_date called", args);

			try {
				let startDate: Date | undefined;
				let endDate: Date | undefined;

				// If specific date provided, set start/end to cover that whole day
				if (args.date) {
					startDate = new Date(args.date as string);
					endDate = new Date(args.date as string);
					endDate.setDate(endDate.getDate() + 1); // Next day at midnight
				} else {
					// Use provided date range
					startDate = args.startDate
						? new Date(args.startDate as string)
						: undefined;
					endDate = args.endDate ? new Date(args.endDate as string) : undefined;
				}

				// Convert contact identifier to handle ID if provided
				let handleId: number | undefined;
				if (args.contactIdentifier) {
					const handle = imessageClient.getHandleByIdentifier(
						args.contactIdentifier as string,
					);
					if (handle) {
						handleId = handle.ROWID;
					}
				}

				const messages = imessageClient.getMessages({
					startDate,
					endDate,
					handleId,
					limit: (args.limit as number) || 100,
				});

				logger.info("imessage_get_messages_by_date results", {
					resultCount: messages.length,
				});

				if (messages.length === 0) {
					const dateDesc = args.date
						? `on ${args.date}`
						: `between ${args.startDate || "start"} and ${args.endDate || "now"}`;
					return {
						content: [
							{
								type: "text",
								text: `No messages found ${dateDesc}.`,
							},
						],
					};
				}

				// Group messages by conversation for better readability
				const messagesByChat = new Map<string, typeof messages>();
				for (const msg of messages) {
					const key = msg.account || "Unknown";
					if (!messagesByChat.has(key)) {
						messagesByChat.set(key, []);
					}
					messagesByChat.get(key)?.push(msg);
				}

				const formattedOutput: string[] = [];
				for (const [contact, msgs] of messagesByChat) {
					formattedOutput.push(
						`Conversation with ${contact} (${msgs.length} messages):`,
					);
					formattedOutput.push(
						msgs.map((msg) => `  ${formatMessage(msg)}`).join("\n"),
					);
					formattedOutput.push("");
				}

				const dateDesc = args.date
					? `on ${args.date}`
					: `from ${args.startDate || "start"} to ${args.endDate || "now"}`;

				return {
					content: [
						{
							type: "text",
							text: `Found ${messages.length} message(s) ${dateDesc}:\n\n${formattedOutput.join("\n")}`,
						},
					],
				};
			} catch (error) {
				logger.error("imessage_get_messages_by_date error", error);
				return formatToolError("Error getting messages by date", error);
			}
		},
	);
}
