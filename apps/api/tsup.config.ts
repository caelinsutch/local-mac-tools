import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs"],
	clean: true,
	sourcemap: true,
	platform: "node",
	target: "node14",
	shims: true,
	bundle: true,
	// Bundle workspace packages
	noExternal: ["@macos-tools/contacts-sdk", "@macos-tools/logger"],
});
