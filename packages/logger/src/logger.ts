import winston from "winston";

export interface LoggerOptions {
	level?: string;
	service?: string;
	silent?: boolean;
}

/**
 * Create a configured Winston logger instance
 */
export const createLogger = (options: LoggerOptions = {}): winston.Logger => {
	const { level = "info", service = "macos-tools", silent = false } = options;

	const format = winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json(),
	);

	const consoleFormat = winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		winston.format.colorize(),
		winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
			const metaStr = Object.keys(meta).length
				? JSON.stringify(meta, null, 2)
				: "";
			return `[${timestamp}] ${level} [${service}]: ${message} ${metaStr}`;
		}),
	);

	return winston.createLogger({
		level,
		format,
		defaultMeta: { service },
		silent,
		transports: [
			new winston.transports.Console({
				format: consoleFormat,
			}),
		],
	});
};

/**
 * Default logger instance
 */
export const logger = createLogger();
