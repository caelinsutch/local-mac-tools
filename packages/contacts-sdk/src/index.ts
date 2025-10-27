/**
 * @imessage-tools/contacts-sdk
 *
 * A TypeScript SDK for querying macOS Contacts data
 */

export { ContactsClient } from "./client";
export type {
	Contact,
	ContactEmail,
	ContactPhone,
	ContactSearchOptions,
	ContactsConfig,
} from "./types";
export {
	cfTimeToDate,
	dateToCfTime,
	formatFullName,
	getDefaultDatabasePath,
	normalizeLabel,
	normalizePhoneNumber,
	phoneNumbersMatch,
	validateDatabasePath,
} from "./utils";
