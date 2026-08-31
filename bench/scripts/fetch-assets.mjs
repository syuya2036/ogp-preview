/**
 * Downloads the fonts and the background photo the benchmark renders with.
 *
 * These are ~10 MB of third-party binaries, so they are fetched rather than
 * committed. Run `npm run setup` before `npm run bench`.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const ASSETS = [
	{
		path: "assets/fonts/Inter_400Regular.ttf",
		url: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter/Inter_400Regular.ttf",
	},
	{
		path: "assets/fonts/Inter_700Bold.ttf",
		url: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter/Inter_700Bold.ttf",
	},
	{
		path: "assets/fonts/NotoSansJP_400Regular.ttf",
		url: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-sans-jp/NotoSansJP_400Regular.ttf",
	},
	{
		path: "assets/fonts/NotoSansJP_700Bold.ttf",
		url: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-sans-jp/NotoSansJP_700Bold.ttf",
	},
	{
		// Public-domain-ish Wikimedia photo, cropped to card size below.
		path: "assets/photo.jpg",
		url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Fronalpstock_big.jpg/1280px-Fronalpstock_big.jpg",
		resize: { width: 1200, height: 630, quality: 88 },
	},
];

for (const asset of ASSETS) {
	const dest = join(root, asset.path);
	if (existsSync(dest)) {
		console.log(`· ${asset.path} (already present)`);
		continue;
	}
	mkdirSync(dirname(dest), { recursive: true });

	const res = await fetch(asset.url);
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${asset.url}`);
	let bytes = Buffer.from(await res.arrayBuffer());

	if (asset.resize) {
		const { default: sharp } = await import("sharp");
		bytes = await sharp(bytes)
			.resize(asset.resize.width, asset.resize.height, { fit: "cover" })
			.jpeg({ quality: asset.resize.quality })
			.toBuffer();
	}

	writeFileSync(dest, bytes);
	console.log(`↓ ${asset.path} (${(bytes.byteLength / 1024).toFixed(0)} KB)`);
}
