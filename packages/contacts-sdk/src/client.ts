import {
	executeOSAScript,
	parseDelimitedResult,
} from "@macos-tools/applescript-utils";

export interface Contact {
	name: string;
	phone: string;
}

export interface SendMessageOptions {
	/**
	 * The recipient's phone number or email address
	 */
	recipient: string;
	/**
	 * The message text to send
	 */
	message: string;
}

export interface SendMessageResult {
	success: boolean;
	error?: string;
}

export class ContactsClient {
	/**
	 * Send an iMessage or SMS to a recipient
	 * Attempts SMS first, falls back to iMessage if SMS fails
	 * @param options The message options
	 * @returns Promise with result indicating success or error
	 */
	async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
		const { recipient, message } = options;

		// Escape the message for AppleScript
		const escapedMessage = message.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		const escapedRecipient = recipient
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"');

		const script = `tell application "Messages"
	set smsMessageType to id of 1st account whose service type = SMS
	set smsRecipient to participant "${escapedRecipient}" of account id smsMessageType
	set iMessageType to (id of 1st account whose service type = iMessage)
	set iMessageRecipient to participant "${escapedRecipient}" of account id iMessageType

	try
		send "${escapedMessage}" to smsRecipient
		return "success"
	on error
		try
			send "${escapedMessage}" to iMessageRecipient
			return "success"
		on error errmsg
			return "error:" & errmsg
		end try
	end try
end tell`;

		try {
			const result = await executeOSAScript(script);

			if (result.startsWith("error:")) {
				return {
					success: false,
					error: result.substring(6),
				};
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

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

		const result = await executeOSAScript(script);

		return parseDelimitedResult(result, ([name, phone]) => {
			if (name && phone) {
				return { name, phone };
			}
			return null;
		});
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

		const result = await executeOSAScript(script);

		return parseDelimitedResult(result, ([name, phone]) => {
			if (name && phone) {
				return { name, phone };
			}
			return null;
		});
	}
}
