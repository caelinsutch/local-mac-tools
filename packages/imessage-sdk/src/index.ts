/**
 * iMessage SDK for TypeScript
 *
 * A TypeScript client/SDK for querying and viewing iMessage data on macOS.
 * This SDK provides type-safe access to the iMessage SQLite database.
 *
 * @example
 * ```typescript
 * import { IMessageClient } from '@macos-tools/imessage-sdk';
 *
 * const client = new IMessageClient();
 *
 * // Get recent chats
 * const recentChats = client.getRecentChats(10);
 *
 * // Get messages from a specific chat
 * const messages = client.getMessagesForChat(chatId);
 *
 * // Search messages
 * const results = client.getMessages({
 *   searchText: 'hello',
 *   limit: 50
 * });
 *
 * client.close();
 * ```
 */

export { IMessageClient } from "./client";
export * from "./types";
export * from "./utils";
