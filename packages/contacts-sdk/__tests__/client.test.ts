import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactsClient } from "../src/client";

// Mock better-sqlite3 completely
const mockPrepare = vi.fn();
const mockClose = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();

vi.mock("better-sqlite3", () => {
	return {
		default: vi.fn(() => ({
			prepare: mockPrepare,
			close: mockClose,
		})),
	};
});

// Mock utils
vi.mock("../src/utils", () => ({
	getDefaultDatabasePath: vi.fn(() => "/mock/path/to/AddressBook.db"),
	validateDatabasePath: vi.fn(() => true),
	cfTimeToDate: vi.fn((timestamp: number) => {
		const CF_EPOCH = new Date("2001-01-01T00:00:00Z").getTime();
		return new Date(CF_EPOCH + timestamp * 1000);
	}),
	dateToCfTime: vi.fn((date: Date) => {
		const CF_EPOCH = new Date("2001-01-01T00:00:00Z").getTime();
		return (date.getTime() - CF_EPOCH) / 1000;
	}),
	normalizePhoneNumber: vi.fn((phone: string) => phone.replace(/\D/g, "")),
	phoneNumbersMatch: vi.fn((p1: string, p2: string) => p1 === p2),
	formatFullName: vi.fn((first, middle, last, org) => {
		const parts = [first, middle, last].filter(Boolean);
		return parts.length > 0 ? parts.join(" ") : org || "Unknown Contact";
	}),
	normalizeLabel: vi.fn((label: string | null) => label),
}));

describe("ContactsClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPrepare.mockReturnValue({
			get: mockGet,
			all: mockAll,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("should initialize with default config", () => {
			expect(() => new ContactsClient()).not.toThrow();
		});

		it("should accept custom database path", () => {
			const config = { databasePath: "/custom/path/AddressBook.db" };
			expect(() => new ContactsClient(config)).not.toThrow();
		});
	});

	describe("getAllContacts", () => {
		it("should return empty array when no contacts exist", () => {
			mockAll.mockReturnValue([]);

			const client = new ContactsClient();
			const contacts = client.getAllContacts();

			expect(contacts).toEqual([]);
			expect(mockPrepare).toHaveBeenCalled();
		});

		it("should apply limit when specified", () => {
			mockAll.mockReturnValue([]);

			const client = new ContactsClient();
			client.getAllContacts(10);

			expect(mockPrepare).toHaveBeenCalled();
			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("LIMIT 10");
		});
	});

	describe("getContactById", () => {
		it("should return null when contact not found", () => {
			mockGet.mockReturnValue(undefined);

			const client = new ContactsClient();
			const contact = client.getContactById(999);

			expect(contact).toBeNull();
		});

		it("should return contact when found", () => {
			const mockRecord = {
				Z_PK: 1,
				Z_ENT: 16,
				ZFIRSTNAME: "John",
				ZLASTNAME: "Doe",
				ZMIDDLENAME: null,
				ZNICKNAME: null,
				ZORGANIZATION: null,
				ZDEPARTMENT: null,
				ZJOBTITLE: null,
				ZNOTE: null,
				ZCREATIONDATE: 0,
				ZMODIFICATIONDATE: 0,
			};

			mockGet.mockReturnValue(mockRecord);
			mockAll.mockReturnValue([]); // For phone numbers and emails

			const client = new ContactsClient();
			const contact = client.getContactById(1);

			expect(contact).toBeDefined();
			expect(contact?.id).toBe(1);
			expect(contact?.firstName).toBe("John");
			expect(contact?.lastName).toBe("Doe");
		});
	});

	describe("searchContacts", () => {
		beforeEach(() => {
			mockAll.mockReturnValue([]);
		});

		it("should search by name", () => {
			const client = new ContactsClient();
			client.searchContacts({ name: "John" });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZFIRSTNAME");
			expect(query).toContain("ZLASTNAME");
			expect(query).toContain("LIKE");
		});

		it("should search by phone number", () => {
			const client = new ContactsClient();
			client.searchContacts({ phone: "1234567890" });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZABCDPHONENUMBER");
			expect(query).toContain("ZFULLNUMBER");
		});

		it("should search by email", () => {
			const client = new ContactsClient();
			client.searchContacts({ email: "test@example.com" });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZABCDEMAILADDRESS");
			expect(query).toContain("ZADDRESS");
		});

		it("should search by organization", () => {
			const client = new ContactsClient();
			client.searchContacts({ organization: "Apple" });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZORGANIZATION");
		});

		it("should apply limit and offset", () => {
			const client = new ContactsClient();
			client.searchContacts({ name: "John", limit: 10, offset: 20 });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("LIMIT 10");
			expect(query).toContain("OFFSET 20");
		});

		it("should handle case-sensitive search", () => {
			const client = new ContactsClient();
			client.searchContacts({ name: "John", caseSensitive: true });

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("GLOB");
		});
	});

	describe("convenience search methods", () => {
		beforeEach(() => {
			mockAll.mockReturnValue([]);
		});

		it("searchByName should call searchContacts with name", () => {
			const client = new ContactsClient();
			client.searchByName("John", 5);

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZFIRSTNAME");
			expect(query).toContain("LIMIT 5");
		});

		it("searchByPhone should call searchContacts with phone", () => {
			const client = new ContactsClient();
			client.searchByPhone("1234567890");

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZABCDPHONENUMBER");
		});

		it("searchByEmail should call searchContacts with email", () => {
			const client = new ContactsClient();
			client.searchByEmail("test@example.com");

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZABCDEMAILADDRESS");
		});

		it("searchByOrganization should call searchContacts with organization", () => {
			const client = new ContactsClient();
			client.searchByOrganization("Apple");

			const query = mockPrepare.mock.calls[0][0] as string;
			expect(query).toContain("ZORGANIZATION");
		});
	});

	describe("getContactCount", () => {
		it("should return total contact count", () => {
			mockGet.mockReturnValue({ count: 42 });

			const client = new ContactsClient();
			const count = client.getContactCount();

			expect(count).toBe(42);
			expect(mockPrepare).toHaveBeenCalled();
		});

		it("should handle zero contacts", () => {
			mockGet.mockReturnValue({ count: 0 });

			const client = new ContactsClient();
			const count = client.getContactCount();

			expect(count).toBe(0);
		});
	});

	describe("close", () => {
		it("should close the database connection", () => {
			const client = new ContactsClient();
			client.close();

			expect(mockClose).toHaveBeenCalled();
		});
	});
});
