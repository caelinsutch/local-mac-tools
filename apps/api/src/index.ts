#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { ContactsClient } from "@macos-tools/contacts-sdk";
import { createLogger } from "@macos-tools/logger";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { zodown } from "zodown";

const logger = createLogger({ service: "mcp-server" });

const server = new McpServer({
	name: "macos-tools",
	version: "1.0.0",
});

server.registerTool(
	"helloWorld",
	{
		title: "helloWorld",
		description: "Say hello to the world",
	},
	() => ({
		content: [{ type: "text", text: String("Hello World!") }],
	}),
);

const contactsClient = new ContactsClient();

const test = z.string();

server.registerTool(
	"echoInput",
	{
		title: "Echo Input",
		description: "Returns the input supplied to this tool.",
		inputSchema: {
			value: zodown(test),
		},
	},
	(args) => {
		return {
			content: [{ type: "text", text: String(args.value) }],
		};
	},
);

server.registerTool(
	"contacts_search",
	{
		title: "contacts_search",
		description:
			"Search contacts by name or phone number. Automatically detects search type if not specified.",
		inputSchema: {
			name: z.string().optional(),
			phone: z.string().optional(),
		},
	},
	async (args) => {
		const { name, phone } = args;
		const query = phone || name;

		logger.info("contacts_search called", { name, phone });

		try {
			// Auto-detect search type if not specified
			const contacts = phone
				? await contactsClient.searchByPhone(phone)
				: await contactsClient.searchByName(name);

			logger.info("contacts_search results", {
				query,
				resultCount: contacts.length,
			});

			if (contacts.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `No contacts found matching "${query}"`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: contacts
							.map((contact) => `${contact.name} - ${contact.phone}`)
							.join("\n"),
					},
				],
			};
		} catch (error) {
			logger.error("contacts_search error", error);
			return {
				content: [
					{
						type: "text",
						text: `Error searching contacts: ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
			};
		}
	},
);

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
		await transport.handleRequest(req, res, req.body as unknown);
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
