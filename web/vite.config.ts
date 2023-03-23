import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { sentryVitePlugin } from "@sentry/vite-plugin";

function requireEnv(id: string): string {
  if (process.env[id]) return process.env[id]!;
  else throw `Missing env var ${id}`;
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  plugins: [
    vue(),
    svgLoader(),
    process.env.VITE_SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: requireEnv("VITE_SENTRY_ORG"),
        project: requireEnv("VITE_SENTRY_PROJECT"),
        include: "./dist",

        // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
        // and needs the `project:releases` and `org:read` scopes
        authToken: requireEnv("VITE_SENTRY_AUTH_TOKEN"),

        // Optionally uncomment the line below to override automatic release name detection
        release: process.env.GIT_REV,
      }),
  ],
});
