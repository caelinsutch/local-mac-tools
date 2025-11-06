#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { createLogger } from "@macos-tools/logger";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { type Context, Hono } from "hono";
import { createMcpServer } from "./server";
import { registerContactsTools } from "./tools/contacts";
import { registerIMessageTools } from "./tools/imessage";
import { registerDatabaseTools } from "./tools/imessage-database";

const logger = createLogger({ service: "mcp-server" });

// Create and configure MCP server
const server = createMcpServer();

// Register all tools
registerContactsTools(server);
registerIMessageTools(server);
registerDatabaseTools(server);

// Create HTTP router
const router = new Hono();

router.post("/", async (c: Context) => {
	logger.info("Received POST request");

	const { req, res } = toReqRes(c.req.raw);
	const transport: StreamableHTTPServerTransport =
		new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});
	await server.connect(transport);
	try {
		// biome-ignore lint/suspicious/noExplicitAny: Requests body typed oddly
		await transport.handleRequest(req, res, (req as any).body as unknown);
	} catch (error) {
		logger.error("Error handling MCP request", error);
		if (!res.headersSent) {
			res.writeHead(500).end(
				JSON.stringify({
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: "Internal server error",
					},
					id: null,
				}),
			);
		}
	}
	return toFetchResponse(res);
});

router.get("/", (c: Context) => {
	logger.warn("Received GET request - method not allowed");
	const { res } = toReqRes(c.req.raw);
	res.writeHead(405).end(
		JSON.stringify({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Method not allowed.",
			},
			id: null,
		}),
	);
	return toFetchResponse(res);
});

router.delete("/", (c: Context) => {
	logger.warn("Received DELETE request - method not allowed");
	const { res } = toReqRes(c.req.raw);
	res.writeHead(405).end(
		JSON.stringify({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Method not allowed.",
			},
			id: null,
		}),
	);
	return toFetchResponse(res);
});

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

// Display startup information
logger.info(`Starting MCP server on http://localhost:${port}`);
logger.info(`MCP endpoint: http://localhost:${port}`);
console.log("");
console.log("✅ MCP Server is running!");
console.log("");
console.log("Add this to your Claude Desktop config:");
console.log(
	JSON.stringify(
		{
			"macos-tools": {
				command: "npx",
				args: ["-y", "@macos-tools/mcp-server"],
				env: {
					PORT: port.toString(),
				},
			},
		},
		null,
		2,
	),
);
console.log("");

serve({
	fetch: router.fetch,
	port,
});

logger.info("MCP server started successfully");
