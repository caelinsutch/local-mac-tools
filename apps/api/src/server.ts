import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Creates and configures the MCP server instance
 */
export function createMcpServer(): McpServer {
	const server = new McpServer({
		name: "macos-tools",
		version: "1.0.0",
	});

	return server;
}
