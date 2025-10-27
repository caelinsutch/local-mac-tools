/**
 * Basic usage examples for Contacts SDK
 *
 * This example shows how to search and query contacts from macOS Contacts.
 * Run with: ts-node examples/basic-usage.ts
 */

import { ContactsClient } from "../src";

async function main() {
	console.log("Contacts SDK - Basic Usage Examples\n");
	console.log("====================================\n");

	try {
		const client = new ContactsClient();

		// Example 1: Get total contact count
		console.log("📊 Contact Statistics:");
		console.log("----------------------");
		const totalContacts = client.getContactCount();
		console.log(`Total contacts: ${totalContacts}\n`);

		// Example 2: Get all contacts (limited to first 5)
		console.log("👥 All Contacts (first 5):");
		console.log("---------------------------");
		const allContacts = client.getAllContacts(5);
		for (const contact of allContacts) {
			console.log(`${contact.fullName}`);
			if (contact.organization) {
				console.log(`  Organization: ${contact.organization}`);
			}
			if (contact.phoneNumbers.length > 0) {
				console.log(
					`  Phone: ${contact.phoneNumbers[0].number} (${contact.phoneNumbers[0].label || "no label"})`,
				);
			}
			if (contact.emails.length > 0) {
				console.log(
					`  Email: ${contact.emails[0].address} (${contact.emails[0].label || "no label"})`,
				);
			}
			console.log();
		}

		// Example 3: Search by name
		console.log("🔍 Search by Name:");
		console.log("-------------------");
		const searchTerm = "john"; // Replace with a name from your contacts
		console.log(`Searching for "${searchTerm}"...\n`);

		const nameResults = client.searchByName(searchTerm, 5);
		console.log(`Found ${nameResults.length} results:`);
		for (const contact of nameResults) {
			console.log(`- ${contact.fullName}`);
			if (contact.phoneNumbers.length > 0) {
				console.log(`  Phone: ${contact.phoneNumbers[0].number}`);
			}
			if (contact.emails.length > 0) {
				console.log(`  Email: ${contact.emails[0].address}`);
			}
		}
		console.log();

		// Example 4: Search by phone number
		if (allContacts.length > 0 && allContacts[0].phoneNumbers.length > 0) {
			console.log("📱 Search by Phone Number:");
			console.log("---------------------------");
			const phoneToSearch = allContacts[0].phoneNumbers[0].number;
			console.log(`Searching for "${phoneToSearch}"...\n`);

			const phoneResults = client.searchByPhone(phoneToSearch);
			console.log(`Found ${phoneResults.length} results:`);
			for (const contact of phoneResults) {
				console.log(`- ${contact.fullName}`);
				for (const phone of contact.phoneNumbers) {
					console.log(`  ${phone.number} (${phone.label || "no label"})`);
				}
			}
			console.log();
		}

		// Example 5: Search by email
		if (allContacts.length > 0 && allContacts[0].emails.length > 0) {
			console.log("📧 Search by Email:");
			console.log("--------------------");
			const emailToSearch = allContacts[0].emails[0].address;
			console.log(`Searching for "${emailToSearch}"...\n`);

			const emailResults = client.searchByEmail(emailToSearch);
			console.log(`Found ${emailResults.length} results:`);
			for (const contact of emailResults) {
				console.log(`- ${contact.fullName}`);
				for (const email of contact.emails) {
					console.log(`  ${email.address} (${email.label || "no label"})`);
				}
			}
			console.log();
		}

		// Example 6: Advanced search with multiple criteria
		console.log("🔎 Advanced Search:");
		console.log("-------------------");
		const advancedResults = client.searchContacts({
			name: "a", // Contains letter 'a'
			limit: 10,
		});
		console.log(
			`Contacts with 'a' in name (first 10): ${advancedResults.length}`,
		);
		for (const contact of advancedResults.slice(0, 5)) {
			console.log(`- ${contact.fullName}`);
		}
		console.log();

		// Example 7: Get a specific contact by ID
		if (allContacts.length > 0) {
			console.log("👤 Get Contact by ID:");
			console.log("----------------------");
			const firstContactId = allContacts[0].id;
			const specificContact = client.getContactById(firstContactId);

			if (specificContact) {
				console.log(`Contact: ${specificContact.fullName}`);
				console.log(`ID: ${specificContact.id}`);
				if (specificContact.organization) {
					console.log(`Organization: ${specificContact.organization}`);
				}
				if (specificContact.jobTitle) {
					console.log(`Job Title: ${specificContact.jobTitle}`);
				}
				console.log(`Phone Numbers: ${specificContact.phoneNumbers.length}`);
				for (const phone of specificContact.phoneNumbers) {
					console.log(`  - ${phone.number} (${phone.label || "no label"})`);
				}
				console.log(`Emails: ${specificContact.emails.length}`);
				for (const email of specificContact.emails) {
					console.log(`  - ${email.address} (${email.label || "no label"})`);
				}
				if (specificContact.createdDate) {
					console.log(
						`Created: ${specificContact.createdDate.toLocaleDateString()}`,
					);
				}
				if (specificContact.modifiedDate) {
					console.log(
						`Modified: ${specificContact.modifiedDate.toLocaleDateString()}`,
					);
				}
			}
			console.log();
		}

		// Example 8: Search by organization
		console.log("🏢 Search by Organization:");
		console.log("--------------------------");
		const orgResults = client.searchByOrganization("apple", 5);
		console.log(`Companies with 'apple' in name: ${orgResults.length}`);
		for (const contact of orgResults) {
			console.log(`- ${contact.fullName} (${contact.organization || "N/A"})`);
		}
		console.log();

		client.close();
		console.log("✓ Done!");
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		console.error(
			"\nMake sure you have granted Full Disk Access to your terminal!",
		);
		process.exit(1);
	}
}

main();
