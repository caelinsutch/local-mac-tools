/**
 * Utility functions for Contacts SDK
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Core Foundation/Cocoa absolute reference date: January 1, 2001 00:00:00 UTC
 */
const CF_ABSOLUTE_TIME_EPOCH = new Date("2001-01-01T00:00:00.000Z").getTime();

/**
 * Convert Core Foundation absolute time to JavaScript Date
 * CF absolute time is seconds since January 1, 2001
 */
export function cfTimeToDate(cfTime: number): Date {
	return new Date(CF_ABSOLUTE_TIME_EPOCH + cfTime * 1000);
}

/**
 * Convert JavaScript Date to Core Foundation absolute time
 */
export function dateToCfTime(date: Date): number {
	return (date.getTime() - CF_ABSOLUTE_TIME_EPOCH) / 1000;
}

/**
 * Get the default path to the Contacts database
 * macOS stores contacts in ~/Library/Application Support/AddressBook/
 * The database name may vary by macOS version (e.g., AddressBook-v22.abcddb)
 */
export function getDefaultDatabasePath(): string {
	const addressBookDir = join(
		homedir(),
		"Library",
		"Application Support",
		"AddressBook",
	);

	// Try to find the most recent AddressBook database
	// Common names: AddressBook-v22.abcddb, AddressBook.sqlitedb
	const possibleNames = [
		"AddressBook-v22.abcddb",
		"AddressBook-v23.abcddb",
		"AddressBook.sqlitedb",
		"Sources/DB5E8B78-3E78-4F06-81E7-C7C5C0F67A30/AddressBook-v22.abcddb", // Fallback for some configurations
	];

	for (const name of possibleNames) {
		const path = join(addressBookDir, name);
		if (existsSync(path)) {
			return path;
		}
	}

	// Default to the most common path
	return join(addressBookDir, "AddressBook-v22.abcddb");
}

/**
 * Validate that the database path exists
 */
export function validateDatabasePath(path: string): boolean {
	return existsSync(path);
}

/**
 * Normalize a phone number by removing all non-digit characters
 * and optionally format it
 */
export function normalizePhoneNumber(phone: string): string {
	// Remove all non-digit characters except +
	const normalized = phone.replace(/[^\d+]/g, "");

	// If it starts with +, keep it
	if (normalized.startsWith("+")) {
		return normalized;
	}

	// If it's a US number (10 digits), add +1
	if (normalized.length === 10) {
		return `+1${normalized}`;
	}

	// If it's already formatted with country code (11+ digits), add +
	if (normalized.length >= 11 && !normalized.startsWith("+")) {
		return `+${normalized}`;
	}

	return normalized;
}

/**
 * Compare two phone numbers for equality (normalized comparison)
 */
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
	const norm1 = normalizePhoneNumber(phone1);
	const norm2 = normalizePhoneNumber(phone2);

	// Exact match
	if (norm1 === norm2) {
		return true;
	}

	// Try matching without country code
	const digits1 = norm1.replace(/^\+\d/, "");
	const digits2 = norm2.replace(/^\+\d/, "");

	return digits1 === digits2;
}

/**
 * Format a full name from components
 */
export function formatFullName(
	firstName: string | null,
	middleName: string | null,
	lastName: string | null,
	organization: string | null,
): string {
	const parts = [firstName, middleName, lastName]
		.filter((part) => part?.trim())
		.map((part) => part?.trim());

	if (parts.length > 0) {
		return parts.join(" ");
	}

	// Fall back to organization if no name parts
	if (organization?.trim()) {
		return organization.trim();
	}

	return "Unknown Contact";
}

/**
 * Parse and normalize a label from the database
 * Labels in the database are stored as lowercase with underscores
 */
const labelMap = {
	"_$!<mobile>!$_": "mobile",
	"_$!<home>!$_": "home",
	"_$!<work>!$_": "work",
	"_$!<main>!$_": "main",
	"_$!<homefax>!$_": "home fax",
	"_$!<workfax>!$_": "work fax",
	"_$!<otherfax>!$_": "other fax",
	"_$!<pager>!$_": "pager",
	"_$!<iphone>!$_": "iPhone",
	"_$!<other>!$_": "other",
} as const;

export function normalizeLabel(label: string | null): string | null {
	if (!label) return null;

	const normalized = label.toLowerCase();
	return labelMap[normalized as keyof typeof labelMap] || label;
}
