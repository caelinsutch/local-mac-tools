import { describe, expect, it, vi } from "vitest";
import { createLogger } from "../src/logger";

describe("createLogger", () => {
	it("should create a logger instance", () => {
		const logger = createLogger();
		expect(logger).toBeDefined();
		expect(typeof logger.info).toBe("function");
		expect(typeof logger.error).toBe("function");
		expect(typeof logger.warn).toBe("function");
		expect(typeof logger.debug).toBe("function");
	});

	it("should create a logger with custom options", () => {
		const logger = createLogger({
			level: "debug",
			service: "test-service",
		});
		expect(logger).toBeDefined();
		expect(logger.level).toBe("debug");
	});

	it("should create a silent logger", () => {
		const logger = createLogger({ silent: true });
		expect(logger).toBeDefined();
		expect(logger.silent).toBe(true);
	});

	it("should log messages without throwing", () => {
		const logger = createLogger({ silent: true });
		expect(() => {
			logger.info("Test info message");
			logger.error("Test error message");
			logger.warn("Test warning message");
			logger.debug("Test debug message");
		}).not.toThrow();
	});

	it("should log with metadata", () => {
		const logger = createLogger({ silent: true });
		expect(() => {
			logger.info("Test message", { userId: 123, action: "login" });
		}).not.toThrow();
	});

	it("should log errors with stack traces", () => {
		const logger = createLogger({ silent: true });
		const error = new Error("Test error");
		expect(() => {
			logger.error("Error occurred", error);
		}).not.toThrow();
	});
});
