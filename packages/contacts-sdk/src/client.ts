import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface Contact {
	name: string;
	phone: string;
}

export class ContactsClient {
	/**
	 * Search contacts by name
	 */
	async searchByName(name: string): Promise<Contact[]> {
		const script = `tell application "Contacts"
	set matchingContacts to every person whose name contains "${name}"

	if (count of matchingContacts) = 0 then
		return "[]"
	end if

	set resultList to {}
	repeat with aPerson in matchingContacts
		set personName to name of aPerson

		try
			set phoneList to phones of aPerson
			repeat with aPhone in phoneList
				set phoneValue to value of aPhone
				set end of resultList to personName & "|" & phoneValue
			end repeat
		end try
	end repeat

	set AppleScript's text item delimiters to ";"
	return resultList as text
end tell`;

		const tmpFile = join(tmpdir(), `contacts-search-${Date.now()}.scpt`);
		writeFileSync(tmpFile, script);

		try {
			const result = execSync(`osascript "${tmpFile}"`, {
				encoding: "utf-8",
			}).trim();

			if (result === "[]") {
				return [];
			}

			const contacts: Contact[] = [];
			const items = result.split(";");

			for (const item of items) {
				const [name, phone] = item.split("|");
				if (name && phone) {
					contacts.push({ name, phone });
				}
			}

			return contacts;
		} finally {
			unlinkSync(tmpFile);
		}
	}

	/**
	 * Search contacts by phone number
	 */
	async searchByPhone(phone: string): Promise<Contact[]> {
		const script = `tell application "Contacts"
	set matchingPeople to (people whose value of phones contains "${phone}")

	if (count of matchingPeople) = 0 then
		return "[]"
	end if

	set resultList to {}
	repeat with aPerson in matchingPeople
		set personName to name of aPerson

		try
			set phoneList to phones of aPerson
			repeat with aPhone in phoneList
				set phoneValue to value of aPhone
				if phoneValue contains "${phone}" then
					set end of resultList to personName & "|" & phoneValue
				end if
			end repeat
		end try
	end repeat

	set AppleScript's text item delimiters to ";"
	return resultList as text
end tell`;

		const tmpFile = join(tmpdir(), `contacts-search-${Date.now()}.scpt`);
		writeFileSync(tmpFile, script);

		try {
			const result = execSync(`osascript "${tmpFile}"`, {
				encoding: "utf-8",
			}).trim();

			if (result === "[]") {
				return [];
			}

			const contacts: Contact[] = [];
			const items = result.split(";");

			for (const item of items) {
				const [name, phone] = item.split("|");
				if (name && phone) {
					contacts.push({ name, phone });
				}
			}

			return contacts;
		} finally {
			unlinkSync(tmpFile);
		}
	}
}