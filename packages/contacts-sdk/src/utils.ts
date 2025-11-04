import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Execute an OSAScript (AppleScript) and return the result
 */
export async function executeOSAScript(script: string): Promise<string> {
	const tmpFile = join(tmpdir(), `osascript-${Date.now()}.scpt`);
	writeFileSync(tmpFile, script);

	try {
		const result = execSync(`osascript "${tmpFile}"`, {
			encoding: "utf-8",
		}).trim();

		return result;
	} finally {
		unlinkSync(tmpFile);
	}
}

/**
 * Parse a delimited OSAScript result into key-value pairs
 * Format: "value1|value2;value3|value4"
 */
export function parseDelimitedResult<T>(
	result: string,
	parser: (parts: string[]) => T | null,
	itemDelimiter = ";",
	valueDelimiter = "|",
): T[] {
	if (result === "[]") {
		return [];
	}

	const items: T[] = [];
	const parts = result.split(itemDelimiter);

	for (const part of parts) {
		const values = part.split(valueDelimiter);
		const parsed = parser(values);
		if (parsed) {
			items.push(parsed);
		}
	}

	return items;
}