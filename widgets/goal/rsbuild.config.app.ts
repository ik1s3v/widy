import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
	plugins: [pluginReact()],
	html: {
		title: "Widget",
	},
	source: {
		entry: {
			index: "./app/index.tsx",
		},
	},
	output: {
		filenameHash: false,
		distPath: {
			root: "dist/app",
			js: "",
		},
		assetPrefix: "./",
		injectStyles: true,
		copy: [{ from: "manifest.json", to: "../manifest.json" }],
	},
	performance: {
		chunkSplit: {
			strategy: "all-in-one",
		},
	},
});
