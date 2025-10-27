# @imessage-tools/contacts-sdk

A TypeScript SDK for querying macOS Contacts data. Search and retrieve contact information including names, phone numbers, emails, and organizations from your Mac's Contacts app.

## Features

- 🔍 **Powerful Search**: Search contacts by name, phone number, email, or organization
- 📱 **Phone Number Normalization**: Automatic phone number formatting and matching
- 📧 **Email Support**: Query contacts by email addresses
- 🏢 **Organization Search**: Find contacts by company or organization name
- 💪 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Fast**: Direct SQLite database queries for optimal performance
- 🔐 **Read-Only**: Safe read-only access to your contacts database

## Requirements

- macOS (darwin)
- Node.js >= 14.0.0
- Full Disk Access permission for your terminal or application

## Installation

```bash
npm install @imessage-tools/contacts-sdk
# or
yarn add @imessage-tools/contacts-sdk
# or
pnpm add @imessage-tools/contacts-sdk
```

## Granting Full Disk Access

To access the Contacts database, your terminal or application needs Full Disk Access:

1. Open **System Preferences** (or **System Settings** on macOS Ventura+)
2. Go to **Security & Privacy** → **Privacy** → **Full Disk Access**
3. Click the lock icon to make changes
4. Add your terminal app (e.g., Terminal.app, iTerm.app) or your application

## Quick Start

```typescript
import { ContactsClient } from '@imessage-tools/contacts-sdk';

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

// Advanced search with multiple criteria
const advancedResults = client.searchContacts({
  name: 'John',
  organization: 'Apple',
  limit: 10,
});

// Don't forget to close the connection
client.close();
```

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

##### `getContactById(id: number): Contact | null`

Get a specific contact by their ID.

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

##### `searchByName(name: string, limit?: number): Contact[]`

Convenience method to search contacts by name.

##### `searchByPhone(phone: string, limit?: number): Contact[]`

Convenience method to search contacts by phone number.

##### `searchByEmail(email: string, limit?: number): Contact[]`

Convenience method to search contacts by email.

##### `searchByOrganization(organization: string, limit?: number): Contact[]`

Convenience method to search contacts by organization.

##### `getContactCount(): number`

Get the total number of contacts.

##### `close(): void`

Close the database connection.

### Types

#### Contact

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

#### ContactPhone

```typescript
interface ContactPhone {
  number: string;        // Original phone number
  normalized: string;    // Normalized format (e.g., +1234567890)
  label: string | null;  // Label (e.g., "mobile", "home", "work")
}
```

#### ContactEmail

```typescript
interface ContactEmail {
  address: string;
  label: string | null;  // Label (e.g., "home", "work")
}
```

## Utility Functions

### `normalizePhoneNumber(phone: string): string`

Normalize a phone number to a consistent format (removes non-digits, adds country code).

### `phoneNumbersMatch(phone1: string, phone2: string): boolean`

Compare two phone numbers for equality (uses normalized comparison).

### `formatFullName(...): string`

Format a full name from first, middle, last name components.

## Examples

See the [examples](./examples) directory for more detailed usage examples:

- `basic-usage.ts` - Comprehensive examples of all SDK features

## How It Works

This SDK directly queries the macOS Contacts database (`AddressBook-v22.abcddb`) using SQLite. The database is typically located at:

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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
