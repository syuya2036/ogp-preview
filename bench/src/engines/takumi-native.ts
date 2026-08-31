import { Renderer } from "@takumi-rs/core";
import { fromJsx } from "@takumi-rs/helpers/jsx";
import { Card } from "../card.js";
import { HEIGHT, WIDTH, type EngineModule, type OutFormat } from "../types.js";

/** The runner only asks for `formats`, but takumi's own union excludes AVIF. */
const takumiFormat = (f: OutFormat) => {
	if (f === "avif") throw new Error("takumi cannot encode AVIF");
	return f;
};

/**
 * One Rust engine for the whole pipeline: JSX tree in, encoded bytes out, with
 * no SVG in between. Fonts are registered once on a long-lived Renderer, which
 * is what a server would do.
 */
const mod: EngineModule = {
	id: "takumi-native",
	label: "takumi @takumi-rs/core (napi)",
	formats: ["png", "webp", "jpeg"],
	formatNotes: { webp: "quality 80 (lossy)", jpeg: "quality 80" },
	async create(fonts) {
		const renderer = new Renderer();
		for (const f of fonts) {
			await renderer.registerFont({
				name: f.name,
				data: f.data,
				weight: f.weight,
				style: f.style,
			});
		}

		return {
			id: mod.id,
			label: mod.label,
			formats: mod.formats,
			async render(props, format) {
				const { node, css } = await fromJsx(Card(props));
				return await renderer.render(node, {
					width: WIDTH,
					height: HEIGHT,
					format: takumiFormat(format),
					quality: format === "png" ? undefined : 80,
					css,
				});
			},
		};
	},
};

export default mod;
