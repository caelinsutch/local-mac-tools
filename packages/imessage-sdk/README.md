# iMessage SDK for TypeScript

A type-safe TypeScript SDK for querying and viewing iMessage data on macOS. This SDK provides programmatic access to the iMessage SQLite database with a clean, intuitive API.

## Features

- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- ✅ **Easy to Use**: Simple, intuitive API for querying messages and chats
- ✅ **Powerful Filtering**: Filter messages by date, sender, text content, and more
- ✅ **Chat Management**: Access individual chats, group chats, and participants
- ✅ **Attachment Support**: Query message attachments and media
- ✅ **Statistics**: Get conversation statistics and analytics
- ✅ **Read-Only**: Safe, read-only access by default

## Prerequisites

- macOS (iMessage database is only available on Mac)
- Node.js 14 or higher
- iMessage enabled on your Mac
- **Full Disk Access** permission for your terminal/application

### Granting Full Disk Access

To access the iMessage database, you need to grant Full Disk Access:

1. Open **System Preferences** > **Security & Privacy** > **Privacy**
2. Select **Full Disk Access** from the left sidebar
3. Click the lock icon and authenticate
4. Click the **+** button and add:
   - **Terminal** (if running from terminal)
   - **Your IDE/Editor** (if running from VS Code, etc.)
5. Restart your terminal/application

## Installation

```bash
npm install @imessage-tools/sdk
```

Or if you're working in the monorepo:

```bash
npm install
```

## Quick Start

```typescript
import { IMessageClient } from '@imessage-tools/sdk';

// Initialize the client
const client = new IMessageClient();

// Get recent chats
const recentChats = client.getRecentChats(10);
console.log('Recent chats:', recentChats);

// Get messages
const messages = client.getMessages({ limit: 50 });
console.log('Recent messages:', messages);

// Search messages
const results = client.getMessages({
  searchText: 'hello',
  limit: 20
});

// Get statistics
const stats = client.getConversationStats();
console.log(`Total messages: ${stats.totalMessages}`);

// Close when done
client.close();
```

## API Reference

### IMessageClient

Main client class for interacting with the iMessage database.

#### Constructor

```typescript
new IMessageClient(config?: IMessageConfig)
```

**Options:**
- `databasePath?: string` - Custom path to chat.db (default: `~/Library/Messages/chat.db`)
- `readonly?: boolean` - Open in read-only mode (default: `true`)

#### Methods

##### `getMessages(filter?: MessageFilter): EnrichedMessage[]`

Get messages with optional filtering.

**Filter Options:**
```typescript
{
  chatId?: number;          // Filter by chat ID
  handleId?: number;        // Filter by contact/handle ID
  isFromMe?: boolean;       // Filter by sender (true = sent, false = received)
  service?: string;         // Filter by service ('iMessage', 'SMS')
  limit?: number;           // Limit results
  offset?: number;          // Offset for pagination
  searchText?: string;      // Search message text
  startDate?: Date;         // Messages after this date
  endDate?: Date;           // Messages before this date
}
```

##### `getMessageById(messageId: number): EnrichedMessage | null`

Get a single message by its ID.

##### `getChats(filter?: ChatFilter): Chat[]`

Get all chats with optional filtering.

**Filter Options:**
```typescript
{
  chatIdentifier?: string;  // Filter by chat identifier
  displayName?: string;     // Search by display name
  isGroup?: boolean;        // Filter group chats
  limit?: number;           // Limit results
  offset?: number;          // Offset for pagination
}
```

##### `getChatById(chatId: number): (Chat & { participants: Handle[] }) | null`

Get a chat by ID with its participants.

##### `getMessagesForChat(chatId: number, limit?: number): EnrichedMessage[]`

Get all messages for a specific chat.

##### `getHandles(): Handle[]`

Get all contacts/handles.

##### `getHandleById(handleId: number): Handle | null`

Get a specific handle by ID.

##### `searchHandles(searchTerm: string): Handle[]`

Search handles by phone number or email.

##### `getAttachmentsForMessage(messageId: number): Attachment[]`

Get all attachments for a message.

##### `getConversationStats(chatId?: number): ConversationStats`

Get conversation statistics.

**Returns:**
```typescript
{
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  firstMessageDate: Date | null;
  lastMessageDate: Date | null;
}
```

##### `getRecentChats(limit?: number): Chat[]`

Get recent chats ordered by last message date.

##### `close(): void`

Close the database connection.

## Type Definitions

### Message

```typescript
interface Message {
  ROWID: number;
  guid: string;
  text: string | null;
  handle_id: number;
  service: string;
  date: number;              // Apple timestamp (nanoseconds since 2001-01-01)
  is_from_me: number;        // 1 = sent, 0 = received
  is_read: number;
  // ... more fields
}
```

### EnrichedMessage

Extended message with related data:

```typescript
interface EnrichedMessage extends Message {
  handle?: Handle;           // Sender information
  chat?: Chat;               // Associated chat
  attachments?: Attachment[]; // Message attachments
  participants?: Handle[];   // Chat participants
}
```

### Handle

Contact/phone number information:

```typescript
interface Handle {
  ROWID: number;
  id: string;                // Phone number or email
  country: string | null;
  service: string;           // 'iMessage', 'SMS'
}
```

### Chat

Chat conversation information:

```typescript
interface Chat {
  ROWID: number;
  guid: string;
  chat_identifier: string;
  display_name: string | null;
  service_name: string;
}
```

## Utilities

### Date Conversion

```typescript
import { appleTimeToDate, dateToAppleTime } from '@imessage-tools/sdk';

// Convert Apple timestamp to JavaScript Date
const date = appleTimeToDate(message.date);

// Convert JavaScript Date to Apple timestamp
const appleTime = dateToAppleTime(new Date());
```

### Format Handle

```typescript
import { formatHandle } from '@imessage-tools/sdk';

const formatted = formatHandle('+11234567890');
// Returns: "+1 (123) 456-7890"
```

## Examples

### Example 1: Get Recent Messages

```typescript
import { IMessageClient, appleTimeToDate } from '@imessage-tools/sdk';

const client = new IMessageClient();

const messages = client.getMessages({
  limit: 20,
  isFromMe: false  // Only received messages
});

messages.forEach(msg => {
  const date = appleTimeToDate(msg.date);
  console.log(`[${date.toLocaleString()}] ${msg.handle?.id}: ${msg.text}`);
});

client.close();
```

### Example 2: Search Messages

```typescript
import { IMessageClient } from '@imessage-tools/sdk';

const client = new IMessageClient();

const results = client.getMessages({
  searchText: 'meeting',
  startDate: new Date('2024-01-01'),
  limit: 50
});

console.log(`Found ${results.length} messages containing "meeting"`);

client.close();
```

### Example 3: Get Group Chats

```typescript
import { IMessageClient } from '@imessage-tools/sdk';

const client = new IMessageClient();

const groupChats = client.getChats({ isGroup: true });

groupChats.forEach(chat => {
  const chatData = client.getChatById(chat.ROWID);
  console.log(`${chat.display_name || 'Unnamed Group'}`);
  console.log(`Participants: ${chatData?.participants.map(p => p.id).join(', ')}`);
});

client.close();
```

### Example 4: Conversation Statistics

```typescript
import { IMessageClient } from '@imessage-tools/sdk';

const client = new IMessageClient();

// Overall stats
const overallStats = client.getConversationStats();
console.log(`Total: ${overallStats.totalMessages} messages`);
console.log(`Sent: ${overallStats.sentMessages}`);
console.log(`Received: ${overallStats.receivedMessages}`);

// Stats for specific chat
const chat = client.getChats({ limit: 1 })[0];
if (chat) {
  const chatStats = client.getConversationStats(chat.ROWID);
  console.log(`\nChat "${chat.display_name}": ${chatStats.totalMessages} messages`);
}

client.close();
```

## Database Schema

The iMessage database (`chat.db`) contains the following main tables:

- **message**: All messages (text, attachments, metadata)
- **handle**: Contact information (phone numbers, emails)
- **chat**: Chat conversations
- **attachment**: File attachments
- **chat_handle_join**: Links chats to participants
- **chat_message_join**: Links messages to chats
- **message_attachment_join**: Links attachments to messages

## Important Notes

### Date Format

Apple stores dates as nanoseconds since January 1, 2001 (Apple epoch). This SDK automatically converts between Apple timestamps and JavaScript Date objects using the utility functions.

### Read-Only Access

By default, the SDK opens the database in read-only mode to prevent accidental data corruption. The iMessage database is actively used by macOS, so write operations are not recommended.

### macOS Ventura+

On macOS Ventura and later, some message text is stored in the `attributedBody` field as a binary blob. The SDK includes basic parsing for this field, but complex formatting may not be fully extracted.

### Performance

For large message databases (100k+ messages), consider using:
- Appropriate `limit` and `offset` for pagination
- Specific filters to narrow results
- Indexing if performing custom queries

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Watch Mode

```bash
npm run dev
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

## Troubleshooting

### "Operation not permitted" Error

You need to grant Full Disk Access. See [Granting Full Disk Access](#granting-full-disk-access).

### Empty Message Text

On newer macOS versions, text might be in `attributedBody`. The SDK handles this automatically, but some messages might still appear empty if they contain only media or special formatting.

### Database Not Found

Ensure:
1. You're running on macOS
2. iMessage is set up on your Mac
3. You've sent/received at least one message
4. The default path is correct: `~/Library/Messages/chat.db`

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Acknowledgments

This SDK is inspired by various iMessage database analysis projects and built upon the research of the iMessage database schema by the community.

## References

- [iMessage SQLite Database Documentation](https://dev.to/arctype/analyzing-imessage-with-sql-f42)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
