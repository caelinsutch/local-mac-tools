import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

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

/**
 * Registers a tool with the MCP server
 */
export function registerTool<T extends Record<string, unknown>>(
	server: McpServer,
	name: string,
	config: Omit<Tool, "name">,
	handler: (args: T) => Promise<{
		content: Array<{ type: string; text: string }>;
	}>,
): void {
	server.registerTool(
		name,
		{
			title: name,
			...config,
		},
		handler,
	);
}
