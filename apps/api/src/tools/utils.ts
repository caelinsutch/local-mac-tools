/**
 * Utility functions for MCP tools
 */

/**
 * Error response content for MCP tools
 */
export interface ErrorContent {
	content: [
		{
			type: "text";
			text: string;
		},
	];
}

/**
 * Creates a formatted error response for MCP tool returns
 * @param prefix Error message prefix (e.g., "Error searching messages")
 * @param error The error object
 * @returns Formatted error content object
 */
export function formatToolError(prefix: string, error: unknown): ErrorContent {
	const message = error instanceof Error ? error.message : "Unknown error";
	return {
		content: [
			{
				type: "text",
				text: `${prefix}: ${message}`,
			},
		],
	};
}
