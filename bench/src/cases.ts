import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CardProps, LoadedFonts } from "./types.js";

const fontsDir = fileURLToPath(new URL("../assets/fonts/", import.meta.url));
const read = (f: string) => readFileSync(fontsDir + f);

export type CaseId = "latin" | "japanese" | "photo";

/** Where the background photo lives, for engines that would rather serve it than inline it. */
export const PHOTO_PATH = fileURLToPath(new URL("../assets/photo.jpg", import.meta.url));

let photoUri: string | null = null;
/** 1200×630 JPEG as a data URI — the only way to hand a photo to satori or takumi. */
export function photoDataUri(): string {
	photoUri ??= `data:image/jpeg;base64,${readFileSync(PHOTO_PATH).toString("base64")}`;
	return photoUri;
}

/**
 * Each case ships a pool of titles rather than one. Real traffic never renders
 * the same string twice in a row, and reusing one string lets an engine's glyph
 * cache flatter itself.
 */
const LATIN_TITLES = [
	"Generating Open Graph images at request time without a headless browser",
	"Why your PNG social card is 1.2 MB and what to do about it",
	"Typed template props: a contract between your CMS and your renderer",
	"Cold starts are the whole story for per-request image generation",
	"Font subsetting is the cheapest win in dynamic image rendering",
	"Flexbox-only layout engines and the designs they quietly refuse",
];

const TITLES: Record<CaseId, string[]> = {
	latin: LATIN_TITLES,
	// Same words as `latin`: the photo case exists to change the pixels, not the text.
	photo: LATIN_TITLES,
	japanese: [
		"ヘッドレスブラウザなしでリクエスト単位のOGP画像を生成する",
		"あなたのソーシャルカードが1.2MBある理由と、その直し方",
		"型付きテンプレートpropsという、CMSとレンダラの間の契約",
		"リクエスト単位生成ではコールドスタートがすべてを決める",
		"動的画像生成でいちばん安上がりな最適化はフォントのサブセット化",
		"Flexboxしか持たないレイアウトエンジンが静かに拒むデザイン",
	],
};

const LATIN_BASE: Omit<CardProps, "title"> = {
	site: "ogp-lab.dev",
	author: "Shuya",
	date: "August 31, 2026",
	tags: ["Rust", "WASM", "OGP"],
	accent: "#38bdf8",
};

const BASE: Record<CaseId, Omit<CardProps, "title">> = {
	latin: LATIN_BASE,
	photo: LATIN_BASE,
	japanese: {
		site: "ogp-lab.dev",
		author: "しゅうや",
		date: "2026年8月31日",
		tags: ["Rust", "WASM", "OGP"],
		accent: "#38bdf8",
	},
};

/** `n` distinct prop sets, cycling through the case's title pool. */
export function propsFor(caseId: CaseId, n: number): CardProps[] {
	const titles = TITLES[caseId];
	const background = caseId === "photo" ? photoDataUri() : undefined;
	return Array.from({ length: n }, (_, i) => ({
		...BASE[caseId],
		title: titles[i % titles.length],
		background,
	}));
}

export function fontsFor(caseId: CaseId): LoadedFonts {
	const inter: LoadedFonts = [
		{ name: "Inter", weight: 400, style: "normal", data: read("Inter_400Regular.ttf") },
		{ name: "Inter", weight: 700, style: "normal", data: read("Inter_700Bold.ttf") },
	];
	if (caseId !== "japanese") return inter;
	return [
		...inter,
		{ name: "Noto Sans JP", weight: 400, style: "normal", data: read("NotoSansJP_400Regular.ttf") },
		{ name: "Noto Sans JP", weight: 700, style: "normal", data: read("NotoSansJP_700Bold.ttf") },
	];
}
