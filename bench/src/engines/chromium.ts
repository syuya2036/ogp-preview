import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { chromium, type Browser, type Page } from "playwright-core";
import { cardHtml, pageHtml } from "../card-html.js";
import { PHOTO_PATH } from "../cases.js";
import { HEIGHT, WIDTH, type CardProps, type EngineModule } from "../types.js";

const EXECUTABLE =
	process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Throwaway props used only for the font-resolution guard below. */
const probe: CardProps = {
	site: "probe",
	title: "probe",
	author: "P",
	date: "probe",
	tags: ["probe"],
	accent: "#38bdf8",
};

/**
 * The accuracy baseline: real CSS, real font shaping, real everything. Served
 * over a local origin so Chromium caches the fonts, and driven through one
 * long-lived page — the most favourable setup a screenshot service can have.
 */
const mod: EngineModule = {
	id: "chromium",
	label: "headless Chromium (playwright)",
	formats: ["png", "jpeg"],
	formatNotes: { jpeg: "quality 80" },
	async create(fonts) {
		const server = await startServer(fonts);
		const port = (server.address() as { port: number }).port;

		const browser: Browser = await chromium.launch({
			executablePath: EXECUTABLE,
			args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
		});
		const page: Page = await browser.newPage({
			viewport: { width: WIDTH, height: HEIGHT },
			deviceScaleFactor: 1,
		});
		await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load" });
		// Pull the faces this case actually registered into the font cache now,
		// so a warm render never pays for a font fetch. Asking for a family the
		// case did not load would 404 and reject.
		const specs = [...new Set(fonts.map((f) => f.name))].flatMap((family) => {
			const name = family.includes(" ") ? `"${family}"` : family;
			return [`400 24px ${name}`, `700 64px ${name}`];
		});
		await page.evaluate(async (list) => {
			await Promise.all(list.map((s) => document.fonts.load(s)));
			await document.fonts.ready;
		}, specs);

		// Guard: a malformed style attribute silently drops the font stack and
		// Chromium rasterizes the card in a serif fallback, which is both faster
		// and a different image. Fail loudly instead of publishing that number.
		const usedFamily = await page.evaluate((html) => {
			const root = document.getElementById("root");
			if (root) root.innerHTML = html;
			const title = root?.querySelector("div:nth-child(2) > div:nth-child(2)");
			return title ? getComputedStyle(title).fontFamily : "";
		}, cardHtml(probe));
		if (!usedFamily.includes("Inter")) {
			throw new Error(`title did not resolve to Inter, got: ${usedFamily || "(none)"}`);
		}

		return {
			id: mod.id,
			label: mod.label,
			formats: mod.formats,
			async render(props, format) {
				// satori and takumi can only take the photo as a data URI; a real
				// screenshot service would point Chromium at a cached URL, so give
				// it one rather than re-parsing 290 KB of base64 every render.
				const html = cardHtml(
					props.background?.startsWith("data:")
						? { ...props, background: "/photo.jpg" }
						: props,
				);
				await page.evaluate((h) => {
					const root = document.getElementById("root");
					if (root) root.innerHTML = h;
				}, html);
				const buf = await page.screenshot({
					type: format === "jpeg" ? "jpeg" : "png",
					quality: format === "jpeg" ? 80 : undefined,
					clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
				});
				return new Uint8Array(buf);
			},
			async dispose() {
				await browser.close();
				await new Promise<void>((r) => server.close(() => r()));
			},
		};
	},
};

function startServer(fonts: { name: string; weight: number; data: Buffer }[]) {
	// Serve by filename so the @font-face rules in pageHtml resolve; faces the
	// case did not load simply 404 and go unused.
	const byFile = new Map<string, Buffer>();
	for (const f of fonts) {
		const file =
			f.name === "Inter"
				? f.weight === 700
					? "Inter_700Bold.ttf"
					: "Inter_400Regular.ttf"
				: f.weight === 700
					? "NotoSansJP_700Bold.ttf"
					: "NotoSansJP_400Regular.ttf";
		byFile.set(file, f.data);
	}

	const photo = readFileSync(PHOTO_PATH);

	const server = createServer((req, res) => {
		const url = req.url ?? "/";
		if (url === "/photo.jpg") {
			res.writeHead(200, {
				"content-type": "image/jpeg",
				"cache-control": "public, max-age=31536000",
			});
			res.end(photo);
			return;
		}
		if (url.startsWith("/fonts/")) {
			const buf = byFile.get(url.slice("/fonts/".length));
			if (!buf) {
				res.writeHead(404).end();
				return;
			}
			res.writeHead(200, {
				"content-type": "font/ttf",
				"cache-control": "public, max-age=31536000",
			});
			res.end(buf);
			return;
		}
		res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
		res.end(pageHtml());
	});

	return new Promise<Server>((resolve) => {
		server.listen(0, "127.0.0.1", () => resolve(server));
	});
}

export default mod;
