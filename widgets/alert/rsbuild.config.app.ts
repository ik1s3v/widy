import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './app/index.tsx',
    },
  },
  output: {
    filenameHash: false,
    distPath: {
      root: 'dist/app',
    },
    copy: [{ from: 'manifest.json', to: '../manifest.json' }],
  },
});
