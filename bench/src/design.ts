import type { CSSProperties } from "react";
import type { CardProps } from "./types.js";

/**
 * The card's styles live here as plain objects so the JSX template (satori,
 * @vercel/og, takumi) and the HTML template (headless Chromium) render the same
 * design from the same source. If these drift, the benchmark stops being a
 * comparison.
 *
 * Everything here is deliberately restricted to what satori supports — flexbox
 * only, inline styles, no grid, no pseudo-elements — so that the fastest engine
 * is not simply the one being asked to do less.
 */

export const FONT_STACK = 'Inter, "Noto Sans JP"';

export const styles = (p: CardProps) =>
	({
		root: {
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			width: "1200px",
			height: "630px",
			padding: "64px",
			backgroundColor: "#0b1020",
			// With a photo, the gradient becomes a flat scrim layered over it so
			// the text stays legible — the layout is otherwise identical, which
			// keeps the flat and photographic cases comparable.
			backgroundImage: p.background
				? `linear-gradient(rgba(6,10,24,0.72), rgba(6,10,24,0.72)), url(${p.background})`
				: "linear-gradient(135deg, #0b1020 0%, #17223f 55%, #1e2a4a 100%)",
			backgroundSize: "1200px 630px",
			color: "#ffffff",
			fontFamily: FONT_STACK,
		},

		header: { display: "flex", alignItems: "center", gap: "20px" },
		logo: {
			display: "flex",
			width: "56px",
			height: "56px",
			borderRadius: "16px",
			backgroundColor: p.accent,
		},
		site: {
			display: "flex",
			fontSize: "28px",
			fontWeight: 700,
			letterSpacing: "0.02em",
			color: "#cbd5e1",
		},

		body: {
			display: "flex",
			flexDirection: "column",
			gap: "24px",
			overflow: "hidden",
		},
		title: {
			display: "flex",
			fontSize: "64px",
			fontWeight: 700,
			lineHeight: 1.25,
			letterSpacing: "-0.01em",
		},
		rule: {
			display: "flex",
			width: "120px",
			height: "6px",
			borderRadius: "3px",
			backgroundColor: p.accent,
		},

		footer: { display: "flex", alignItems: "center", gap: "24px" },
		avatar: {
			display: "flex",
			width: "64px",
			height: "64px",
			borderRadius: "32px",
			backgroundColor: "#334155",
			alignItems: "center",
			justifyContent: "center",
			fontSize: "28px",
			fontWeight: 700,
			color: "#e2e8f0",
		},
		meta: { display: "flex", flexDirection: "column", gap: "4px" },
		author: { display: "flex", fontSize: "30px", fontWeight: 700 },
		date: { display: "flex", fontSize: "24px", color: "#94a3b8" },
		tags: { display: "flex", marginLeft: "auto", gap: "12px" },
		tag: {
			display: "flex",
			paddingTop: "10px",
			paddingBottom: "10px",
			paddingLeft: "22px",
			paddingRight: "22px",
			borderRadius: "999px",
			border: "2px solid #334155",
			backgroundColor: "#111a30",
			fontSize: "22px",
			color: "#cbd5e1",
		},
	}) satisfies Record<string, CSSProperties>;

const KEBAB = /[A-Z]/g;
const UNITLESS = new Set(["fontWeight", "lineHeight", "opacity", "zIndex", "flex"]);

/**
 * Serialize one of the style objects above into a CSS declaration string for a
 * `style="..."` attribute. Double quotes become single quotes so a quoted font
 * family cannot close the attribute early — which silently drops the whole
 * font stack and rasterizes the card in a serif fallback.
 */
export function toCss(style: CSSProperties): string {
	return Object.entries(style)
		.map(([k, v]) => {
			const prop = k.replace(KEBAB, (c) => `-${c.toLowerCase()}`);
			const value = typeof v === "number" && !UNITLESS.has(k) ? `${v}px` : v;
			return `${prop}:${String(value).replace(/"/g, "'")}`;
		})
		.join(";");
}
