import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [pluginReact()],

	server: {
		// 2. tauri expects a fixed port, fail if that port is not available
		port: 1420,
		strictPort: true,
		host: host || "localhost",
	},

	dev: {
		// 1. prevent rsbuild from obscuring rust errors
		progressBar: false,
		...(host
			? {
					client: {
						protocol: "ws",
						host,
						port: 1421,
					},
				}
			: {}),
	},
	source: {
		entry: {
			index: "./src/main.tsx",
		},
	},
	tools: {
		rspack: {
			watchOptions: {
				// 3. tell rsbuild to ignore watching `src-tauri`
				ignored: ["**/src-tauri/**", "**/src-widget/**"],
			},
		},
	},
});
