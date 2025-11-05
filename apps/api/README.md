# macOS Tools MCP Server

A Model Context Protocol (MCP) server that provides access to macOS Contacts data through Claude Desktop and other MCP clients.

## Quick Start

The fastest way to get started is via npx:

```bash
npx @macos-tools/mcp-server
```

Or add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "macos-tools": {
      "command": "npx",
      "args": ["-y", "@macos-tools/mcp-server"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

Then restart Claude Desktop to use the MCP tools.

## Features

- **7 MCP Tools** for querying macOS Contacts:
  - `contacts_list` - Get all contacts with optional pagination
  - `contacts_get` - Get a specific contact by ID
  - `contacts_search` - Advanced multi-criteria search
  - `contacts_search_by_name` - Quick name search
  - `contacts_search_by_phone` - Phone number search with auto-normalization
  - `contacts_search_by_email` - Email address search
  - `contacts_count` - Get total contact count
- Built with Hono and mcp-handler
- Direct SQLite access for fast performance
- Full TypeScript support

## Prerequisites

### Required
- **macOS** operating system (darwin)
- **Node.js** >= 22.0.0
- **pnpm** >= 10.20.0
- **Full Disk Access** permission (see setup below)

### Setting Up Full Disk Access

The MCP server needs Full Disk Access to read the macOS Contacts database:

1. Open **System Settings** (macOS Ventura+) or **System Preferences** (older macOS)
2. Navigate to **Privacy & Security** → **Full Disk Access**
3. Click the lock icon 🔒 to make changes (requires admin password)
4. Click the **+** button
5. Add your terminal application:
   - **Terminal.app**: `/Applications/Utilities/Terminal.app`
   - **iTerm**: `/Applications/iTerm.app`
   - **Warp**: `/Applications/Warp.app`
   - Or your preferred terminal
6. Toggle the switch to enable access
7. **Restart your terminal** for changes to take effect

## Installation

From the repository root:

```bash
pnpm install
```

Or from the `apps/api` directory:

```bash
cd apps/api
pnpm install
```

## Port Configuration

The server port can be configured via environment variables:

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and set your desired port (default: 3000):
```env
PORT=3000
```

You can also set the port directly when running:
```bash
PORT=8080 pnpm run dev
```

## Development

Start the development server:

```bash
pnpm run dev
```

The server will start at `http://localhost:3000` (or the port specified in your `.env` file).

Visit `http://localhost:3000/` to see the available tools and server info.

## Building for Production

Build the server for production:

```bash
pnpm run build
```

This will create an optimized production build in the `dist` directory using tsup.

## Running in Production

After building, start the production server:

```bash
pnpm run start
```

Or with a custom port:

```bash
PORT=8080 pnpm run start
```

## Running via npx

You can run the server directly via npx without cloning the repository:

```bash
npx @macos-tools/mcp-server
```

Or with a custom port:

```bash
PORT=8080 npx @macos-tools/mcp-server
```

This is useful for quick setup or for Claude Desktop configurations.

## Connecting to Claude Desktop

### Step 1: Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the MCP server configuration:

**Option 1: Connect to a locally running server**
```json
{
  "mcpServers": {
    "imessage-contacts": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:3000"
      ]
    }
  }
}
```

**Note**: If you configured a custom port in your `.env` file, make sure to update the URL accordingly (e.g., `http://localhost:8080`).

**Option 2: Run directly via npx (simpler setup)**
```json
{
  "mcpServers": {
    "imessage-contacts": {
      "command": "npx",
      "args": [
        "-y",
        "@macos-tools/mcp-server"
      ],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

This option automatically starts the server when Claude Desktop launches.

**Note**: If the config file doesn't exist, you may need to enable Developer mode in Claude Desktop settings first.

### Step 2: Start the Server

Make sure the MCP server is running:

```bash
pnpm run dev
```

### Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop to pick up the configuration changes.

### Step 4: Verify Connection

After restarting, you should see a **🔨 hammer icon** in the bottom right corner of the Claude Desktop input box, indicating MCP tools are available.

Click the hammer icon to see the available tools from the contacts MCP server.

## Using the Tools in Claude

Once connected, you can ask Claude to use the contacts tools:

### Example Prompts

**Get contact count:**
```
How many contacts do I have?
```

**Search by name:**
```
Find all contacts named John
```

**Search by email:**
```
Find the contact with email john@example.com
```

**Search by phone:**
```
Who has the phone number +1-555-123-4567?
```

**Get all contacts (limited):**
```
Show me my first 10 contacts
```

**Advanced search:**
```
Find contacts named Sarah who work at Apple
```

## Available MCP Tools

### `contacts_list`
Get all contacts from macOS Contacts app.

**Parameters:**
- `limit` (optional): Maximum number of contacts to return

**Example:**
```json
{
  "limit": 10
}
```

### `contacts_get`
Get a specific contact by their ID.

**Parameters:**
- `id` (required): The contact ID (integer)

**Example:**
```json
{
  "id": 123
}
```

### `contacts_search`
Search contacts with multiple criteria. All criteria are optional and combined with AND logic.

**Parameters:**
- `name` (optional): Search by name (first, last, middle, or nickname)
- `phone` (optional): Search by phone number
- `email` (optional): Search by email address
- `limit` (optional): Maximum number of results
- `offset` (optional): Offset for pagination
- `caseSensitive` (optional): Case-sensitive search (default: false)

**Example:**
```json
{
  "name": "John",
  "limit": 5
}
```

### `contacts_search_by_name`
Quick search by name (searches first, last, middle name, and nickname).

**Parameters:**
- `name` (required): The name to search for
- `limit` (optional): Maximum number of results

**Example:**
```json
{
  "name": "Sarah",
  "limit": 10
}
```

### `contacts_search_by_phone`
Search by phone number with automatic normalization.

**Parameters:**
- `phone` (required): The phone number to search for
- `limit` (optional): Maximum number of results

**Example:**
```json
{
  "phone": "+1-555-123-4567",
  "limit": 5
}
```

### `contacts_search_by_email`
Search by email address.

**Parameters:**
- `email` (required): The email address to search for (must be valid email format)
- `limit` (optional): Maximum number of results

**Example:**
```json
{
  "email": "john@example.com"
}
```

### `contacts_count`
Get the total number of contacts.

**Parameters:** None

## Troubleshooting

### "Permission denied" or "Unable to open database" errors

**Solution:** Ensure Full Disk Access is granted to your terminal application (see Prerequisites section above). After granting access, restart your terminal and try again.

### Tools not appearing in Claude Desktop

**Solutions:**
1. Verify the configuration file path is correct
2. Ensure the JSON configuration is valid (use a JSON validator)
3. Make sure the MCP server is running (`bun run dev`)
4. Completely quit Claude Desktop (not just close the window) and restart
5. Check Claude Desktop logs for errors

### "Cannot find module '@macos-tools/contacts-sdk'" error

**Solution:** Run `pnpm install` from the repository root to install workspace dependencies.

### No contacts returned from searches

**Solutions:**
1. Verify you have contacts in the macOS Contacts app
2. Check that Full Disk Access is granted
3. Try opening the Contacts app to ensure the database is accessible
4. Check the database path: `~/Library/Application Support/AddressBook/AddressBook-v22.abcddb`

### Connection timeout or slow responses

**Solution:** The `maxDuration` is set to 60 seconds. For large contact databases, initial queries may take longer. Consider using the `limit` parameter to reduce result sizes.

## Database Information

This MCP server directly queries the macOS Contacts SQLite database located at:

```
~/Library/Application Support/AddressBook/AddressBook-v22.abcddb
```

The database uses the following tables:
- `ZABCDRECORD` - Main contacts table
- `ZABCDPHONENUMBER` - Phone numbers
- `ZABCDEMAILADDRESS` - Email addresses

**Note:** This is read-only access. The MCP server cannot create, modify, or delete contacts.

## Deployment

**Important:** This MCP server is designed for **local development only**. It requires direct file system access to the macOS Contacts database and cannot be deployed to Cloudflare Workers or other serverless platforms.

If you need remote access to contacts data, consider:
1. Running the server locally and using ngrok or similar tunneling service
2. Creating a separate API service that runs on a macOS machine
3. Using macOS Shortcuts or AppleScript to export contacts to a remote-accessible format

## Architecture

```
┌─────────────────┐
│  Claude Desktop │
│   (MCP Client)  │
└────────┬────────┘
         │ stdio via mcp-remote
         ↓
┌─────────────────┐
│  Hono MCP       │
│  Server         │
│  (localhost)    │
└────────┬────────┘
         │ ContactsClient
         ↓
┌─────────────────┐
│  SQLite DB      │
│  (macOS         │
│   Contacts)     │
└─────────────────┘
```

## Security & Privacy

- **Read-only access**: Cannot modify, create, or delete contacts
- **Local only**: All data remains on your machine
- **No external requests**: No data sent to external servers
- **Full Disk Access required**: macOS security permission needed for database access

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [mcp-handler](https://www.npmjs.com/package/mcp-handler) - MCP adapter for Hono
- [@macos-tools/contacts-sdk](../../packages/contacts-sdk) - Contacts database SDK
- [Zod](https://zod.dev/) - Schema validation
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite database access
