import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import pkg from "./package.json";

export default defineConfig({
	plugins: [viteSingleFile()],
	define: { __VERSION__: JSON.stringify(pkg.version) }
});