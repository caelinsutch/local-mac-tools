import { serve } from "@hono/node-server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { zodown } from "zodown";

const server = new McpServer({
	name: "imessage-tools",
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

const router = new Hono();

router.post("/", async (c: Context) => {
	const { req, res } = toReqRes(c.req.raw);
	const transport: StreamableHTTPServerTransport =
		new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});
	await server.connect(transport);
	try {
		await transport.handleRequest(req, res, req.body as any);
	} catch {
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

const port = 3000;

// For local development with Bun
if (import.meta.main) {
	console.log(`Starting MCP server on http://localhost:${port}`);
	console.log(`MCP endpoint: http://localhost:${port}`);
	console.log("");
	console.log("Add this to your Claude Desktop config:");
	console.log(
		JSON.stringify(
			{
				"imessage-tools": {
					command: "npx",
					args: ["-y", "mcp-remote", `http://localhost:${port}`],
				},
			},
			null,
			2,
		),
	);
	console.log("");
}

serve({
  fetch: router.fetch,
  port,
})