import satori from "satori";
import sharp from "sharp";
import { Card } from "../card.js";
import { HEIGHT, WIDTH, type EngineModule } from "../types.js";

/**
 * Same satori front half, but rasterized by libvips. This is the only satori
 * path that can emit anything other than PNG, which is the whole reason it is
 * in the comparison.
 */
const mod: EngineModule = {
	id: "satori-sharp",
	label: "satori + sharp (libvips)",
	formats: ["png", "webp", "avif"],
	formatNotes: { webp: "quality 80", avif: "quality 60, effort 4" },
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
			async render(props, format) {
				const svg = await satori(Card(props), {
					width: WIDTH,
					height: HEIGHT,
					fonts: satoriFonts,
				});
				const pipeline = sharp(Buffer.from(svg));
				switch (format) {
					case "webp":
						return await pipeline.webp({ quality: 80 }).toBuffer();
					case "avif":
						return await pipeline.avif({ quality: 60, effort: 4 }).toBuffer();
					default:
						return await pipeline.png().toBuffer();
				}
			},
		};
	},
};

export default mod;
