import type { CaseId } from "./cases.js";
import type { ColdResult, RunResult } from "./run-one.js";
import { kb, ms } from "./stats.js";

const CASE_LABEL: Record<CaseId, string> = {
	latin: "Latin — flat gradient (Inter, ~0.6 MB of fonts)",
	japanese: "Japanese — flat gradient (Inter + Noto Sans JP, ~9.7 MB of fonts)",
	photo: "Latin — full-bleed background photo (1200×630 JPEG behind a scrim)",
};

export function renderReport(
	runs: RunResult[],
	meta: { iterations: number; warmup: number; coldRuns: number; env: string[] },
): string {
	const out: string[] = [];
	out.push("# OGP renderer benchmark");
	out.push("");
	out.push(
		`1200×630 card, same design across every engine. ${meta.iterations} measured renders after ${meta.warmup} warmups; cold start is the median of ${meta.coldRuns} fresh processes.`,
	);
	out.push("");
	out.push("Environment:");
	out.push("");
	for (const line of meta.env) out.push(`- ${line}`);
	out.push("");

	const cases = [...new Set(runs.map((r) => r.case))];

	for (const kase of cases) {
		const rows = runs.filter((r) => r.case === kase);
		out.push(`## ${CASE_LABEL[kase]}`);
		out.push("");

		out.push("### Cold start (fresh process, one image)");
		out.push("");
		out.push(
			"| engine | fonts read | import | setup | first render | total from process start |",
		);
		out.push("| --- | ---: | ---: | ---: | ---: | ---: |");
		for (const r of rows) {
			if (!r.cold) {
				out.push(`| ${r.label} | — | — | — | — | **failed** |`);
				continue;
			}
			const c: ColdResult = r.cold;
			out.push(
				`| ${r.label} | ${ms(c.fontsMs)} ms | ${ms(c.importMs)} ms | ${ms(c.setupMs)} ms | ${ms(c.firstRenderMs)} ms | **${ms(c.totalSinceProcessStartMs)} ms** |`,
			);
		}
		out.push("");

		out.push("### Warm renders");
		out.push("");
		out.push("| engine | format | p50 | p90 | p99 | mean | size | peak RSS |");
		out.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
		for (const r of rows) {
			if (r.error) {
				out.push(`| ${r.label} | — | — | — | — | — | — | ${r.error} |`);
				continue;
			}
			for (const [format, f] of Object.entries(r.warm ?? {})) {
				const fmt = f.note ? `${format} <sub>${f.note}</sub>` : format;
				out.push(
					`| ${r.label} | ${fmt} | **${ms(f.p50)} ms** | ${ms(f.p90)} ms | ${ms(f.p99)} ms | ${ms(f.mean)} ms | ${kb(f.bytes)} KB | ${r.maxRssMb ? `${r.maxRssMb.toFixed(0)} MB` : "—"} |`,
				);
			}
		}
		out.push("");
	}

	return out.join("\n");
}
