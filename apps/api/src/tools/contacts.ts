import { ContactsClient } from "@macos-tools/contacts-sdk";
import { createLogger } from "@macos-tools/logger";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";

const logger = createLogger({ service: "mcp-server:contacts" });

/**
 * Registers contact-related tools with the MCP server
 */
export function registerContactsTools(server: McpServer): void {
	const contactsClient = new ContactsClient();

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
					: name
						? await contactsClient.searchByName(name)
						: [];

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
}
