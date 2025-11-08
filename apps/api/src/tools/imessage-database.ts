import { createLogger } from "@macos-tools/logger";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Database from "better-sqlite3";
import { z } from "zod/v3";
import { formatToolError } from "./utils";

const logger = createLogger({ service: "imessage:database" });

/**
 * Registers database query tool with the MCP server
 */
export function registerDatabaseTools(server: McpServer): void {
	server.registerTool(
		"imessage_query_database",
		{
			title: "imessage_query_database",
			description: `
Direct SQL query access to the iMessage database for advanced queries.

⚠️ IMPORTANT: This database is READ-ONLY. Do NOT attempt INSERT, UPDATE, DELETE, or any write operations.

## Database Schema

### Main Tables:

**message** - All iMessage and SMS messages
- ROWID (INTEGER PRIMARY KEY) - Unique message ID
- guid (TEXT) - Global unique identifier
- text (TEXT) - Message content (may be null for media-only messages)
- handle_id (INTEGER) - Foreign key to handle table (sender/recipient)
- subject (TEXT) - Message subject (rarely used)
- service (TEXT) - 'iMessage' or 'SMS'
- account (TEXT) - Account identifier
- date (INTEGER) - Apple timestamp (nanoseconds since 2001-01-01 00:00:00 UTC)
- date_read (INTEGER) - When message was read (Apple timestamp)
- date_delivered (INTEGER) - When message was delivered (Apple timestamp)
- is_from_me (INTEGER) - 1 if sent by user, 0 if received
- is_read (INTEGER) - 1 if read, 0 if unread
- is_sent (INTEGER) - 1 if successfully sent
- is_delivered (INTEGER) - 1 if delivered to recipient
- is_audio_message (INTEGER) - 1 if audio message
- cache_roomnames (TEXT) - Cached chat names
- attributedBody (BLOB) - Rich text content (newer macOS versions)

**handle** - Contacts (phone numbers and emails)
- ROWID (INTEGER PRIMARY KEY) - Unique handle ID
- id (TEXT) - Phone number or email address
- country (TEXT) - Country code
- service (TEXT) - 'iMessage' or 'SMS'
- uncanonicalized_id (TEXT) - Original unformatted identifier

**chat** - Conversations (individual or group)
- ROWID (INTEGER PRIMARY KEY) - Unique chat ID
- guid (TEXT) - Global unique identifier
- style (INTEGER) - Chat style (43 = group, 45 = individual)
- state (INTEGER) - Chat state
- account_id (TEXT) - Account identifier
- chat_identifier (TEXT) - Chat identifier (phone/email or group ID)
- service_name (TEXT) - 'iMessage' or 'SMS'
- room_name (TEXT) - Group chat name
- display_name (TEXT) - Chat display name
- group_id (TEXT) - Group identifier
- is_archived (INTEGER) - 1 if archived
- is_filtered (INTEGER) - 1 if filtered

**attachment** - File attachments (photos, videos, documents)
- ROWID (INTEGER PRIMARY KEY) - Unique attachment ID
- guid (TEXT) - Global unique identifier
- filename (TEXT) - Full file path on disk
- mime_type (TEXT) - MIME type (e.g., 'image/jpeg')
- transfer_name (TEXT) - Original filename
- total_bytes (INTEGER) - File size in bytes
- is_outgoing (INTEGER) - 1 if sent, 0 if received
- created_date (INTEGER) - Creation timestamp (Apple time)
- hide_attachment (INTEGER) - 1 if hidden

### Join Tables:

**chat_message_join** - Links messages to chats
- chat_id (INTEGER) - Foreign key to chat.ROWID
- message_id (INTEGER) - Foreign key to message.ROWID
- message_date (INTEGER) - Message date (denormalized for performance)

**chat_handle_join** - Links handles to chats (participants)
- chat_id (INTEGER) - Foreign key to chat.ROWID
- handle_id (INTEGER) - Foreign key to handle.ROWID

**message_attachment_join** - Links attachments to messages
- message_id (INTEGER) - Foreign key to message.ROWID
- attachment_id (INTEGER) - Foreign key to attachment.ROWID

## Apple Timestamp Conversion

Apple timestamps are nanoseconds since 2001-01-01 00:00:00 UTC.

To convert to Unix timestamp:
\`\`\`sql
-- Apple time to Unix seconds:
(date / 1000000000) + 978307200

-- To get readable date, use strftime:
strftime('%Y-%m-%d %H:%M:%S', date / 1000000000 + 978307200, 'unixepoch')
\`\`\`

## Example Queries

**Get recent messages with sender info:**
\`\`\`sql
SELECT m.ROWID, m.text, m.is_from_me, m.date, h.id as sender
FROM message m
LEFT JOIN handle h ON m.handle_id = h.ROWID
ORDER BY m.date DESC
LIMIT 50
\`\`\`

**Find messages containing specific text:**
\`\`\`sql
SELECT m.text, h.id as contact, strftime('%Y-%m-%d', m.date / 1000000000 + 978307200, 'unixepoch') as date
FROM message m
LEFT JOIN handle h ON m.handle_id = h.ROWID
WHERE m.text LIKE '%search term%'
ORDER BY m.date DESC
\`\`\`

**Get all participants in a chat:**
\`\`\`sql
SELECT c.display_name, h.id as participant
FROM chat c
JOIN chat_handle_join chj ON c.ROWID = chj.chat_id
JOIN handle h ON chj.handle_id = h.ROWID
WHERE c.ROWID = ?
\`\`\`

**Count messages by contact:**
\`\`\`sql
SELECT h.id as contact, COUNT(*) as message_count
FROM message m
JOIN handle h ON m.handle_id = h.ROWID
WHERE m.is_from_me = 0
GROUP BY h.id
ORDER BY message_count DESC
LIMIT 20
\`\`\`

**Find chats with attachments:**
\`\`\`sql
SELECT DISTINCT c.ROWID, c.display_name, COUNT(a.ROWID) as attachment_count
FROM chat c
JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
JOIN message_attachment_join maj ON cmj.message_id = maj.message_id
JOIN attachment a ON maj.attachment_id = a.ROWID
GROUP BY c.ROWID
ORDER BY attachment_count DESC
\`\`\`

## Safety Notes
- Always use SELECT statements only
- Add LIMIT clauses to prevent returning too much data
- Use ORDER BY date DESC for most recent results
- Join with handle table to get contact information
- Remember dates are in Apple timestamp format
`,
			inputSchema: {
				query: z.string().describe("SQL query to execute (SELECT only)"),
				limit: z
					.number()
					.optional()
					.describe(
						"Maximum number of rows to return (default: 100, max: 1000)",
					),
			},
		},
		async (args) => {
			logger.info("imessage_query_database called", {
				query: args.query,
				limit: args.limit,
			});

			try {
				const query = (args.query as string).trim();

				// Safety check: Only allow SELECT queries
				const queryUpper = query.toUpperCase();
				if (
					!queryUpper.startsWith("SELECT") &&
					!queryUpper.startsWith("WITH")
				) {
					return {
						content: [
							{
								type: "text",
								text: "Error: Only SELECT queries are allowed. This is a read-only database.",
							},
						],
					};
				}

				// Additional safety: Block dangerous keywords
				const dangerousKeywords = [
					"INSERT",
					"UPDATE",
					"DELETE",
					"DROP",
					"CREATE",
					"ALTER",
					"TRUNCATE",
					"REPLACE",
					"ATTACH",
					"DETACH",
				];
				for (const keyword of dangerousKeywords) {
					if (queryUpper.includes(keyword)) {
						return {
							content: [
								{
									type: "text",
									text: `Error: Query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`,
								},
							],
						};
					}
				}

				// Get database path from environment or use default
				const dbPath =
					process.env.IMESSAGE_DB_PATH ||
					`${process.env.HOME}/Library/Messages/chat.db`;

				// Open database in read-only mode
				const db = new Database(dbPath, {
					readonly: true,
					fileMustExist: true,
				});

				// Execute query with limit
				const limit = Math.min((args.limit as number) || 100, 1000);
				const limitedQuery = query.includes("LIMIT")
					? query
					: `${query} LIMIT ${limit}`;

				const results = db.prepare(limitedQuery).all();
				db.close();

				logger.info("imessage_query_database results", {
					rowCount: results.length,
				});

				if (results.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: "Query executed successfully but returned no results.",
							},
						],
					};
				}

				// Format results as a table
				const firstResult = results[0];
				if (!firstResult) {
					return {
						content: [
							{
								type: "text",
								text: "Query executed successfully but returned no results.",
							},
						],
					};
				}
				const columns = Object.keys(firstResult);
				const maxWidths = columns.map((col) => {
					const values = results.map((row) =>
						String((row as Record<string, unknown>)[col] || ""),
					);
					return Math.max(col.length, ...values.map((v) => v.length));
				});

				// Create header
				const header = columns
					.map((col, i) => col.padEnd(maxWidths[i]))
					.join(" | ");
				const separator = maxWidths.map((w) => "-".repeat(w)).join("-+-");

				// Create rows (limit to 50 rows in output for readability)
				const displayResults = results.slice(0, 50);
				const rows = displayResults.map((row) => {
					return columns
						.map((col, i) => {
							const value = (row as Record<string, unknown>)[col];
							return String(value ?? "").padEnd(maxWidths[i]);
						})
						.join(" | ");
				});

				const table = [header, separator, ...rows].join("\n");
				const truncatedNote =
					results.length > 50
						? `\n\n(Showing first 50 of ${results.length} results)`
						: "";

				return {
					content: [
						{
							type: "text",
							text: `Query returned ${results.length} row(s):\n\n${table}${truncatedNote}`,
						},
					],
				};
			} catch (error) {
				logger.error("imessage_query_database error", error);
				return formatToolError("Error executing query", error);
			}
		},
	);
}
