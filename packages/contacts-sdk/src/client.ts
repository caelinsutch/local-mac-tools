import Database from "better-sqlite3";
import type {
	ABCDEmailAddress,
	ABCDPhoneNumber,
	ABCDRecord,
	Contact,
	ContactEmail,
	ContactPhone,
	ContactSearchOptions,
	ContactsConfig,
} from "./types";
import {
	cfTimeToDate,
	formatFullName,
	getDefaultDatabasePath,
	normalizeLabel,
	normalizePhoneNumber,
	validateDatabasePath,
} from "./utils";

/**
 * Main client for interacting with macOS Contacts database
 */
export class ContactsClient {
	private db: Database.Database;
	private readonly databasePath: string;

	constructor(config: ContactsConfig = {}) {
		this.databasePath = config.databasePath || getDefaultDatabasePath();

		if (!validateDatabasePath(this.databasePath)) {
			throw new Error(
				`Contacts database not found at: ${this.databasePath}\n` +
					"Make sure:\n" +
					"1. You're running on macOS\n" +
					"2. You have granted Full Disk Access to your terminal/app in System Preferences > Security & Privacy > Privacy > Full Disk Access",
			);
		}

		try {
			this.db = new Database(this.databasePath, {
				readonly: config.readonly !== false,
				fileMustExist: true,
			});
		} catch (error) {
			throw new Error(
				`Failed to open Contacts database: ${error instanceof Error ? error.message : String(error)}\n` +
					"You may need to grant Full Disk Access permission.",
			);
		}
	}

	/**
	 * Get all contacts
	 */
	getAllContacts(limit?: number): Contact[] {
		let query = `
      SELECT * FROM ZABCDRECORD
      WHERE Z_ENT = 16
      ORDER BY ZLASTNAME, ZFIRSTNAME
    `;

		if (limit) {
			query += ` LIMIT ${limit}`;
		}

		const records = this.db.prepare(query).all() as ABCDRecord[];
		return records.map((record) => this.enrichContact(record));
	}

	/**
	 * Get a contact by ID
	 */
	getContactById(id: number): Contact | null {
		const query = `
      SELECT * FROM ZABCDRECORD
      WHERE Z_PK = ? AND Z_ENT = 16
    `;

		const record = this.db.prepare(query).get(id) as ABCDRecord | undefined;
		return record ? this.enrichContact(record) : null;
	}

	/**
	 * Search for contacts
	 */
	searchContacts(options: ContactSearchOptions): Contact[] {
		const conditions: string[] = ["Z_ENT = 16"];
		const params: unknown[] = [];
		const caseSensitive = options.caseSensitive ?? false;

		if (options.name) {
			const namePattern = caseSensitive ? options.name : `%${options.name}%`;
			const op = caseSensitive ? "GLOB" : "LIKE";

			conditions.push(
				`(ZFIRSTNAME ${op} ? OR ZLASTNAME ${op} ? OR ZMIDDLENAME ${op} ? OR ZNICKNAME ${op} ?)`,
			);
			params.push(namePattern, namePattern, namePattern, namePattern);
		}

		if (options.organization) {
			const orgPattern = caseSensitive
				? options.organization
				: `%${options.organization}%`;
			const op = caseSensitive ? "GLOB" : "LIKE";

			conditions.push(`ZORGANIZATION ${op} ?`);
			params.push(orgPattern);
		}

		if (options.phone) {
			// Search by phone number - need to join with phone numbers table
			const normalized = normalizePhoneNumber(options.phone);
			conditions.push(
				`Z_PK IN (
          SELECT ZOWNER FROM ZABCDPHONENUMBER
          WHERE ZFULLNUMBER LIKE ?
        )`,
			);
			params.push(`%${normalized}%`);
		}

		if (options.email) {
			// Search by email - need to join with email table
			const emailPattern = caseSensitive ? options.email : `%${options.email}%`;
			const op = caseSensitive ? "GLOB" : "LIKE";

			conditions.push(
				`Z_PK IN (
          SELECT ZOWNER FROM ZABCDEMAILADDRESS
          WHERE ZADDRESS ${op} ?
        )`,
			);
			params.push(emailPattern);
		}

		let query = `
      SELECT * FROM ZABCDRECORD
      WHERE ${conditions.join(" AND ")}
      ORDER BY ZLASTNAME, ZFIRSTNAME
    `;

		if (options.limit) {
			query += ` LIMIT ${options.limit}`;
		}

		if (options.offset) {
			query += ` OFFSET ${options.offset}`;
		}

		const records = this.db.prepare(query).all(...params) as ABCDRecord[];
		return records.map((record) => this.enrichContact(record));
	}

	/**
	 * Search contacts by name (convenience method)
	 */
	searchByName(name: string, limit?: number): Contact[] {
		return this.searchContacts({ name, limit });
	}

	/**
	 * Search contacts by phone number (convenience method)
	 */
	searchByPhone(phone: string, limit?: number): Contact[] {
		return this.searchContacts({ phone, limit });
	}

	/**
	 * Search contacts by email (convenience method)
	 */
	searchByEmail(email: string, limit?: number): Contact[] {
		return this.searchContacts({ email, limit });
	}

	/**
	 * Search contacts by organization (convenience method)
	 */
	searchByOrganization(organization: string, limit?: number): Contact[] {
		return this.searchContacts({ organization, limit });
	}

	/**
	 * Get phone numbers for a contact
	 */
	private getPhoneNumbers(contactId: number): ContactPhone[] {
		const query = `
      SELECT * FROM ZABCDPHONENUMBER
      WHERE ZOWNER = ?
    `;

		const phones = this.db.prepare(query).all(contactId) as ABCDPhoneNumber[];

		return phones.map((phone) => ({
			number: phone.ZFULLNUMBER,
			normalized: normalizePhoneNumber(phone.ZFULLNUMBER),
			label: normalizeLabel(phone.ZLABEL),
		}));
	}

	/**
	 * Get email addresses for a contact
	 */
	private getEmails(contactId: number): ContactEmail[] {
		const query = `
      SELECT * FROM ZABCDEMAILADDRESS
      WHERE ZOWNER = ?
    `;

		const emails = this.db.prepare(query).all(contactId) as ABCDEmailAddress[];

		return emails.map((email) => ({
			address: email.ZADDRESS,
			label: normalizeLabel(email.ZLABEL),
		}));
	}

	/**
	 * Enrich a contact record with phone numbers and emails
	 */
	private enrichContact(record: ABCDRecord): Contact {
		const phoneNumbers = this.getPhoneNumbers(record.Z_PK);
		const emails = this.getEmails(record.Z_PK);

		return {
			id: record.Z_PK,
			uuid: `contact-${record.Z_PK}`, // Generate a simple UUID
			firstName: record.ZFIRSTNAME,
			lastName: record.ZLASTNAME,
			middleName: record.ZMIDDLENAME,
			fullName: formatFullName(
				record.ZFIRSTNAME,
				record.ZMIDDLENAME,
				record.ZLASTNAME,
				record.ZORGANIZATION,
			),
			nickname: record.ZNICKNAME,
			organization: record.ZORGANIZATION,
			department: record.ZDEPARTMENT,
			jobTitle: record.ZJOBTITLE,
			phoneNumbers,
			emails,
			createdDate: record.ZCREATIONDATE
				? cfTimeToDate(record.ZCREATIONDATE)
				: null,
			modifiedDate: record.ZMODIFICATIONDATE
				? cfTimeToDate(record.ZMODIFICATIONDATE)
				: null,
			note: record.ZNOTE,
		};
	}

	/**
	 * Get contact count
	 */
	getContactCount(): number {
		const query = `
      SELECT COUNT(*) as count
      FROM ZABCDRECORD
      WHERE Z_ENT = 16
    `;

		const result = this.db.prepare(query).get() as { count: number };
		return result.count;
	}

	/**
	 * Close the database connection
	 */
	close(): void {
		this.db.close();
	}
}
