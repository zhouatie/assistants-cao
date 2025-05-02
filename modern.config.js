// modern.config.js
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // Basic configuration for Modern.js Module
  output: {
    buildConfig: {
      buildType: 'bundle',
      sourceMap: true,
    },
  },
  // Change log configuration
  plugins: [],
});
