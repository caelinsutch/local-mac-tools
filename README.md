# macOS Tools MCP Server

A Model Context Protocol (MCP) server that provides AI assistants like Claude with secure, local access to your macOS system data. Query contacts, send iMessages, and interact with macOS apps directly through natural language - all running locally on your machine.

## Overview

This MCP server enables AI assistants to interact with macOS system features through a standardized protocol:

- **Contacts Integration** - Search and retrieve contact information from macOS Contacts/AddressBook
- **iMessage Access** - Query iMessage conversations, messages, and attachments (SDK ready)
- **AppleScript/OSA Integration** - Execute AppleScript commands for general macOS app interaction
- **Privacy-First** - All data stays local on your machine; no cloud processing required

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard that enables AI assistants to securely connect to external data sources and tools. This server implements MCP to give Claude and other compatible AI assistants controlled access to your macOS system data.

## Installation

### For Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### For Local Development

```bash
# Install dependencies
pnpm install

# Run the MCP server
pnpm --filter @macos-tools/mcp-server dev

# The server will start on http://localhost:3000
# Use the MCP Inspector to test: pnpm --filter @macos-tools/mcp-server inspect
```

## Available Tools

### `contacts_search`
Search your macOS contacts by name or phone number.

**Parameters:**
- `name` (optional): Search by contact name
- `phone` (optional): Search by phone number

**Example:**
```
"Find the phone number for John Doe"
"Search for contact with phone number 555-0123"
```

## Packages

This monorepo contains the following packages:

### `@macos-tools/mcp-server` (apps/api)
The main MCP server that exposes macOS functionality to AI assistants. Built with Hono and the MCP SDK.

### `@macos-tools/contacts-sdk`
TypeScript SDK for querying macOS Contacts data. Retrieves contact information, phone numbers, emails, and other details from the local AddressBook database.

### `@macos-tools/imessage-sdk`
TypeScript SDK for querying iMessage data. Access messages, conversations, contacts, and attachments from the local iMessage database.

### `@macos-tools/logger`
Shared Winston-based logging utility used across all packages.

## Requirements

- **OS**: macOS (Darwin) only
- **Node**: >= 14.0.0 (>= 22.0.0 recommended for development)
- **Package Manager**: pnpm 10.20.0 (for development)
- **Permissions**: Full Disk Access may be required for accessing Contacts and iMessage databases

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run the MCP server in watch mode
pnpm --filter @macos-tools/mcp-server dev

# Type checking
pnpm run check-types

# Lint
pnpm run lint

# Format code
pnpm run format
```

## Project Structure

```
├── apps/
│   └── api/                    # MCP server (published as @macos-tools/mcp-server)
├── packages/
│   ├── contacts-sdk/           # macOS Contacts SDK
│   ├── imessage-sdk/           # iMessage SDK
│   ├── logger/                 # Shared logging utility
│   └── typescript-config/      # Shared TypeScript configuration
└── package.json                # Monorepo root
```

## Roadmap

- [x] Contacts search functionality
- [x] Basic MCP server implementation
- [ ] iMessage query tools (SDK complete, MCP integration pending)
- [ ] Send iMessages through MCP
- [ ] General AppleScript/OSA command execution
- [ ] Notes app integration

## License

GNUv3