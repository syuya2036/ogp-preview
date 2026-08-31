import type { EngineModule } from "./types.js";

export const ENGINE_IDS = [
	"satori-resvg",
	"satori-sharp",
	"vercel-og",
	"takumi-native",
	"takumi-wasm",
	"chromium",
] as const;

export type EngineId = (typeof ENGINE_IDS)[number];

export function isEngineId(v: string): v is EngineId {
	return (ENGINE_IDS as readonly string[]).includes(v);
}

/**
 * Static import specifiers, resolved one at a time. A cold-start measurement is
 * meaningless if the process has already loaded the other five engines.
 */
export async function loadEngine(id: EngineId): Promise<EngineModule> {
	switch (id) {
		case "satori-resvg":
			return (await import("./engines/satori-resvg.js")).default;
		case "satori-sharp":
			return (await import("./engines/satori-sharp.js")).default;
		case "vercel-og":
			return (await import("./engines/vercel-og.js")).default;
		case "takumi-native":
			return (await import("./engines/takumi-native.js")).default;
		case "takumi-wasm":
			return (await import("./engines/takumi-wasm.js")).default;
		case "chromium":
			return (await import("./engines/chromium.js")).default;
	}
}
