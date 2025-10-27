/**
 * Type definitions for iMessage SDK
 */

/**
 * Configuration for IMessageClient
 */
export interface IMessageConfig {
	/**
	 * Path to the iMessage database (chat.db)
	 * Default: ~/Library/Messages/chat.db
	 */
	databasePath?: string;

	/**
	 * Whether to open the database in read-only mode
	 * Default: true
	 */
	readonly?: boolean;
}

/**
 * Message record from the database
 */
export interface Message {
	ROWID: number;
	guid: string;
	text: string | null;
	handle_id: number;
	subject: string | null;
	service: string;
	account: string | null;
	date: number; // Apple timestamp (nanoseconds since 2001-01-01)
	date_read: number;
	date_delivered: number;
	is_from_me: number; // 1 = sent by user, 0 = received
	is_read: number;
	is_sent: number;
	is_delivered: number;
	is_finished: number;
	is_audio_message: number;
	cache_roomnames: string | null;
	attributedBody: Buffer | null;
}

/**
 * Enriched message with additional data
 */
export interface EnrichedMessage extends Message {
	handle?: Handle;
	chat?: Chat;
	attachments?: Attachment[];
	participants?: Handle[];
}

/**
 * Handle (contact) record
 */
export interface Handle {
	ROWID: number;
	id: string; // Phone number or email
	country: string | null;
	service: string;
	uncanonicalized_id: string | null;
}

/**
 * Chat record
 */
export interface Chat {
	ROWID: number;
	guid: string;
	style: number;
	state: number;
	account_id: string;
	chat_identifier: string;
	service_name: string;
	room_name: string | null;
	account_login: string | null;
	display_name: string | null;
	group_id: string | null;
	is_archived: number;
	last_addressed_handle: string | null;
	is_filtered: number;
}

/**
 * Attachment record
 */
export interface Attachment {
	ROWID: number;
	guid: string;
	filename: string | null;
	mime_type: string | null;
	transfer_name: string | null;
	total_bytes: number;
	is_outgoing: number;
	created_date: number;
	start_date: number;
	hide_attachment: number;
}

/**
 * Filter options for querying messages
 */
export interface MessageFilter {
	/**
	 * Filter by chat ID
	 */
	chatId?: number;

	/**
	 * Filter by handle (contact) ID
	 */
	handleId?: number;

	/**
	 * Filter by sender (true = sent by user, false = received)
	 */
	isFromMe?: boolean;

	/**
	 * Filter by service ('iMessage', 'SMS', etc.)
	 */
	service?: string;

	/**
	 * Search text in message content
	 */
	searchText?: string;

	/**
	 * Filter messages after this date
	 */
	startDate?: Date;

	/**
	 * Filter messages before this date
	 */
	endDate?: Date;

	/**
	 * Limit number of results
	 */
	limit?: number;

	/**
	 * Offset for pagination
	 */
	offset?: number;
}

/**
 * Filter options for querying chats
 */
export interface ChatFilter {
	/**
	 * Filter by chat identifier
	 */
	chatIdentifier?: string;

	/**
	 * Search by display name
	 */
	displayName?: string;

	/**
	 * Filter group chats (true) or individual chats (false)
	 */
	isGroup?: boolean;

	/**
	 * Limit number of results
	 */
	limit?: number;

	/**
	 * Offset for pagination
	 */
	offset?: number;
}

/**
 * Conversation statistics
 */
export interface ConversationStats {
	totalMessages: number;
	sentMessages: number;
	receivedMessages: number;
	firstMessageDate: Date | null;
	lastMessageDate: Date | null;
}
