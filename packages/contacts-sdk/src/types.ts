/**
 * Type definitions for Contacts SDK
 */

/**
 * Configuration for ContactsClient
 */
export interface ContactsConfig {
	/**
	 * Path to the Contacts database
	 * Default: ~/Library/Application Support/AddressBook/AddressBook-v22.abcddb
	 */
	databasePath?: string;

	/**
	 * Whether to open the database in read-only mode
	 * Default: true
	 */
	readonly?: boolean;
}

/**
 * Contact record from macOS Contacts
 */
export interface Contact {
	/**
	 * Unique identifier for the contact (ROWID from database)
	 */
	id: number;

	/**
	 * UUID for the contact
	 */
	uuid: string;

	/**
	 * First name
	 */
	firstName: string | null;

	/**
	 * Last name
	 */
	lastName: string | null;

	/**
	 * Middle name
	 */
	middleName: string | null;

	/**
	 * Full name (computed from first, middle, and last name)
	 */
	fullName: string;

	/**
	 * Nickname
	 */
	nickname: string | null;

	/**
	 * Organization/Company name
	 */
	organization: string | null;

	/**
	 * Department
	 */
	department: string | null;

	/**
	 * Job title
	 */
	jobTitle: string | null;

	/**
	 * Phone numbers associated with this contact
	 */
	phoneNumbers: ContactPhone[];

	/**
	 * Email addresses associated with this contact
	 */
	emails: ContactEmail[];

	/**
	 * Creation date
	 */
	createdDate: Date | null;

	/**
	 * Last modification date
	 */
	modifiedDate: Date | null;

	/**
	 * Note/additional information
	 */
	note: string | null;
}

/**
 * Phone number for a contact
 */
export interface ContactPhone {
	/**
	 * Phone number
	 */
	number: string;

	/**
	 * Normalized phone number (digits only, with country code if available)
	 */
	normalized: string;

	/**
	 * Label (e.g., "mobile", "home", "work", "iPhone")
	 */
	label: string | null;
}

/**
 * Email address for a contact
 */
export interface ContactEmail {
	/**
	 * Email address
	 */
	address: string;

	/**
	 * Label (e.g., "home", "work")
	 */
	label: string | null;
}

/**
 * Search options for contacts
 */
export interface ContactSearchOptions {
	/**
	 * Search by name (first, last, middle, full name, or nickname)
	 */
	name?: string;

	/**
	 * Search by phone number (partial match on normalized number)
	 */
	phone?: string;

	/**
	 * Search by email address
	 */
	email?: string;

	/**
	 * Search by organization
	 */
	organization?: string;

	/**
	 * Limit number of results
	 */
	limit?: number;

	/**
	 * Offset for pagination
	 */
	offset?: number;

	/**
	 * Case-sensitive search
	 * Default: false
	 */
	caseSensitive?: boolean;
}

/**
 * Raw ZABCDRECORD table row
 */
export interface ABCDRecord {
	Z_PK: number;
	Z_ENT: number;
	Z_OPT: number;
	ZFIRSTNAME: string | null;
	ZLASTNAME: string | null;
	ZMIDDLENAME: string | null;
	ZNICKNAME: string | null;
	ZORGANIZATION: string | null;
	ZDEPARTMENT: string | null;
	ZJOBTITLE: string | null;
	ZNOTE: string | null;
	ZCREATIONDATE: number | null;
	ZMODIFICATIONDATE: number | null;
}

/**
 * Raw ZABCDPHONENUMBER table row
 */
export interface ABCDPhoneNumber {
	Z_PK: number;
	ZOWNER: number;
	ZFULLNUMBER: string;
	ZLABEL: string | null;
}

/**
 * Raw ZABCDEMAILADDRESS table row
 */
export interface ABCDEmailAddress {
	Z_PK: number;
	ZOWNER: number;
	ZADDRESS: string;
	ZLABEL: string | null;
}
