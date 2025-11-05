import chalk from "chalk";

export interface LoggerOptions {
	level?: string;
	service?: string;
	silent?: boolean;
}

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

export interface Logger {
	debug: (message: string, ...meta: unknown[]) => void;
	info: (message: string, ...meta: unknown[]) => void;
	warn: (message: string, ...meta: unknown[]) => void;
	error: (message: string, ...meta: unknown[]) => void;
}

/**
 * Create a lightweight logger instance using chalk for colors
 */
export const createLogger = (options: LoggerOptions = {}): Logger => {
	const {
		level = "info",
		service = "macos-tools",
		silent = false,
	} = options;

	const minLevel = LOG_LEVELS[level as LogLevel] ?? LOG_LEVELS.info;

	const formatTimestamp = () => {
		const now = new Date();
		return now
			.toLocaleString("en-US", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			})
			.replace(",", "");
	};

	const log = (logLevel: LogLevel, message: string, ...meta: unknown[]) => {
		if (silent || LOG_LEVELS[logLevel] < minLevel) {
			return;
		}

		const timestamp = formatTimestamp();
		const metaStr = meta.length > 0 ? ` ${JSON.stringify(meta)}` : "";

		let coloredLevel: string;
		switch (logLevel) {
			case "debug":
				coloredLevel = chalk.cyan(logLevel);
				break;
			case "info":
				coloredLevel = chalk.green(logLevel);
				break;
			case "warn":
				coloredLevel = chalk.yellow(logLevel);
				break;
			case "error":
				coloredLevel = chalk.red(logLevel);
				break;
		}

		console.log(
			`[${timestamp}] ${coloredLevel} [${service}]: ${message}${metaStr}`,
		);
	};

	return {
		debug: (message: string, ...meta: unknown[]) =>
			log("debug", message, ...meta),
		info: (message: string, ...meta: unknown[]) => log("info", message, ...meta),
		warn: (message: string, ...meta: unknown[]) => log("warn", message, ...meta),
		error: (message: string, ...meta: unknown[]) =>
			log("error", message, ...meta),
	};
};

/**
 * Default logger instance
 */
export const logger = createLogger();
