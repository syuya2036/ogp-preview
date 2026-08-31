/**
 * Orchestrator. Spawns one child process per (engine, case) so that no engine
 * ever measures its cold start in a process another engine has already warmed.
 *
 * Usage: node dist/bench.js [--engines a,b] [--cases latin,japanese]
 *        [--iterations 30] [--warmup 5] [--cold-runs 3]
 */
import { execFile } from "node:child_process";
import { cpus, totalmem } from "node:os";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { CaseId } from "./cases.js";
import { renderReport } from "./report.js";
import { ENGINE_IDS, isEngineId, type EngineId } from "./registry.js";
import type { ColdResult, RunResult } from "./run-one.js";
import { median } from "./stats.js";

const run = promisify(execFile);
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const argv = process.argv.slice(2);
const opt = (name: string, dflt: string) => {
	const i = argv.indexOf(`--${name}`);
	return i === -1 ? dflt : argv[i + 1];
};

const engines = opt("engines", ENGINE_IDS.join(",")).split(",").filter(isEngineId);
const cases = opt("cases", "latin,japanese,photo").split(",") as CaseId[];
const iterations = Number(opt("iterations", "30"));
const warmup = Number(opt("warmup", "5"));
const coldRuns = Number(opt("cold-runs", "3"));

const resultsDir = here("../results");
const outDir = here("../out");
const child = here("./run-one.js");

async function runChild(
	engine: EngineId,
	kase: CaseId,
	extra: string[],
): Promise<RunResult> {
	const args = [
		child,
		engine,
		kase,
		"--warmup",
		String(warmup),
		"--iterations",
		String(iterations),
		...extra,
	];
	const { stdout, stderr } = await run(process.execPath, args, {
		maxBuffer: 64 * 1024 * 1024,
		env: { ...process.env, NODE_ENV: "production" },
	});
	const line = stdout.trim().split("\n").pop();
	if (!line) throw new Error(`no output from ${engine}/${kase}: ${stderr}`);
	return JSON.parse(line) as RunResult;
}

/** Field-wise median across the cold samples, so one unlucky process cannot set the number. */
function medianCold(samples: ColdResult[]): ColdResult {
	const pick = (k: keyof ColdResult) => median(samples.map((s) => s[k]));
	return {
		fontsMs: pick("fontsMs"),
		importMs: pick("importMs"),
		setupMs: pick("setupMs"),
		firstRenderMs: pick("firstRenderMs"),
		totalSinceProcessStartMs: pick("totalSinceProcessStartMs"),
	};
}

async function main() {
	mkdirSync(resultsDir, { recursive: true });
	const results: RunResult[] = [];

	for (const kase of cases) {
		for (const engine of engines) {
			process.stderr.write(`▶ ${engine} / ${kase} … `);
			try {
				const full = await runChild(engine, kase, ["--out", outDir]);
				const colds: ColdResult[] = full.cold ? [full.cold] : [];
				for (let i = 1; i < coldRuns && full.cold; i++) {
					const extra = await runChild(engine, kase, ["--cold-only"]);
					if (extra.cold) colds.push(extra.cold);
				}
				if (colds.length) full.cold = medianCold(colds);
				results.push(full);
				process.stderr.write(
					full.error
						? `failed: ${full.error}\n`
						: `cold ${full.cold?.totalSinceProcessStartMs.toFixed(0)} ms, warm p50 ${Object.values(full.warm ?? {})[0]?.p50.toFixed(1)} ms\n`,
				);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				results.push({ engine, label: engine, case: kase, error: message });
				process.stderr.write(`crashed: ${message.split("\n")[0]}\n`);
			}
		}
	}

	const env = [
		`Node ${process.version}, ${process.platform}/${process.arch}`,
		`${cpus().length}× ${cpus()[0]?.model?.trim()}, ${(totalmem() / 1024 ** 3).toFixed(0)} GB RAM`,
	];

	writeFileSync(
		`${resultsDir}/results.json`,
		`${JSON.stringify({ meta: { iterations, warmup, coldRuns, env }, results }, null, 2)}\n`,
	);
	const md = renderReport(results, { iterations, warmup, coldRuns, env });
	writeFileSync(`${resultsDir}/report.md`, `${md}\n`);
	process.stdout.write(`${md}\n`);
}

main();
