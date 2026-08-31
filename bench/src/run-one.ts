/**
 * Measures exactly one (engine, case) pair, in its own process.
 *
 * Cold start only means something in a process that has done nothing else, so
 * the runner never benches two engines in one process: no shared JIT warmth, no
 * shared allocator state, no other engine's WASM module resident.
 *
 * Usage: node dist/run-one.js <engineId> <caseId> [--warmup N] [--iterations N]
 *        [--cold-only] [--out DIR]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fontsFor, propsFor, type CaseId } from "./cases.js";
import { isEngineId, loadEngine, type EngineId } from "./registry.js";
import { summarize, type Summary } from "./stats.js";
import type { Engine, OutFormat } from "./types.js";

export interface ColdResult {
	/** Reading the .ttf files off disk — identical work for every engine. */
	fontsMs: number;
	/** Importing the engine's module graph (WASM instantiation lands here). */
	importMs: number;
	/** Font registration, browser launch — whatever the engine does once at boot. */
	setupMs: number;
	/** The first render, still on cold caches. */
	firstRenderMs: number;
	/** Wall clock since process start, so Node's own boot is included. */
	totalSinceProcessStartMs: number;
}

export interface FormatResult extends Summary {
	bytes: number;
	note?: string;
}

export interface RunResult {
	engine: EngineId;
	label: string;
	case: CaseId;
	cold?: ColdResult;
	warm?: Record<string, FormatResult>;
	maxRssMb?: number;
	error?: string;
}

const EXT: Record<OutFormat, string> = {
	png: "png",
	webp: "webp",
	jpeg: "jpg",
	avif: "avif",
};

async function main() {
	const [engineId, caseId, ...rest] = process.argv.slice(2);
	if (!isEngineId(engineId)) throw new Error(`unknown engine: ${engineId}`);
	const kase = caseId as CaseId;

	const flag = (name: string, dflt: number) => {
		const i = rest.indexOf(`--${name}`);
		return i === -1 ? dflt : Number(rest[i + 1]);
	};
	const warmup = flag("warmup", 5);
	const iterations = flag("iterations", 30);
	const coldOnly = rest.includes("--cold-only");
	const outIdx = rest.indexOf("--out");
	const outDir = outIdx === -1 ? null : rest[outIdx + 1];

	const result: RunResult = { engine: engineId, label: engineId, case: kase };

	try {
		const t0 = performance.now();
		const fonts = fontsFor(kase);
		const t1 = performance.now();

		const mod = await loadEngine(engineId);
		const t2 = performance.now();
		result.label = mod.label;

		const engine: Engine = await mod.create(fonts);
		const t3 = performance.now();

		const coldProps = propsFor(kase, 1)[0];
		await engine.render(coldProps, mod.formats[0]);
		const t4 = performance.now();

		result.cold = {
			fontsMs: t1 - t0,
			importMs: t2 - t1,
			setupMs: t3 - t2,
			firstRenderMs: t4 - t3,
			totalSinceProcessStartMs: t4,
		};

		if (!coldOnly) {
			const props = propsFor(kase, warmup + iterations);
			result.warm = {};

			for (const format of mod.formats) {
				for (let i = 0; i < warmup; i++) await engine.render(props[i], format);

				const samples: number[] = [];
				let last: Uint8Array = new Uint8Array();
				for (let i = 0; i < iterations; i++) {
					const p = props[warmup + i];
					const start = performance.now();
					last = await engine.render(p, format);
					samples.push(performance.now() - start);
				}

				result.warm[format] = {
					...summarize(samples),
					bytes: last.byteLength,
					note: mod.formatNotes?.[format],
				};

				if (outDir) {
					mkdirSync(outDir, { recursive: true });
					writeFileSync(
						join(outDir, `${engineId}-${kase}.${EXT[format]}`),
						Buffer.from(last),
					);
				}
			}
		}

		result.maxRssMb = process.resourceUsage().maxRSS / 1024;
		await engine.dispose?.();
	} catch (err) {
		result.error = err instanceof Error ? `${err.message}` : String(err);
	}

	// The parent reads stdout as JSON; anything an engine logged goes to stderr.
	process.stdout.write(`${JSON.stringify(result)}\n`);
	// Chromium and the napi worker pool keep handles alive; the numbers are in.
	process.exit(0);
}

main();
