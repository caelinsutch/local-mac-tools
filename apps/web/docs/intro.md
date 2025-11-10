---
sidebar_position: 1
slug: /
---

# Introduction

Welcome to **macOS Tools** - a comprehensive toolkit for integrating macOS system data with AI assistants through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io).

## What is macOS Tools?

macOS Tools is a monorepo containing TypeScript SDKs and an MCP server that provides AI assistants like Claude with secure, local access to your macOS system data. All data processing happens locally on your machine - no cloud services required.

## Key Features

- **🔐 Privacy-First**: All data stays local on your machine
- **📱 Contacts Integration**: Search and retrieve contact information from macOS Contacts
- **💬 iMessage Access**: Query iMessage conversations, messages, and attachments
- **🤖 AI-Ready**: MCP server for seamless integration with Claude and other AI assistants
- **⚡ Type-Safe**: Full TypeScript support with comprehensive type definitions
- **📦 Modular**: Use individual SDKs or the complete MCP server

## Available Packages

### MCP Server (`@macos-tools/mcp-server`)

The main MCP server that exposes macOS functionality to AI assistants. Install it in Claude Desktop to enable natural language queries like "Find John's phone number" or "Show my recent messages."

[Learn more →](/docs/mcp-server)

### Contacts SDK (`@macos-tools/contacts-sdk`)

TypeScript SDK for querying macOS Contacts data. Search contacts by name, phone number, email, or organization.

[Learn more →](/docs/packages/contacts-sdk)

### iMessage SDK (`@macos-tools/imessage-sdk`)

TypeScript SDK for querying iMessage data. Access messages, conversations, contacts, and attachments from the local iMessage database.

[Learn more →](/docs/packages/imessage-sdk)

## What is Model Context Protocol (MCP)?

[Model Context Protocol](https://modelcontextprotocol.io) is an open standard that enables AI assistants to securely connect to external data sources and tools. This project implements MCP to give Claude and other compatible AI assistants controlled access to your macOS system data.

## Quick Start

### For Claude Desktop Users

Add to your Claude Desktop configuration:

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

[Full installation guide →](/docs/mcp-server)

### For Developers

```bash
# Clone the repository
git clone https://github.com/caelinsutch/imessage-tools.git
cd imessage-tools

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run the MCP server in development mode
pnpm --filter @macos-tools/mcp-server dev
```

## Requirements

- **OS**: macOS (Darwin) only
- **Node.js**: >= 14.0.0 (>= 22.0.0 recommended)
- **Permissions**: Full Disk Access required for accessing Contacts and iMessage databases

## Getting Help

- **Documentation**: Browse the sidebar for detailed guides
- **GitHub Issues**: [Report bugs or request features](https://github.com/caelinsutch/imessage-tools/issues)
- **MCP Documentation**: [Learn about Model Context Protocol](https://modelcontextprotocol.io)

## License

This project is licensed under GNUv3. See the [LICENSE](https://github.com/caelinsutch/imessage-tools/blob/main/LICENSE) file for details.
