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
	set matchingContacts to {}
	set allPeople to every person

	repeat with aPerson in allPeople
		set personPhones to phones of aPerson
		repeat with aPhone in personPhones
			if value of aPhone contains "${phone}" then
				set personName to name of aPerson
				set phoneValue to value of aPhone
				set end of matchingContacts to personName & "|" & phoneValue
				exit repeat
			end if
		end repeat
	end repeat

	if (count of matchingContacts) = 0 then
		return "[]"
	end if

	set AppleScript's text item delimiters to ";"
	return matchingContacts as text
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