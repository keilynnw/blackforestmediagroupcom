import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  ssr: {
    noExternal: ["h3-v2"],
  },
});
