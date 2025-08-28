import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": "http://localhost:8000",
            "/api/v1": "http://localhost:8000",
            "/audio": "http://localhost:8000",
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./setupTests.ts"],
        css: true,
    },
});
