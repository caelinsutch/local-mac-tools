import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ContactsClient } from "../src/client";
import { getDefaultDatabasePath, validateDatabasePath } from "../src/utils";

/**
 * Integration tests for ContactsClient
 *
 * These tests require:
 * 1. Running on macOS
 * 2. Full Disk Access granted to the terminal/app
 * 3. Actual Contacts database available
 *
 * These tests are skipped if the database is not accessible
 */

const databasePath = getDefaultDatabasePath();
const isDatabaseAvailable = validateDatabasePath(databasePath);

describe.skipIf(!isDatabaseAvailable)(
	"ContactsClient Integration Tests",
	() => {
		let client: ContactsClient;

		beforeAll(() => {
			if (isDatabaseAvailable) {
				client = new ContactsClient();
			}
		});

		afterAll(() => {
			if (client) {
				client.close();
			}
		});

		describe("database access", () => {
			it("should successfully connect to the database", () => {
				expect(client).toBeDefined();
			});

			it("should have a valid database path", () => {
				expect(databasePath).toBeTruthy();
				expect(databasePath).toContain("AddressBook");
			});
		});

		describe("getContactCount", () => {
			it("should return a non-negative number", () => {
				const count = client.getContactCount();
				expect(count).toBeGreaterThanOrEqual(0);
				expect(Number.isInteger(count)).toBe(true);
			});
		});

		describe("getAllContacts", () => {
			it("should return an array of contacts", () => {
				const contacts = client.getAllContacts(5);
				expect(Array.isArray(contacts)).toBe(true);
			});

			it("should return contacts with required properties", () => {
				const contacts = client.getAllContacts(1);
				if (contacts.length > 0) {
					const contact = contacts[0];
					expect(contact).toHaveProperty("id");
					expect(contact).toHaveProperty("uuid");
					expect(contact).toHaveProperty("fullName");
					expect(contact).toHaveProperty("phoneNumbers");
					expect(contact).toHaveProperty("emails");
					expect(Array.isArray(contact.phoneNumbers)).toBe(true);
					expect(Array.isArray(contact.emails)).toBe(true);
				}
			});

			it("should respect limit parameter", () => {
				const limit = 3;
				const contacts = client.getAllContacts(limit);
				expect(contacts.length).toBeLessThanOrEqual(limit);
			});
		});

		describe("getContactById", () => {
			it("should return null for non-existent ID", () => {
				const contact = client.getContactById(999999999);
				expect(contact).toBeNull();
			});

			it("should return a contact for valid ID", () => {
				const allContacts = client.getAllContacts(1);
				if (allContacts.length > 0) {
					const firstContact = allContacts[0];
					const contact = client.getContactById(firstContact.id);

					expect(contact).not.toBeNull();
					expect(contact?.id).toBe(firstContact.id);
					expect(contact?.fullName).toBe(firstContact.fullName);
				}
			});
		});

		describe("searchByName", () => {
			it("should return an array", () => {
				const results = client.searchByName("test");
				expect(Array.isArray(results)).toBe(true);
			});

			it("should find contacts with matching names", () => {
				const allContacts = client.getAllContacts(10);
				if (allContacts.length > 0) {
					const firstContact = allContacts[0];
					if (firstContact.firstName) {
						const searchTerm = firstContact.firstName.substring(0, 3);
						const results = client.searchByName(searchTerm);

						expect(results.length).toBeGreaterThan(0);
						const found = results.some((c) => c.id === firstContact.id);
						expect(found).toBe(true);
					}
				}
			});

			it("should respect limit parameter", () => {
				const limit = 2;
				const results = client.searchByName("a", limit);
				expect(results.length).toBeLessThanOrEqual(limit);
			});

			it("should return empty array for non-matching search", () => {
				const results = client.searchByName("xyzqwertynonexistent12345");
				expect(results).toEqual([]);
			});
		});

		describe("searchByPhone", () => {
			it("should return an array", () => {
				const results = client.searchByPhone("123");
				expect(Array.isArray(results)).toBe(true);
			});

			it("should find contacts with matching phone numbers", () => {
				const allContacts = client.getAllContacts(50);
				const contactsWithPhones = allContacts.filter(
					(c) => c.phoneNumbers.length > 0,
				);

				if (contactsWithPhones.length > 0) {
					const contact = contactsWithPhones[0];
					const phone = contact.phoneNumbers[0].number;
					const searchTerm = phone.substring(0, 3);

					const results = client.searchByPhone(searchTerm);
					expect(results.length).toBeGreaterThan(0);
				}
			});
		});

		describe("searchByEmail", () => {
			it("should return an array", () => {
				const results = client.searchByEmail("test");
				expect(Array.isArray(results)).toBe(true);
			});

			it("should find contacts with matching email addresses", () => {
				const allContacts = client.getAllContacts(50);
				const contactsWithEmails = allContacts.filter(
					(c) => c.emails.length > 0,
				);

				if (contactsWithEmails.length > 0) {
					const contact = contactsWithEmails[0];
					const email = contact.emails[0].address;

					const results = client.searchByEmail(email);
					expect(results.length).toBeGreaterThan(0);

					const found = results.some((c) => c.id === contact.id);
					expect(found).toBe(true);
				}
			});
		});

		describe("searchByOrganization", () => {
			it("should return an array", () => {
				const results = client.searchByOrganization("test");
				expect(Array.isArray(results)).toBe(true);
			});

			it("should find contacts with matching organization", () => {
				const allContacts = client.getAllContacts(100);
				const contactsWithOrgs = allContacts.filter((c) => c.organization);

				if (contactsWithOrgs.length > 0) {
					const contact = contactsWithOrgs[0];
					const org = contact.organization;

					if (org) {
						const results = client.searchByOrganization(org);
						expect(results.length).toBeGreaterThan(0);

						const _found = results.some((c) => c.id === contact.id);
					}
					expect(found).toBe(true);
				}
			});
		});

		describe("searchContacts with multiple criteria", () => {
			it("should handle empty search options", () => {
				const results = client.searchContacts({});
				expect(Array.isArray(results)).toBe(true);
			});

			it("should combine name and limit", () => {
				const results = client.searchContacts({
					name: "a",
					limit: 5,
				});
				expect(results.length).toBeLessThanOrEqual(5);
			});

			it("should handle offset parameter", () => {
				const results1 = client.searchContacts({
					name: "a",
					limit: 5,
					offset: 0,
				});
				const results2 = client.searchContacts({
					name: "a",
					limit: 5,
					offset: 5,
				});

				// Results should be different (if there are enough contacts)
				if (results1.length === 5 && results2.length > 0) {
					const ids1 = results1.map((c) => c.id);
					const ids2 = results2.map((c) => c.id);
					const overlap = ids1.some((id) => ids2.includes(id));
					expect(overlap).toBe(false);
				}
			});
		});

		describe("contact data integrity", () => {
			it("should have valid phone numbers", () => {
				const contacts = client.getAllContacts(10);
				const contactsWithPhones = contacts.filter(
					(c) => c.phoneNumbers.length > 0,
				);

				if (contactsWithPhones.length > 0) {
					const contact = contactsWithPhones[0];
					const phone = contact.phoneNumbers[0];

					expect(phone).toHaveProperty("number");
					expect(phone).toHaveProperty("normalized");
					expect(phone).toHaveProperty("label");
					expect(typeof phone.number).toBe("string");
					expect(phone.number.length).toBeGreaterThan(0);
				}
			});

			it("should have valid email addresses", () => {
				const contacts = client.getAllContacts(10);
				const contactsWithEmails = contacts.filter((c) => c.emails.length > 0);

				if (contactsWithEmails.length > 0) {
					const contact = contactsWithEmails[0];
					const email = contact.emails[0];

					expect(email).toHaveProperty("address");
					expect(email).toHaveProperty("label");
					expect(typeof email.address).toBe("string");
					expect(email.address).toContain("@");
				}
			});

			it("should have valid dates when present", () => {
				const contacts = client.getAllContacts(10);

				for (const contact of contacts) {
					if (contact.createdDate !== null) {
						expect(contact.createdDate).toBeInstanceOf(Date);
						expect(contact.createdDate.getTime()).not.toBeNaN();
					}
					if (contact.modifiedDate !== null) {
						expect(contact.modifiedDate).toBeInstanceOf(Date);
						expect(contact.modifiedDate.getTime()).not.toBeNaN();
					}
				}
			});

			it("should have consistent ID format", () => {
				const contacts = client.getAllContacts(5);

				for (const contact of contacts) {
					expect(typeof contact.id).toBe("number");
					expect(contact.id).toBeGreaterThan(0);
					expect(typeof contact.uuid).toBe("string");
					expect(contact.uuid.length).toBeGreaterThan(0);
				}
			});
		});
	},
);

describe.skipIf(isDatabaseAvailable)(
	"ContactsClient - Database Not Available",
	() => {
		it("should skip integration tests when database is not available", () => {
			console.log(
				"Skipping integration tests: Contacts database not accessible",
			);
			console.log("This is expected in CI/CD or without Full Disk Access");
			expect(true).toBe(true);
		});
	},
);
