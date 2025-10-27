import Database from "better-sqlite3";
import type {
	Attachment,
	Chat,
	ChatFilter,
	ConversationStats,
	EnrichedMessage,
	Handle,
	IMessageConfig,
	Message,
	MessageFilter,
} from "./types";
import {
	appleTimeToDate,
	dateToAppleTime,
	getDefaultDatabasePath,
	parseAttributedBody,
	validateDatabasePath,
} from "./utils";

/**
 * Main client for interacting with iMessage database
 */
export class IMessageClient {
	private db: Database.Database;
	private readonly databasePath: string;

	constructor(config: IMessageConfig = {}) {
		this.databasePath = config.databasePath || getDefaultDatabasePath();

		if (!validateDatabasePath(this.databasePath)) {
			throw new Error(
				`iMessage database not found at: ${this.databasePath}\n` +
					"Make sure:\n" +
					"1. You're running on macOS\n" +
					"2. iMessage is enabled on your Mac\n" +
					"3. You have granted Full Disk Access to your terminal/app in System Preferences > Security & Privacy > Privacy > Full Disk Access",
			);
		}

		try {
			this.db = new Database(this.databasePath, {
				readonly: config.readonly !== false,
				fileMustExist: true,
			});
		} catch (error) {
			throw new Error(
				`Failed to open iMessage database: ${error instanceof Error ? error.message : String(error)}\n` +
					"You may need to grant Full Disk Access permission.",
			);
		}
	}

	/**
	 * Get all messages with optional filtering
	 */
	getMessages(filter: MessageFilter = {}): EnrichedMessage[] {
		let query = `
      SELECT
        m.*,
        h.id as handle_identifier,
        h.service as handle_service,
        h.country as handle_country
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      WHERE 1=1
    `;

		const params: unknown[] = [];

		if (filter.chatId !== undefined) {
			query += ` AND m.ROWID IN (
        SELECT message_id FROM chat_message_join WHERE chat_id = ?
      )`;
			params.push(filter.chatId);
		}

		if (filter.handleId !== undefined) {
			query += " AND m.handle_id = ?";
			params.push(filter.handleId);
		}

		if (filter.isFromMe !== undefined) {
			query += " AND m.is_from_me = ?";
			params.push(filter.isFromMe ? 1 : 0);
		}

		if (filter.service) {
			query += " AND m.service = ?";
			params.push(filter.service);
		}

		if (filter.searchText) {
			query += " AND m.text LIKE ?";
			params.push(`%${filter.searchText}%`);
		}

		if (filter.startDate) {
			query += " AND m.date >= ?";
			params.push(dateToAppleTime(filter.startDate));
		}

		if (filter.endDate) {
			query += " AND m.date <= ?";
			params.push(dateToAppleTime(filter.endDate));
		}

		query += " ORDER BY m.date DESC";

		if (filter.limit) {
			query += " LIMIT ?";
			params.push(filter.limit);
		}

		if (filter.offset) {
			query += " OFFSET ?";
			params.push(filter.offset);
		}

		const stmt = this.db.prepare(query);
		const rows = stmt.all(...params) as unknown[];

		return rows.map((row) => this.enrichMessage(row));
	}

	/**
	 * Get a single message by ID
	 */
	getMessageById(messageId: number): EnrichedMessage | null {
		const query = `
      SELECT
        m.*,
        h.id as handle_identifier,
        h.service as handle_service,
        h.country as handle_country
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      WHERE m.ROWID = ?
    `;

		const stmt = this.db.prepare(query);
		const row = stmt.get(messageId) as unknown;

		return row ? this.enrichMessage(row) : null;
	}

	/**
	 * Get all chats with optional filtering
	 */
	getChats(filter: ChatFilter = {}): Chat[] {
		let query = "SELECT * FROM chat WHERE 1=1";
		const params: unknown[] = [];

		if (filter.chatIdentifier) {
			query += " AND chat_identifier = ?";
			params.push(filter.chatIdentifier);
		}

		if (filter.displayName) {
			query += " AND display_name LIKE ?";
			params.push(`%${filter.displayName}%`);
		}

		if (filter.isGroup !== undefined) {
			if (filter.isGroup) {
				query += " AND chat_identifier LIKE 'chat%'";
			} else {
				query += " AND chat_identifier NOT LIKE 'chat%'";
			}
		}

		query += " ORDER BY ROWID DESC";

		if (filter.limit) {
			query += " LIMIT ?";
			params.push(filter.limit);
		}

		if (filter.offset) {
			query += " OFFSET ?";
			params.push(filter.offset);
		}

		const stmt = this.db.prepare(query);
		return stmt.all(...params) as Chat[];
	}

	/**
	 * Get a chat by ID with its participants
	 */
	getChatById(chatId: number): (Chat & { participants: Handle[] }) | null {
		const chatQuery = "SELECT * FROM chat WHERE ROWID = ?";
		const chat = this.db.prepare(chatQuery).get(chatId) as Chat | undefined;

		if (!chat) return null;

		const participantsQuery = `
      SELECT h.*
      FROM handle h
      INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      WHERE chj.chat_id = ?
    `;
		const participants = this.db
			.prepare(participantsQuery)
			.all(chatId) as Handle[];

		return { ...chat, participants };
	}

	/**
	 * Get messages for a specific chat
	 */
	getMessagesForChat(chatId: number, limit?: number): EnrichedMessage[] {
		return this.getMessages({ chatId, limit });
	}

	/**
	 * Get all handles (contacts)
	 */
	getHandles(): Handle[] {
		const query = "SELECT * FROM handle ORDER BY ROWID";
		return this.db.prepare(query).all() as Handle[];
	}

	/**
	 * Get a handle by ID
	 */
	getHandleById(handleId: number): Handle | null {
		const query = "SELECT * FROM handle WHERE ROWID = ?";
		return (this.db.prepare(query).get(handleId) as Handle) || null;
	}

	/**
	 * Search for handles by phone number or email
	 */
	searchHandles(searchTerm: string): Handle[] {
		const query = `
      SELECT * FROM handle
      WHERE id LIKE ? OR uncanonicalized_id LIKE ?
      ORDER BY ROWID
    `;
		const pattern = `%${searchTerm}%`;
		return this.db.prepare(query).all(pattern, pattern) as Handle[];
	}

	/**
	 * Get a handle by exact phone number or email
	 */
	getHandleByIdentifier(identifier: string): Handle | null {
		const query = `
      SELECT * FROM handle
      WHERE id = ? OR uncanonicalized_id = ?
      LIMIT 1
    `;
		return (
			(this.db.prepare(query).get(identifier, identifier) as Handle) || null
		);
	}

	/**
	 * Get all chats for a specific handle/contact
	 */
	getChatsForHandle(handleId: number): (Chat & { participants: Handle[] })[] {
		const query = `
      SELECT DISTINCT c.*
      FROM chat c
      INNER JOIN chat_handle_join chj ON c.ROWID = chj.chat_id
      WHERE chj.handle_id = ?
      ORDER BY c.ROWID DESC
    `;
		const chats = this.db.prepare(query).all(handleId) as Chat[];

		return chats.map((chat) => {
			const participantsQuery = `
        SELECT h.*
        FROM handle h
        INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
        WHERE chj.chat_id = ?
      `;
			const participants = this.db
				.prepare(participantsQuery)
				.all(chat.ROWID) as Handle[];

			return { ...chat, participants };
		});
	}

	/**
	 * Get message count for a specific handle/contact
	 */
	getMessageCountForHandle(handleId: number): {
		total: number;
		sent: number;
		received: number;
	} {
		const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_from_me = 1 THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN is_from_me = 0 THEN 1 ELSE 0 END) as received
      FROM message
      WHERE handle_id = ?
    `;
		const result = this.db.prepare(query).get(handleId) as Record<
			string,
			number
		>;

		return {
			total: result.total || 0,
			sent: result.sent || 0,
			received: result.received || 0,
		};
	}

	/**
	 * Get all participants for a chat
	 */
	getParticipantsForChat(chatId: number): Handle[] {
		const query = `
      SELECT h.*
      FROM handle h
      INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      WHERE chj.chat_id = ?
      ORDER BY h.ROWID
    `;
		return this.db.prepare(query).all(chatId) as Handle[];
	}

	/**
	 * Get attachments for a message
	 */
	getAttachmentsForMessage(messageId: number): Attachment[] {
		const query = `
      SELECT a.*
      FROM attachment a
      INNER JOIN message_attachment_join maj ON a.ROWID = maj.attachment_id
      WHERE maj.message_id = ?
    `;
		return this.db.prepare(query).all(messageId) as Attachment[];
	}

	/**
	 * Get conversation statistics
	 */
	getConversationStats(chatId?: number): ConversationStats {
		let query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_from_me = 1 THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN is_from_me = 0 THEN 1 ELSE 0 END) as received,
        MIN(date) as first_date,
        MAX(date) as last_date
      FROM message
    `;

		const params: unknown[] = [];
		if (chatId !== undefined) {
			query += `
        WHERE ROWID IN (
          SELECT message_id FROM chat_message_join WHERE chat_id = ?
        )
      `;
			params.push(chatId);
		}

		const stmt = this.db.prepare(query);
		const result = stmt.get(...params) as Record<string, unknown>;

		return {
			totalMessages: (result.total as number) || 0,
			sentMessages: (result.sent as number) || 0,
			receivedMessages: (result.received as number) || 0,
			firstMessageDate:
				result.first_date !== null && result.first_date !== undefined
					? appleTimeToDate(result.first_date as number)
					: null,
			lastMessageDate:
				result.last_date !== null && result.last_date !== undefined
					? appleTimeToDate(result.last_date as number)
					: null,
		};
	}

	/**
	 * Get recent chats ordered by last message date
	 */
	getRecentChats(
		limit = 20,
	): (Chat & { lastMessage?: Message; participants: Handle[] })[] {
		const query = `
      SELECT
        c.*,
        MAX(cmj.message_date) as last_message_date
      FROM chat c
      INNER JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
      GROUP BY c.ROWID
      ORDER BY last_message_date DESC
      LIMIT ?
    `;

		const chats = this.db.prepare(query).all(limit) as (Chat & {
			last_message_date: number;
		})[];

		return chats.map((chat) => {
			// Get participants
			const participantsQuery = `
        SELECT h.*
        FROM handle h
        INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
        WHERE chj.chat_id = ?
      `;
			const participants = this.db
				.prepare(participantsQuery)
				.all(chat.ROWID) as Handle[];

			// Get last message
			const lastMessageQuery = `
        SELECT m.*
        FROM message m
        INNER JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
        WHERE cmj.chat_id = ?
        ORDER BY m.date DESC
        LIMIT 1
      `;
			const lastMessage = this.db.prepare(lastMessageQuery).get(chat.ROWID) as
				| Message
				| undefined;

			const { ...chatData } = chat;
			return {
				...chatData,
				lastMessage,
				participants,
			};
		});
	}

	/**
	 * Close the database connection
	 */
	close(): void {
		this.db.close();
	}

	/**
	 * Helper method to enrich a message with parsed data
	 */
	private enrichMessage(row: unknown): EnrichedMessage {
		const r = row as Record<string, unknown>;

		const message: EnrichedMessage = {
			ROWID: r.ROWID as number,
			guid: r.guid as string,
			text:
				(r.text as string | null) ||
				parseAttributedBody(r.attributedBody as Buffer | null),
			handle_id: r.handle_id as number,
			subject: r.subject as string | null,
			service: r.service as string,
			account: r.account as string | null,
			date: r.date as number,
			date_read: r.date_read as number,
			date_delivered: r.date_delivered as number,
			is_from_me: r.is_from_me as number,
			is_read: r.is_read as number,
			is_sent: r.is_sent as number,
			is_delivered: r.is_delivered as number,
			is_finished: r.is_finished as number,
			is_audio_message: r.is_audio_message as number,
			cache_roomnames: r.cache_roomnames as string | null,
			attributedBody: r.attributedBody as Buffer | null,
		};

		// Add handle info if available
		if (r.handle_identifier) {
			message.handle = {
				ROWID: r.handle_id as number,
				id: r.handle_identifier as string,
				country: r.handle_country as string | null,
				service: r.handle_service as string,
				uncanonicalized_id: null,
			};
		}

		// Get attachments
		message.attachments = this.getAttachmentsForMessage(message.ROWID);

		return message;
	}
}
