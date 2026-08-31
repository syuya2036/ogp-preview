/**
 * Shared contract every renderer adapter implements, so the benchmark can treat
 * satori, takumi and a headless browser as interchangeable.
 */

export type OutFormat = "png" | "webp" | "jpeg" | "avif";

export interface CardProps {
	site: string;
	title: string;
	author: string;
	date: string;
	tags: string[];
	accent: string;
	/**
	 * CSS `url()` target for a full-bleed background photo, or undefined for the
	 * flat gradient. Engines may substitute an equivalent source: the data URI
	 * that satori and takumi need is not what a browser-based service would use.
	 */
	background?: string;
}

export interface FontFace {
	name: string;
	weight: 400 | 700;
	style: "normal";
	data: Buffer;
}

/**
 * The faces an engine registers at boot. Kept per case: the Latin case pays for
 * ~0.6 MB of Inter, the Japanese case for ~9.7 MB of Inter + Noto Sans JP, and
 * that difference is one of the things worth measuring.
 */
export type LoadedFonts = FontFace[];

export interface Engine {
	id: string;
	label: string;
	/** Formats this engine can emit natively; the runner only benches these. */
	formats: OutFormat[];
	/** Build the element/tree from props and produce encoded image bytes. */
	render(props: CardProps, format: OutFormat): Promise<Uint8Array>;
	dispose?(): Promise<void>;
}

export interface EngineModule {
	id: string;
	label: string;
	formats: OutFormat[];
	/** Encoder settings worth printing next to a size number, e.g. "quality 80". */
	formatNotes?: Partial<Record<OutFormat, string>>;
	/** Everything a long-lived server would do once at boot (font registration, browser launch). */
	create(fonts: LoadedFonts): Promise<Engine>;
}

export const WIDTH = 1200;
export const HEIGHT = 630;
