import { styles, toCss } from "./design.js";
import type { CardProps } from "./types.js";

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The Chromium counterpart of `Card`, built from the same style objects. */
export function cardHtml(props: CardProps): string {
	const s = styles(props);
	const d = (style: object, inner: string) =>
		`<div style="${toCss(style as never)}">${inner}</div>`;

	return (
		d(
			s.root,
			d(s.header, d(s.logo, "") + d(s.site, esc(props.site))) +
				d(s.body, d(s.rule, "") + d(s.title, esc(props.title))) +
				d(
					s.footer,
					d(s.avatar, esc(props.author.slice(0, 1))) +
						d(s.meta, d(s.author, esc(props.author)) + d(s.date, esc(props.date))) +
						d(s.tags, props.tags.map((t) => d(s.tag, esc(t))).join("")),
				),
		)
	);
}

/**
 * Full page shell. Fonts are served over the local origin rather than inlined as
 * data URIs so Chromium can cache them across renders — the same thing a real
 * screenshot service does.
 */
export function pageHtml(): string {
	return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
@font-face{font-family:Inter;src:url(/fonts/Inter_400Regular.ttf) format("truetype");font-weight:400;font-display:block}
@font-face{font-family:Inter;src:url(/fonts/Inter_700Bold.ttf) format("truetype");font-weight:700;font-display:block}
@font-face{font-family:"Noto Sans JP";src:url(/fonts/NotoSansJP_400Regular.ttf) format("truetype");font-weight:400;font-display:block}
@font-face{font-family:"Noto Sans JP";src:url(/fonts/NotoSansJP_700Bold.ttf) format("truetype");font-weight:700;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
</style></head>
<body><div id="root"></div></body></html>`;
}
