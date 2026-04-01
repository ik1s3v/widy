import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
	plugins: [pluginReact()],
	html: {
		template: "./public/index.html",
		inject: "body",
		scriptLoading: "blocking",
	},
	source: {
		entry: {
			index: "./obs/index.tsx",
		},
	},

	output: {
		target: "web",
		filenameHash: false,
		assetPrefix: "./",
		injectStyles: true,
		distPath: {
			root: "dist/obs",
			js: "",
		},
		copy: [{ from: "manifest.json", to: "../manifest.json" }],
	},
	performance: {
		chunkSplit: {
			strategy: "all-in-one",
		},
	},
	// tools: {
	// 	rspack: {
	// 		output: {
	// 			library: {
	// 				// name: "extension",
	// 				type: "module", // ESM output like Vite's format: "es"
	// 				// umdNamedDefine: true,
	// 				// export: "default",
	// 			},
	// 		},
	// 		module: {
	// 			parser: {
	// 				javascript: {
	// 					dynamicImportMode: "lazy", // Good - prevents async chunks
	// 				},
	// 			},
	// 		},
	// 		experiments: {
	// 			outputModule: true, // Required to enable module output
	// 		},
	// 		optimization: {
	// 			runtimeChunk: false, // Inline runtime, no separate chunk
	// 		},
	// 	},
	// },
});
