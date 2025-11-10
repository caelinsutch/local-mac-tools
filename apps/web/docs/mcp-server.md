---
sidebar_position: 2
---

# MCP Server

The macOS Tools MCP Server provides AI assistants like Claude with access to your macOS Contacts and iMessage data through the [Model Context Protocol](https://modelcontextprotocol.io).

## Quick Start

The fastest way to use the MCP server with Claude Desktop:

1. Open your Claude Desktop configuration file:
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Add the MCP server configuration:
   ```json
   {
     "mcpServers": {
       "macos-tools": {
         "command": "npx",
         "args": ["-y", "@macos-tools/mcp-server"]
       }
     }
   }
   ```

3. Restart Claude Desktop

4. Look for the 🔨 hammer icon in the input box - your tools are ready!

## Prerequisites

### Required

- **macOS** operating system
- **Node.js** >= 14.0.0 (>= 22.0.0 recommended)
- **Full Disk Access** permission (see setup below)

### Granting Full Disk Access

The MCP server needs Full Disk Access to read the macOS Contacts and iMessage databases:

1. Open **System Settings** (or **System Preferences** on older macOS)
2. Navigate to **Privacy & Security** → **Full Disk Access**
3. Click the lock icon 🔒 to make changes (requires admin password)
4. Click the **+** button
5. Add **Claude** or your terminal application:
   - **Claude**: `/Applications/Claude.app`
   - **Terminal**: `/Applications/Utilities/Terminal.app`
   - **iTerm**: `/Applications/iTerm.app`
   - **Warp**: `/Applications/Warp.app`
6. Toggle the switch to enable access
7. **Restart the application** for changes to take effect

## Available Tools

### Contacts Tools

#### `contacts_search`

Search contacts with multiple criteria.

**Parameters:**
- `name` (optional): Search by name
- `phone` (optional): Search by phone number
- `email` (optional): Search by email address
- `organization` (optional): Search by organization
- `limit` (optional): Maximum number of results

**Example prompts:**
- "Find all contacts named John"
- "Find Sarah who works at Apple"
- "Search for contacts at Microsoft"

#### `contacts_search_by_name`

Quick search by name only.

**Parameters:**
- `name` (required): The name to search for
- `limit` (optional): Maximum number of results

**Example prompts:**
- "Find John's contact"
- "Show me contacts named Sarah"

#### `contacts_search_by_phone`

Search by phone number with automatic normalization.

**Parameters:**
- `phone` (required): Phone number in any format
- `limit` (optional): Maximum number of results

**Example prompts:**
- "Who has the phone number 555-123-4567?"
- "Find contact with phone +1 (555) 123-4567"

#### `contacts_search_by_email`

Search by email address.

**Parameters:**
- `email` (required): Email address
- `limit` (optional): Maximum number of results

**Example prompts:**
- "Find the contact with email john@example.com"
- "Who has the email address sarah@company.com?"

#### `contacts_list`

Get all contacts with optional pagination.

**Parameters:**
- `limit` (optional): Maximum number of contacts to return

**Example prompts:**
- "Show me all my contacts"
- "List my first 20 contacts"

#### `contacts_get`

Get a specific contact by ID.

**Parameters:**
- `id` (required): The contact ID

**Example prompts:**
- "Get contact with ID 42"
- "Show me details for contact 123"

#### `contacts_count`

Get the total number of contacts.

**Example prompts:**
- "How many contacts do I have?"
- "What's my total contact count?"

## Usage Examples

Once configured, you can ask Claude natural language questions:

### Finding Contacts

```
Find John's phone number
```

```
Who works at Apple in my contacts?
```

```
Search for contacts with @gmail.com email addresses
```

### Browsing Contacts

```
How many contacts do I have?
```

```
Show me my first 10 contacts
```

```
List all my work contacts
```

## Configuration Options

### Custom Port

To run the MCP server on a custom port:

```json
{
  "mcpServers": {
    "macos-tools": {
      "command": "npx",
      "args": ["-y", "@macos-tools/mcp-server"],
      "env": {
        "PORT": "8080"
      }
    }
  }
}
```

### Local Development

For development, you can connect to a locally running server:

```json
{
  "mcpServers": {
    "macos-tools": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3000"]
    }
  }
}
```

Then start the development server:

```bash
git clone https://github.com/caelinsutch/imessage-tools.git
cd imessage-tools
pnpm install
pnpm --filter @macos-tools/mcp-server dev
```

## Troubleshooting

### Tools Not Appearing in Claude Desktop

**Solutions:**
1. Verify the configuration file path is correct
2. Ensure the JSON configuration is valid
3. Completely quit Claude Desktop (not just close the window) and restart
4. Check that Node.js is installed and accessible: `node --version`

### "Permission denied" or "Unable to open database" Errors

**Solution:** Grant Full Disk Access to Claude or your terminal application (see [Granting Full Disk Access](#granting-full-disk-access) above). After granting access, restart the application.

### No Contacts Returned

**Solutions:**
1. Verify you have contacts in the macOS Contacts app
2. Check that Full Disk Access is granted
3. Try opening the Contacts app to ensure it's working
4. Check the database exists: `ls ~/Library/Application\ Support/AddressBook/`

### "Cannot find module" Error

**Solution:** The npx command should automatically install dependencies. If you see module errors:

```bash
# Clear npx cache and try again
npx --yes @macos-tools/mcp-server
```

## Security & Privacy

- **Read-only access**: The MCP server cannot modify, create, or delete contacts
- **Local only**: All data remains on your machine
- **No external requests**: No data is sent to external servers
- **Requires explicit permission**: Full Disk Access must be granted manually

## Architecture

```
┌─────────────────┐
│  Claude Desktop │
│   (MCP Client)  │
└────────┬────────┘
         │ Model Context Protocol
         ↓
┌─────────────────┐
│  MCP Server     │
│  (Node.js)      │
└────────┬────────┘
         │ SQLite Queries
         ↓
┌─────────────────┐
│  macOS Databases│
│  - Contacts DB  │
│  - iMessage DB  │
└─────────────────┘
```

## Next Steps

- Learn about the [Contacts SDK](/docs/packages/contacts-sdk) used by the MCP server
- Explore the [iMessage SDK](/docs/packages/imessage-sdk) for message access
- Check out the [GitHub repository](https://github.com/caelinsutch/imessage-tools) for source code

## Need Help?

- [Report an issue](https://github.com/caelinsutch/imessage-tools/issues)
- [Learn more about MCP](https://modelcontextprotocol.io)
- [Claude Desktop documentation](https://claude.ai/desktop)
