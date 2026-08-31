import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { Card } from "../card.js";
import { HEIGHT, WIDTH, type EngineModule } from "../types.js";

/** The classic pipeline: satori emits SVG, resvg (Rust, native binding) rasterizes it. */
const mod: EngineModule = {
	id: "satori-resvg",
	label: "satori + @resvg/resvg-js (native)",
	formats: ["png"],
	async create(fonts) {
		const satoriFonts = fonts.map((f) => ({
			name: f.name,
			data: f.data,
			weight: f.weight,
			style: f.style,
		}));

		return {
			id: mod.id,
			label: mod.label,
			formats: mod.formats,
			async render(props) {
				const svg = await satori(Card(props), {
					width: WIDTH,
					height: HEIGHT,
					fonts: satoriFonts,
				});
				// loadSystemFonts is off: satori embeds glyphs as paths, so resvg
				// never needs to resolve a family, and scanning fontconfig would
				// add tens of milliseconds of unrelated work.
				const resvg = new Resvg(svg, { font: { loadSystemFonts: false } });
				return resvg.render().asPng();
			},
		};
	},
};

export default mod;
