import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: [
    "en",
    "de",
    "es",
    "id",
    "ms",
    "zh"
  ],
  extract: {
    input: "app/**/*.{js,jsx,ts,tsx}",
    output: "language/{{language}}.json"
  }
});