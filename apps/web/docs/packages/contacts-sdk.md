---
sidebar_position: 1
---

# Contacts SDK

A TypeScript SDK for querying macOS Contacts data. Search and retrieve contact information including names, phone numbers, emails, and organizations from your Mac's Contacts app.

## Installation

```bash
npm install @macos-tools/contacts-sdk
# or
yarn add @macos-tools/contacts-sdk
# or
pnpm add @macos-tools/contacts-sdk
```

## Features

- 🔍 **Powerful Search**: Search contacts by name, phone number, email, or organization
- 📱 **Phone Number Normalization**: Automatic phone number formatting and matching
- 📧 **Email Support**: Query contacts by email addresses
- 🏢 **Organization Search**: Find contacts by company or organization name
- 💪 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Fast**: Direct SQLite database queries for optimal performance
- 🔐 **Read-Only**: Safe read-only access to your contacts database

## Quick Start

```typescript
import { ContactsClient } from '@macos-tools/contacts-sdk';

// Initialize the client
const client = new ContactsClient();

// Get all contacts
const contacts = client.getAllContacts();
console.log(`Total contacts: ${contacts.length}`);

// Search by name
const results = client.searchByName('John');
for (const contact of results) {
  console.log(contact.fullName);
  console.log(contact.phoneNumbers);
  console.log(contact.emails);
}

// Search by phone number
const phoneResults = client.searchByPhone('+1234567890');

// Search by email
const emailResults = client.searchByEmail('john@example.com');

// Don't forget to close the connection
client.close();
```

## Prerequisites

- **macOS** (Darwin) operating system
- **Node.js** >= 22.0.0
- **Full Disk Access** permission for your terminal or application

### Granting Full Disk Access

To access the Contacts database, your terminal or application needs Full Disk Access:

1. Open **System Settings** (or **System Preferences** on macOS Ventura+)
2. Go to **Privacy & Security** → **Full Disk Access**
3. Click the lock icon to make changes
4. Add your terminal app (e.g., Terminal.app, iTerm.app) or your application
5. Restart the application after granting access

## API Reference

### ContactsClient

#### Constructor

```typescript
new ContactsClient(config?: ContactsConfig)
```

**Options:**
- `databasePath?: string` - Custom path to the Contacts database (optional)
- `readonly?: boolean` - Open in read-only mode (default: `true`)

#### Methods

##### `getAllContacts(limit?: number): Contact[]`

Get all contacts, optionally limited to a specific number.

```typescript
const contacts = client.getAllContacts(50); // Get first 50 contacts
```

##### `getContactById(id: number): Contact | null`

Get a specific contact by their ID.

```typescript
const contact = client.getContactById(123);
if (contact) {
  console.log(contact.fullName);
}
```

##### `searchContacts(options: ContactSearchOptions): Contact[]`

Search contacts with various criteria:

```typescript
interface ContactSearchOptions {
  name?: string;           // Search by name (first, last, middle, nickname)
  phone?: string;          // Search by phone number
  email?: string;          // Search by email
  organization?: string;   // Search by organization
  limit?: number;          // Limit results
  offset?: number;         // Offset for pagination
  caseSensitive?: boolean; // Case-sensitive search (default: false)
}
```

**Example:**
```typescript
const results = client.searchContacts({
  name: 'John',
  organization: 'Apple',
  limit: 10,
});
```

##### `searchByName(name: string, limit?: number): Contact[]`

Convenience method to search contacts by name.

```typescript
const results = client.searchByName('Sarah', 20);
```

##### `searchByPhone(phone: string, limit?: number): Contact[]`

Convenience method to search contacts by phone number. Phone numbers are automatically normalized for matching.

```typescript
const results = client.searchByPhone('+1-555-123-4567');
// Also matches: (555) 123-4567, 5551234567, etc.
```

##### `searchByEmail(email: string, limit?: number): Contact[]`

Convenience method to search contacts by email.

```typescript
const results = client.searchByEmail('john@example.com');
```

##### `searchByOrganization(organization: string, limit?: number): Contact[]`

Convenience method to search contacts by organization.

```typescript
const results = client.searchByOrganization('Apple');
```

##### `getContactCount(): number`

Get the total number of contacts.

```typescript
const count = client.getContactCount();
console.log(`You have ${count} contacts`);
```

##### `close(): void`

Close the database connection.

```typescript
client.close();
```

## Type Definitions

### Contact

```typescript
interface Contact {
  id: number;
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  fullName: string;
  nickname: string | null;
  organization: string | null;
  department: string | null;
  jobTitle: string | null;
  phoneNumbers: ContactPhone[];
  emails: ContactEmail[];
  createdDate: Date | null;
  modifiedDate: Date | null;
  note: string | null;
}
```

### ContactPhone

```typescript
interface ContactPhone {
  number: string;        // Original phone number
  normalized: string;    // Normalized format (e.g., +1234567890)
  label: string | null;  // Label (e.g., "mobile", "home", "work")
}
```

### ContactEmail

```typescript
interface ContactEmail {
  address: string;
  label: string | null;  // Label (e.g., "home", "work")
}
```

## Examples

### Example 1: Search by Multiple Criteria

```typescript
import { ContactsClient } from '@macos-tools/contacts-sdk';

const client = new ContactsClient();

// Find all Johns who work at Apple
const results = client.searchContacts({
  name: 'John',
  organization: 'Apple',
});

results.forEach(contact => {
  console.log(`${contact.fullName} - ${contact.organization}`);
  console.log(`Phone: ${contact.phoneNumbers.map(p => p.number).join(', ')}`);
  console.log(`Email: ${contact.emails.map(e => e.address).join(', ')}`);
  console.log('---');
});

client.close();
```

### Example 2: Phone Number Lookup

```typescript
import { ContactsClient } from '@macos-tools/contacts-sdk';

const client = new ContactsClient();

// Search works with various phone formats
const phone = '+1 (555) 123-4567';
const results = client.searchByPhone(phone);

if (results.length > 0) {
  const contact = results[0];
  console.log(`Found: ${contact.fullName}`);
  console.log(`All numbers:`, contact.phoneNumbers);
} else {
  console.log('Contact not found');
}

client.close();
```

### Example 3: Pagination

```typescript
import { ContactsClient } from '@macos-tools/contacts-sdk';

const client = new ContactsClient();

const pageSize = 50;
let offset = 0;

// Get contacts in batches
while (true) {
  const contacts = client.searchContacts({
    limit: pageSize,
    offset: offset,
  });

  if (contacts.length === 0) break;

  console.log(`Processing contacts ${offset + 1} to ${offset + contacts.length}`);

  // Process contacts...
  contacts.forEach(contact => {
    console.log(contact.fullName);
  });

  offset += pageSize;
}

client.close();
```

### Example 4: Find All Gmail Users

```typescript
import { ContactsClient } from '@macos-tools/contacts-sdk';

const client = new ContactsClient();

const allContacts = client.getAllContacts();

const gmailUsers = allContacts.filter(contact =>
  contact.emails.some(email => email.address.endsWith('@gmail.com'))
);

console.log(`Found ${gmailUsers.length} Gmail users:`);
gmailUsers.forEach(contact => {
  const gmailEmails = contact.emails.filter(e => e.address.endsWith('@gmail.com'));
  console.log(`${contact.fullName}: ${gmailEmails.map(e => e.address).join(', ')}`);
});

client.close();
```

## Utility Functions

### `normalizePhoneNumber(phone: string): string`

Normalize a phone number to a consistent format (removes non-digits, adds country code).

```typescript
import { normalizePhoneNumber } from '@macos-tools/contacts-sdk';

const normalized = normalizePhoneNumber('(555) 123-4567');
console.log(normalized); // "+15551234567"
```

### `phoneNumbersMatch(phone1: string, phone2: string): boolean`

Compare two phone numbers for equality (uses normalized comparison).

```typescript
import { phoneNumbersMatch } from '@macos-tools/contacts-sdk';

const match = phoneNumbersMatch('+1-555-123-4567', '(555) 123-4567');
console.log(match); // true
```

## How It Works

This SDK directly queries the macOS Contacts database using SQLite. The database is typically located at:

```
~/Library/Application Support/AddressBook/AddressBook-v22.abcddb
```

The SDK reads from the following tables:
- `ZABCDRECORD` - Main contacts table
- `ZABCDPHONENUMBER` - Phone numbers
- `ZABCDEMAILADDRESS` - Email addresses

## Limitations

- **Read-only access**: This SDK does not support modifying, creating, or deleting contacts
- **macOS only**: Only works on macOS as it accesses the Apple Contacts database
- **Database schema changes**: Apple may change the database schema in future macOS versions

## Security & Privacy

- This SDK operates in read-only mode by default
- Requires Full Disk Access permission
- No data is sent to external servers
- All operations are performed locally on your machine

## Troubleshooting

### "Operation not permitted" Error

You need to grant Full Disk Access. See [Granting Full Disk Access](#granting-full-disk-access) above.

### Database Not Found

Ensure:
1. You're running on macOS
2. Contacts app is set up on your Mac
3. You have at least one contact saved
4. The default path exists: `~/Library/Application Support/AddressBook/`

### No Results Returned

Check that:
1. Contacts exist in your Contacts app
2. Full Disk Access is granted
3. Your search criteria match existing contacts
4. The Contacts app is not corrupted (try opening it)

## Contributing

Contributions are welcome! Please check the [GitHub repository](https://github.com/caelinsutch/imessage-tools) for contribution guidelines.

## License

MIT

## Related

- [iMessage SDK](/docs/packages/imessage-sdk) - Query iMessage data
- [MCP Server](/docs/mcp-server) - Use with Claude Desktop
