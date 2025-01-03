import { defineConfig } from "vite";

export default defineConfig({
    root: "",
    base: "./",
    build: {
        rollupOptions: {
            input: "./index.html",
        },
    },
});