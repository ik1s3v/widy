import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	build: {
		lib: {
			formats: ["es"],
			entry: "obs/index.tsx",
			name: "auc-fighter-adapter",
		},
		emptyOutDir: false,
		sourcemap: false,
		outDir: "dist/obs",
		rollupOptions: {
			output: {
				entryFileNames: "auc-fighter-adapter.js",
			},
		},
	},
});
